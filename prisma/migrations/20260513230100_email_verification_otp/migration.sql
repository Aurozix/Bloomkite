-- BRD §3.1 — 6-digit email OTP for signup. Separate table from
-- verification_tokens (Auth.js-owned) because the existing token column has a
-- single-column UNIQUE constraint that doesn't fit OTPs (1M possibilities,
-- realistic collision rate).

CREATE TABLE "email_verification_otps" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_email_otp_email" ON "email_verification_otps"("email");
CREATE INDEX "idx_email_otp_expires" ON "email_verification_otps"("expires_at");
