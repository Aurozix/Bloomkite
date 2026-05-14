-- DropForeignKey
ALTER TABLE "advisor_brands" DROP CONSTRAINT "advisor_brands_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "advisor_products" DROP CONSTRAINT "advisor_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "advisor_services" DROP CONSTRAINT "advisor_services_service_id_fkey";

-- DropForeignKey
ALTER TABLE "investor_financial_accounts" DROP CONSTRAINT "investor_financial_accounts_account_type_id_fkey";

-- DropForeignKey
ALTER TABLE "investor_investment_interests" DROP CONSTRAINT "investor_investment_interests_category_id_fkey";

-- DropIndex
DROP INDEX "idx_advisor_credentials_class";

-- AddForeignKey
ALTER TABLE "investor_investment_interests" ADD CONSTRAINT "investor_investment_interests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "master_data_investment_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_products" ADD CONSTRAINT "advisor_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "master_data_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_services" ADD CONSTRAINT "advisor_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "master_data_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_brands" ADD CONSTRAINT "advisor_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "master_data_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_financial_accounts" ADD CONSTRAINT "investor_financial_accounts_account_type_id_fkey" FOREIGN KEY ("account_type_id") REFERENCES "master_data_account_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
