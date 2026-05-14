-- BRD §3.2 step 4 — split advisor credentials into 4 classes (Certifications,
-- Awards, Education, Experience). One table with a discriminator + class-
-- specific nullable columns. Existing rows were all certification-shaped,
-- so we backfill credential_class='CERTIFICATION' for every row before
-- dropping the default.

ALTER TABLE "advisor_credentials"
    ADD COLUMN "credential_class" VARCHAR(50) NOT NULL DEFAULT 'CERTIFICATION',
    ADD COLUMN "award_year" INTEGER,
    ADD COLUMN "start_date" DATE,
    ADD COLUMN "end_date" DATE;

CREATE INDEX "idx_advisor_credentials_class" ON "advisor_credentials"("credential_class");
