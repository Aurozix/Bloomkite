-- BRD §8.1 — Email + Phone OTP. Adds phone columns to users and a
-- dedicated OTP table for phone verification.

ALTER TABLE "users"
    ADD COLUMN "phone_number" VARCHAR(20),
    ADD COLUMN "phone_verified_at" TIMESTAMP(6);

CREATE TABLE "phone_verification_otps" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verification_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_phone_otp_user" ON "phone_verification_otps"("user_id");
CREATE INDEX "idx_phone_otp_expires" ON "phone_verification_otps"("expires_at");
