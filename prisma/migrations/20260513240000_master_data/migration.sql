-- Master-data foundation (BRD §3.1 step 4-5, §3.2 step 5, Gap §9).
-- Five domains land together: investment categories, products, services,
-- brands, account types. Each table has the same shape — admin CRUD can
-- share a component, and future master-data domains follow the same pattern.

CREATE TABLE "master_data_investment_categories" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_investment_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_data_investment_categories_slug_key" ON "master_data_investment_categories"("slug");
CREATE INDEX "idx_md_inv_cat_order" ON "master_data_investment_categories"("sort_order", "name");

CREATE TABLE "master_data_products" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_data_products_slug_key" ON "master_data_products"("slug");
CREATE INDEX "idx_md_product_order" ON "master_data_products"("sort_order", "name");

CREATE TABLE "master_data_services" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_services_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_data_services_slug_key" ON "master_data_services"("slug");
CREATE INDEX "idx_md_service_order" ON "master_data_services"("sort_order", "name");

CREATE TABLE "master_data_brands" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_brands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_data_brands_slug_key" ON "master_data_brands"("slug");
CREATE INDEX "idx_md_brand_order" ON "master_data_brands"("sort_order", "name");

CREATE TABLE "master_data_account_types" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_account_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_data_account_types_slug_key" ON "master_data_account_types"("slug");
CREATE INDEX "idx_md_account_type_order" ON "master_data_account_types"("sort_order", "name");
