-- CreateTable
CREATE TABLE "risk_profile_questions" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "question_number" DECIMAL(4,2) NOT NULL,
    "text" TEXT NOT NULL,
    "max_score_for_inversion" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conditional_on_question_id" UUID,
    "conditional_on_answer_score" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_profile_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_profile_answers" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "question_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_profile_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_income_categories" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_income_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_expense_categories" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_asset_types" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_liability_types" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_liability_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "risk_profile_questions_slug_key" ON "risk_profile_questions"("slug");

-- CreateIndex
CREATE INDEX "idx_risk_q_order" ON "risk_profile_questions"("sort_order", "question_number");

-- CreateIndex
CREATE INDEX "idx_risk_a_order" ON "risk_profile_answers"("question_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_income_categories_slug_key" ON "master_data_income_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_md_income_cat_order" ON "master_data_income_categories"("sort_order", "name");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_expense_categories_slug_key" ON "master_data_expense_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_md_expense_cat_order" ON "master_data_expense_categories"("sort_order", "name");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_asset_types_slug_key" ON "master_data_asset_types"("slug");

-- CreateIndex
CREATE INDEX "idx_md_asset_type_order" ON "master_data_asset_types"("sort_order", "name");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_liability_types_slug_key" ON "master_data_liability_types"("slug");

-- CreateIndex
CREATE INDEX "idx_md_liability_type_order" ON "master_data_liability_types"("sort_order", "name");

-- AddForeignKey
ALTER TABLE "risk_profile_questions" ADD CONSTRAINT "risk_profile_questions_conditional_on_question_id_fkey" FOREIGN KEY ("conditional_on_question_id") REFERENCES "risk_profile_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_profile_answers" ADD CONSTRAINT "risk_profile_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "risk_profile_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
