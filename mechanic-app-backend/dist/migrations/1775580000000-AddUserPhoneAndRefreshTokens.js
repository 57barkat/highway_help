"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserPhoneAndRefreshTokens1775580000000 = void 0;
class AddUserPhoneAndRefreshTokens1775580000000 {
    constructor() {
        this.name = "AddUserPhoneAndRefreshTokens1775580000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenHash" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_phone_number" UNIQUE ("phoneNumber")`).catch(() => undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_phone_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshTokenExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshTokenHash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phoneNumber"`);
    }
}
exports.AddUserPhoneAndRefreshTokens1775580000000 = AddUserPhoneAndRefreshTokens1775580000000;
