-- CreateTable
CREATE TABLE "master_data_urgency_levels" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_urgency_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_calculator_categories" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_calculator_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_data_urgency_levels_slug_key" ON "master_data_urgency_levels"("slug");

-- CreateIndex
CREATE INDEX "idx_md_urgency_order" ON "master_data_urgency_levels"("sort_order", "name");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_calculator_categories_slug_key" ON "master_data_calculator_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_md_calc_cat_order" ON "master_data_calculator_categories"("sort_order", "name");
