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
