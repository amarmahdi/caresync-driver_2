import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthToDrivers1758818250143 implements MigrationInterface {
    name = 'AddAuthToDrivers1758818250143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_driver" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "capabilities" text, "email" varchar NOT NULL, "password" varchar NOT NULL, CONSTRAINT "UQ_a4a0808e6e64e0818cf86233220" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "temporary_driver"("id", "name", "capabilities") SELECT "id", "name", "capabilities" FROM "driver"`);
        await queryRunner.query(`DROP TABLE "driver"`);
        await queryRunner.query(`ALTER TABLE "temporary_driver" RENAME TO "driver"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver" RENAME TO "temporary_driver"`);
        await queryRunner.query(`CREATE TABLE "driver" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "capabilities" text)`);
        await queryRunner.query(`INSERT INTO "driver"("id", "name", "capabilities") SELECT "id", "name", "capabilities" FROM "temporary_driver"`);
        await queryRunner.query(`DROP TABLE "temporary_driver"`);
    }

}
