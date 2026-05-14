-- BRD §3.3, §5.3, §11.2 — plan sharing. The platform's headline differentiator:
-- an investor shares a saved FinancialPlan with up to N advisors (BRD §8.1
-- caps N at 5; enforced in app code, not via DB constraint). Each advisor
-- gets a permission grant (VIEW or COMMENT) and can post comments only when
-- COMMENT is granted. BRD §8.5 requires advisors NOT see other advisors'
-- feedback — comments are scoped to a single PlanShare row, and PlanShare is
-- unique per (plan, advisor), so no cross-advisor query path exists.

CREATE TABLE "plan_shares" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "plan_id" UUID NOT NULL,
    "advisor_id" UUID NOT NULL,
    "permission" VARCHAR(20) NOT NULL DEFAULT 'COMMENT',
    "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "viewed_at" TIMESTAMP(6),
    "reviewed_at" TIMESTAMP(6),
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_shares_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plan_shares_plan_id_fkey" FOREIGN KEY ("plan_id")
        REFERENCES "financial_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "plan_shares_advisor_id_fkey" FOREIGN KEY ("advisor_id")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- One share row per (plan, advisor). Re-sharing after revoke flips status
-- back to NEW on the existing row rather than inserting a duplicate.
CREATE UNIQUE INDEX "plan_shares_plan_id_advisor_id_key"
    ON "plan_shares"("plan_id", "advisor_id");

-- Advisor inbox: list active shares for me, newest first.
CREATE INDEX "idx_plan_shares_advisor_status"
    ON "plan_shares"("advisor_id", "status");

-- Investor's active-shares-per-plan lookup (the BRD §8.1 cap check).
CREATE INDEX "idx_plan_shares_plan_status"
    ON "plan_shares"("plan_id", "status");

CREATE TABLE "plan_comments" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "share_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plan_comments_share_id_fkey" FOREIGN KEY ("share_id")
        REFERENCES "plan_shares"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "plan_comments_author_id_fkey" FOREIGN KEY ("author_id")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Comment thread for a share, oldest-first (chat order).
CREATE INDEX "idx_plan_comments_share_created"
    ON "plan_comments"("share_id", "created_at");

CREATE INDEX "idx_plan_comments_author"
    ON "plan_comments"("author_id");
