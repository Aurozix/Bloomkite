
> bloomkite@1.0.0 prisma
> dotenv -e .env.local -- prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "avatar_url" TEXT,
    "email_verified" TIMESTAMP(6),
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "risk_profile" VARCHAR(50),
    "bio" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_profiles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "company_name" VARCHAR(255),
    "designation" VARCHAR(100),
    "pan_number" VARCHAR(20),
    "gst_number" VARCHAR(20),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "website_url" TEXT,
    "bio" TEXT,
    "profile_image_url" TEXT,
    "workflow_status" VARCHAR(50) DEFAULT 'pending',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(6),
    "is_verified" BOOLEAN DEFAULT false,
    "verified_at" TIMESTAMP(6),
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_credentials" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "credential_type" VARCHAR(100) NOT NULL,
    "issuer" VARCHAR(255),
    "license_number" VARCHAR(100),
    "expiry_date" DATE,
    "file_url" TEXT,
    "status" VARCHAR(50) DEFAULT 'pending',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_expertise" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "specialization" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_expertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_followers" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "investor_id" UUID NOT NULL,
    "advisor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "author_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100),
    "tags" TEXT[],
    "featured_image_url" TEXT,
    "status" VARCHAR(50) DEFAULT 'draft',
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_questions" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "author_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(50) DEFAULT 'open',
    "answer_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_answers" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "author_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "votes_count" INTEGER DEFAULT 0,
    "is_best_answer" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_answer_votes" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "answer_id" UUID NOT NULL,
    "vote_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_answer_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_plans" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "calculator_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "inputs" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "is_draft" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price_inr_paise" BIGINT NOT NULL DEFAULT 0,
    "billing_period" VARCHAR(20) NOT NULL DEFAULT 'monthly',
    "features" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "razorpay_order_id" VARCHAR(100),
    "razorpay_subscription_id" VARCHAR(100),
    "razorpay_payment_id" VARCHAR(100),
    "current_period_start" TIMESTAMP(6),
    "current_period_end" TIMESTAMP(6),
    "cancelled_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "subscription_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_inr_paise" BIGINT NOT NULL,
    "razorpay_payment_id" VARCHAR(100),
    "razorpay_invoice_id" VARCHAR(100),
    "pdf_url" TEXT,
    "issued_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "executed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_accounts_user_id" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_expires_at" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_user_id_key" ON "investor_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_investor_profiles_user_id" ON "investor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_profiles_user_id_key" ON "advisor_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_advisor_profiles_follower_count" ON "advisor_profiles"("follower_count" DESC);

-- CreateIndex
CREATE INDEX "idx_advisor_profiles_user_id" ON "advisor_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_advisor_profiles_workflow_status" ON "advisor_profiles"("workflow_status");

-- CreateIndex
CREATE INDEX "idx_advisor_credentials_status" ON "advisor_credentials"("status");

-- CreateIndex
CREATE INDEX "idx_advisor_credentials_user_id" ON "advisor_credentials"("user_id");

-- CreateIndex
CREATE INDEX "idx_advisor_expertise_specialization" ON "advisor_expertise"("specialization");

-- CreateIndex
CREATE INDEX "idx_advisor_expertise_user_id" ON "advisor_expertise"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_expertise_user_id_specialization_key" ON "advisor_expertise"("user_id", "specialization");

-- CreateIndex
CREATE INDEX "idx_advisor_followers_advisor_id" ON "advisor_followers"("advisor_id");

-- CreateIndex
CREATE INDEX "idx_advisor_followers_investor_id" ON "advisor_followers"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_followers_investor_id_advisor_id_key" ON "advisor_followers"("investor_id", "advisor_id");

-- CreateIndex
CREATE INDEX "idx_articles_author_id" ON "articles"("author_id");

-- CreateIndex
CREATE INDEX "idx_articles_category" ON "articles"("category");

-- CreateIndex
CREATE INDEX "idx_articles_published_at" ON "articles"("published_at");

-- CreateIndex
CREATE INDEX "idx_articles_status" ON "articles"("status");

-- CreateIndex
CREATE INDEX "idx_forum_questions_author_id" ON "forum_questions"("author_id");

-- CreateIndex
CREATE INDEX "idx_forum_questions_created_at" ON "forum_questions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_forum_questions_status" ON "forum_questions"("status");

-- CreateIndex
CREATE INDEX "idx_forum_answers_author_id" ON "forum_answers"("author_id");

-- CreateIndex
CREATE INDEX "idx_forum_answers_is_best_answer" ON "forum_answers"("is_best_answer");

-- CreateIndex
CREATE INDEX "idx_forum_answers_question_id" ON "forum_answers"("question_id");

-- CreateIndex
CREATE INDEX "idx_forum_answers_votes_count" ON "forum_answers"("votes_count" DESC);

-- CreateIndex
CREATE INDEX "idx_forum_answer_votes_answer_id" ON "forum_answer_votes"("answer_id");

-- CreateIndex
CREATE INDEX "idx_forum_answer_votes_user_id" ON "forum_answer_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_answer_votes_user_id_answer_id_key" ON "forum_answer_votes"("user_id", "answer_id");

-- CreateIndex
CREATE INDEX "idx_financial_plans_calculator_type" ON "financial_plans"("calculator_type");

-- CreateIndex
CREATE INDEX "idx_financial_plans_is_draft" ON "financial_plans"("is_draft");

-- CreateIndex
CREATE INDEX "idx_financial_plans_user_id" ON "financial_plans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "idx_subscription_plans_slug" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "idx_subscriptions_period_end" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "idx_subscriptions_razorpay_order" ON "subscriptions"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_invoices_subscription_id" ON "invoices"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_invoices_user_id" ON "invoices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "migrations_name_key" ON "migrations"("name");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_profiles" ADD CONSTRAINT "advisor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_profiles" ADD CONSTRAINT "advisor_profiles_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_credentials" ADD CONSTRAINT "advisor_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_expertise" ADD CONSTRAINT "advisor_expertise_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_followers" ADD CONSTRAINT "advisor_followers_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_followers" ADD CONSTRAINT "advisor_followers_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_questions" ADD CONSTRAINT "forum_questions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_answers" ADD CONSTRAINT "forum_answers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_answers" ADD CONSTRAINT "forum_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "forum_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_answer_votes" ADD CONSTRAINT "forum_answer_votes_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "forum_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_answer_votes" ADD CONSTRAINT "forum_answer_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_plans" ADD CONSTRAINT "financial_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

