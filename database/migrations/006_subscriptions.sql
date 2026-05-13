-- ============================================================================
-- SPRINT 4: SUBSCRIPTIONS, PLANS, INVOICES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- subscription_plans: 3 tiers (Free / Silver / Gold). Seeded by this migration.
-- features stored as JSONB so the gating layer can read a single record.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_inr_paise BIGINT NOT NULL DEFAULT 0,
  -- Razorpay's API uses paise (1 INR = 100 paise). Storing in paise avoids
  -- decimal-rounding bugs on the wire and matches Razorpay's representation.
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.subscription_plans (slug, name, price_inr_paise, billing_period, features)
VALUES
  ('free', 'Free', 0, 'unlimited',
   '{"max_calculators":5,"plan_sharing":false,"priority_support":false,"consultation_credits":0}'::jsonb),
  ('silver', 'Silver', 29900, 'monthly',
   '{"max_calculators":15,"plan_sharing":true,"priority_support":true,"consultation_credits":0}'::jsonb),
  ('gold', 'Gold', 99900, 'monthly',
   '{"max_calculators":15,"plan_sharing":true,"priority_support":true,"consultation_credits":1}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug
  ON public.subscription_plans(slug);

-- ----------------------------------------------------------------------------
-- subscriptions: one record per (user, period). Status tracks lifecycle.
-- The current/active row for a user is the most recent row with status='active'
-- AND current_period_end > now().
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed')),
  -- Razorpay identifiers — populated once we hit the real API. Stored on the
  -- subscription row rather than as a separate payment intent table to keep
  -- the MVP shape flat.
  razorpay_order_id VARCHAR(100),
  razorpay_subscription_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
  ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_order
  ON public.subscriptions(razorpay_order_id);

-- ----------------------------------------------------------------------------
-- invoices: one row per successful charge. Webhook handler inserts on payment
-- success; PDF generation can be added later.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_inr_paise BIGINT NOT NULL,
  razorpay_payment_id VARCHAR(100),
  razorpay_invoice_id VARCHAR(100),
  pdf_url TEXT,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id
  ON public.invoices(subscription_id);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Subscription plans: public read (pricing page needs them anonymously).
CREATE POLICY "subscription_plans_public_read"
  ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- Subscriptions: user reads their own.
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: user can create their own (anon client + auth header).
CREATE POLICY "subscriptions_insert_own"
  ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: user can cancel their own (status -> cancelled). The webhook
-- handler runs with service-role to make broader status transitions.
CREATE POLICY "subscriptions_update_own"
  ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Invoices: user reads their own.
CREATE POLICY "invoices_select_own"
  ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);
