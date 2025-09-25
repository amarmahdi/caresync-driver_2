import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1758729726613 implements MigrationInterface {
    name = 'InitialSchema1758729726613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "child" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "addressStreet" varchar NOT NULL, "addressCity" varchar NOT NULL, "latitude" float, "longitude" float, "category" varchar CHECK( "category" IN ('infant','toddler','preschool','out_of_school_care') ) NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "driver" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "capabilities" text)`);
        await queryRunner.query(`CREATE TABLE "vehicle" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "capacity" integer NOT NULL, "equipment" text)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vehicle"`);
        await queryRunner.query(`DROP TABLE "driver"`);
        await queryRunner.query(`DROP TABLE "child"`);
    }

}
