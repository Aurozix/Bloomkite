-- BRD §3.1 step 5 — Setup Financial Accounts. Investor declares which
-- account types they hold (Bank Savings, Demat, PPF, ...) with an optional
-- institution name. Deliberately no balance/amount columns — Bloomkite is an
-- advisor-discovery platform, not a portfolio tracker, and BRD §8.5 forbids
-- capturing data we don't need.

CREATE TABLE "investor_financial_accounts" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "account_type_id" UUID NOT NULL,
    "institution_name" VARCHAR(200),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_financial_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "investor_financial_accounts_account_type_id_fkey" FOREIGN KEY ("account_type_id")
        REFERENCES "master_data_account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_inv_fin_acct_user" ON "investor_financial_accounts"("user_id");
