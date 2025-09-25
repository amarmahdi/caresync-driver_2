import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStopStatusAndChildAddressState1758835361019 implements MigrationInterface {
    name = 'AddStopStatusAndChildAddressState1758835361019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_child" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "addressStreet" varchar NOT NULL, "addressCity" varchar NOT NULL, "latitude" float, "longitude" float, "category" varchar CHECK( "category" IN ('infant','toddler','preschool','out_of_school_care') ) NOT NULL, "addressState" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_child"("id", "name", "addressStreet", "addressCity", "latitude", "longitude", "category") SELECT "id", "name", "addressStreet", "addressCity", "latitude", "longitude", "category" FROM "child"`);
        await queryRunner.query(`DROP TABLE "child"`);
        await queryRunner.query(`ALTER TABLE "temporary_child" RENAME TO "child"`);
        await queryRunner.query(`CREATE TABLE "temporary_stop" ("id" varchar PRIMARY KEY NOT NULL, "sequence" integer NOT NULL, "type" varchar CHECK( "type" IN ('pickup','dropoff') ) NOT NULL, "childId" varchar, "routeId" varchar, "status" varchar CHECK( "status" IN ('pending','completed') ) NOT NULL DEFAULT ('pending'), CONSTRAINT "FK_f75a292f980cfc037deab4688f0" FOREIGN KEY ("routeId") REFERENCES "route" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_a3c3eee6ca129a9dd1091f353aa" FOREIGN KEY ("childId") REFERENCES "child" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_stop"("id", "sequence", "type", "childId", "routeId") SELECT "id", "sequence", "type", "childId", "routeId" FROM "stop"`);
        await queryRunner.query(`DROP TABLE "stop"`);
        await queryRunner.query(`ALTER TABLE "temporary_stop" RENAME TO "stop"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stop" RENAME TO "temporary_stop"`);
        await queryRunner.query(`CREATE TABLE "stop" ("id" varchar PRIMARY KEY NOT NULL, "sequence" integer NOT NULL, "type" varchar CHECK( "type" IN ('pickup','dropoff') ) NOT NULL, "childId" varchar, "routeId" varchar, CONSTRAINT "FK_f75a292f980cfc037deab4688f0" FOREIGN KEY ("routeId") REFERENCES "route" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_a3c3eee6ca129a9dd1091f353aa" FOREIGN KEY ("childId") REFERENCES "child" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "stop"("id", "sequence", "type", "childId", "routeId") SELECT "id", "sequence", "type", "childId", "routeId" FROM "temporary_stop"`);
        await queryRunner.query(`DROP TABLE "temporary_stop"`);
        await queryRunner.query(`ALTER TABLE "child" RENAME TO "temporary_child"`);
        await queryRunner.query(`CREATE TABLE "child" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "addressStreet" varchar NOT NULL, "addressCity" varchar NOT NULL, "latitude" float, "longitude" float, "category" varchar CHECK( "category" IN ('infant','toddler','preschool','out_of_school_care') ) NOT NULL)`);
        await queryRunner.query(`INSERT INTO "child"("id", "name", "addressStreet", "addressCity", "latitude", "longitude", "category") SELECT "id", "name", "addressStreet", "addressCity", "latitude", "longitude", "category" FROM "temporary_child"`);
        await queryRunner.query(`DROP TABLE "temporary_child"`);
    }

}
