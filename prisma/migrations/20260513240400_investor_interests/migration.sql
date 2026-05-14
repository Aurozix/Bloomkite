-- BRD §3.1 step 4 — Investor declares investment interests (categories they
-- care about). M:N to master_data_investment_categories, no priority.

CREATE TABLE "investor_investment_interests" (
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_investment_interests_pkey" PRIMARY KEY ("user_id", "category_id"),
    CONSTRAINT "investor_investment_interests_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "master_data_investment_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_investor_interest_user" ON "investor_investment_interests"("user_id");
