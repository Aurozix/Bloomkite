-- ============================================================================
-- Denormalized follower_count on advisor_profiles + maintenance trigger.
-- Enables order-by-followers in advisor search without per-row aggregation.
-- ============================================================================

ALTER TABLE public.advisor_profiles
  ADD COLUMN IF NOT EXISTS follower_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_advisor_profiles_follower_count
  ON public.advisor_profiles(follower_count DESC);

-- Backfill from existing advisor_followers rows. Idempotent — re-computes the
-- truth from the source of truth each time this migration is applied.
WITH counts AS (
  SELECT advisor_id, COUNT(*)::INT AS c
  FROM public.advisor_followers
  GROUP BY advisor_id
)
UPDATE public.advisor_profiles ap
SET follower_count = COALESCE(counts.c, 0)
FROM counts
WHERE ap.user_id = counts.advisor_id;

-- Trigger function: keep follower_count in sync on insert/delete.
CREATE OR REPLACE FUNCTION public.tg_advisor_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advisor_profiles
      SET follower_count = follower_count + 1
      WHERE user_id = NEW.advisor_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advisor_profiles
      SET follower_count = GREATEST(follower_count - 1, 0)
      WHERE user_id = OLD.advisor_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_advisor_followers_count
  ON public.advisor_followers;

CREATE TRIGGER tg_advisor_followers_count
  AFTER INSERT OR DELETE ON public.advisor_followers
  FOR EACH ROW EXECUTE FUNCTION public.tg_advisor_follower_count();
