-- Prisma drift fix-up auto-generated alongside 20260514020000_plan_sharing.
-- The hand-written prior migration created FKs with `ON UPDATE NO ACTION`
-- (matching the convention of the original 0_init baseline). Modern Prisma
-- defaults to `ON UPDATE CASCADE` for relations declared `onDelete: Cascade`,
-- and rewrites the FKs on `migrate dev` to keep the DB in lock-step with
-- the schema. Same pattern as 20260514013319_bk_refactor_1, which did the
-- same FK rewrite for the master_data + investor_* join tables.

-- DropForeignKey
ALTER TABLE "plan_comments" DROP CONSTRAINT "plan_comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "plan_comments" DROP CONSTRAINT "plan_comments_share_id_fkey";

-- DropForeignKey
ALTER TABLE "plan_shares" DROP CONSTRAINT "plan_shares_advisor_id_fkey";

-- DropForeignKey
ALTER TABLE "plan_shares" DROP CONSTRAINT "plan_shares_plan_id_fkey";

-- AddForeignKey
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "financial_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_comments" ADD CONSTRAINT "plan_comments_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "plan_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_comments" ADD CONSTRAINT "plan_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
