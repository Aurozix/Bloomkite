-- AlterTable
ALTER TABLE "advisor_profiles" ADD COLUMN     "rating_average" DECIMAL(3,2),
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "advisor_ratings" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "advisor_id" UUID NOT NULL,
    "investor_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "review_body" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_question_advisor_tags" (
    "question_id" UUID NOT NULL,
    "advisor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_question_advisor_tags_pkey" PRIMARY KEY ("question_id","advisor_id")
);

-- CreateIndex
CREATE INDEX "idx_advisor_ratings_advisor_recent" ON "advisor_ratings"("advisor_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "advisor_ratings_investor_id_advisor_id_key" ON "advisor_ratings"("investor_id", "advisor_id");

-- CreateIndex
CREATE INDEX "idx_forum_tag_advisor_recent" ON "forum_question_advisor_tags"("advisor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_advisor_brand_brand" ON "advisor_brands"("brand_id");

-- CreateIndex
CREATE INDEX "idx_advisor_product_product" ON "advisor_products"("product_id");

-- CreateIndex
CREATE INDEX "idx_advisor_profiles_rating_average" ON "advisor_profiles"("rating_average" DESC);

-- CreateIndex
CREATE INDEX "idx_advisor_service_service" ON "advisor_services"("service_id");

-- AddForeignKey
ALTER TABLE "advisor_products" ADD CONSTRAINT "advisor_products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_services" ADD CONSTRAINT "advisor_services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_brands" ADD CONSTRAINT "advisor_brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_ratings" ADD CONSTRAINT "advisor_ratings_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_ratings" ADD CONSTRAINT "advisor_ratings_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_question_advisor_tags" ADD CONSTRAINT "forum_question_advisor_tags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "forum_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_question_advisor_tags" ADD CONSTRAINT "forum_question_advisor_tags_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
