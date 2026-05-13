-- BRD §8.1 (Adults Only): add date-of-birth to users. Nullable so the rollout
-- is backwards-compatible; signup and activation paths enforce 18+ on write.
-- InvestorProfile and AdvisorProfile keep their own date_of_birth columns as
-- denormalised copies for historical reasons; new writes set both.
ALTER TABLE "users" ADD COLUMN "date_of_birth" DATE;
