-- BRD §3.2 step 3 — Professional Information. Three new columns on
-- advisor_profiles. Nullable for backwards-compat with existing pending
-- advisor rows; admin gate enforces non-null before promoting workflow_status
-- to 'approved'.

ALTER TABLE "advisor_profiles"
    ADD COLUMN "years_of_experience" INTEGER,
    ADD COLUMN "license_registration_number" VARCHAR(100),
    ADD COLUMN "license_registration_body" VARCHAR(100);
