-- AlterTable
ALTER TABLE "users" ADD COLUMN     "disabled_at" TIMESTAMP(6),
ADD COLUMN     "disabled_by" UUID;

-- CreateTable
CREATE TABLE "admin_audit" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "actor_user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" VARCHAR(200),
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_admin_audit_actor" ON "admin_audit"("actor_user_id");

-- CreateIndex
CREATE INDEX "idx_admin_audit_target" ON "admin_audit"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_admin_audit_created" ON "admin_audit"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_users_disabled_at" ON "users"("disabled_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_disabled_by_fkey" FOREIGN KEY ("disabled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
