-- BRD §3.2 step 5+6 — advisor declares Products / Services / Brands they
-- work with, plus priority ranking on products and services. Three join
-- tables; brands don't carry a priority (BRD doesn't rank brands).
-- The legacy `advisor_expertise` free-text-tag table is left in place for
-- now; deprecate / drop in a separate cleanup commit once no UI reads it.

CREATE TABLE "advisor_products" (
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_products_pkey" PRIMARY KEY ("user_id", "product_id"),
    CONSTRAINT "advisor_products_product_id_fkey" FOREIGN KEY ("product_id")
        REFERENCES "master_data_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_advisor_product_priority" ON "advisor_products"("user_id", "priority");

CREATE TABLE "advisor_services" (
    "user_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_services_pkey" PRIMARY KEY ("user_id", "service_id"),
    CONSTRAINT "advisor_services_service_id_fkey" FOREIGN KEY ("service_id")
        REFERENCES "master_data_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_advisor_service_priority" ON "advisor_services"("user_id", "priority");

CREATE TABLE "advisor_brands" (
    "user_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_brands_pkey" PRIMARY KEY ("user_id", "brand_id"),
    CONSTRAINT "advisor_brands_brand_id_fkey" FOREIGN KEY ("brand_id")
        REFERENCES "master_data_brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_advisor_brand_user" ON "advisor_brands"("user_id");
