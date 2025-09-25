import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRouteAndStopTables1758736003051 implements MigrationInterface {
    name = 'AddRouteAndStopTables1758736003051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stop" ("id" varchar PRIMARY KEY NOT NULL, "sequence" integer NOT NULL, "type" varchar CHECK( "type" IN ('pickup','dropoff') ) NOT NULL, "childId" varchar, "routeId" varchar)`);
        await queryRunner.query(`CREATE TABLE "route" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "status" varchar CHECK( "status" IN ('planning','assigned','in_progress','completed') ) NOT NULL DEFAULT ('planning'), "date" date NOT NULL, "driverId" varchar, "vehicleId" varchar)`);
        await queryRunner.query(`CREATE TABLE "temporary_stop" ("id" varchar PRIMARY KEY NOT NULL, "sequence" integer NOT NULL, "type" varchar CHECK( "type" IN ('pickup','dropoff') ) NOT NULL, "childId" varchar, "routeId" varchar, CONSTRAINT "FK_a3c3eee6ca129a9dd1091f353aa" FOREIGN KEY ("childId") REFERENCES "child" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_f75a292f980cfc037deab4688f0" FOREIGN KEY ("routeId") REFERENCES "route" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_stop"("id", "sequence", "type", "childId", "routeId") SELECT "id", "sequence", "type", "childId", "routeId" FROM "stop"`);
        await queryRunner.query(`DROP TABLE "stop"`);
        await queryRunner.query(`ALTER TABLE "temporary_stop" RENAME TO "stop"`);
        await queryRunner.query(`CREATE TABLE "temporary_route" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "status" varchar CHECK( "status" IN ('planning','assigned','in_progress','completed') ) NOT NULL DEFAULT ('planning'), "date" date NOT NULL, "driverId" varchar, "vehicleId" varchar, CONSTRAINT "FK_6d09896c24b59b274026fad9949" FOREIGN KEY ("driverId") REFERENCES "driver" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_bd20d92907d3eef247e06a7dadf" FOREIGN KEY ("vehicleId") REFERENCES "vehicle" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_route"("id", "name", "status", "date", "driverId", "vehicleId") SELECT "id", "name", "status", "date", "driverId", "vehicleId" FROM "route"`);
        await queryRunner.query(`DROP TABLE "route"`);
        await queryRunner.query(`ALTER TABLE "temporary_route" RENAME TO "route"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "route" RENAME TO "temporary_route"`);
        await queryRunner.query(`CREATE TABLE "route" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "status" varchar CHECK( "status" IN ('planning','assigned','in_progress','completed') ) NOT NULL DEFAULT ('planning'), "date" date NOT NULL, "driverId" varchar, "vehicleId" varchar)`);
        await queryRunner.query(`INSERT INTO "route"("id", "name", "status", "date", "driverId", "vehicleId") SELECT "id", "name", "status", "date", "driverId", "vehicleId" FROM "temporary_route"`);
        await queryRunner.query(`DROP TABLE "temporary_route"`);
        await queryRunner.query(`ALTER TABLE "stop" RENAME TO "temporary_stop"`);
        await queryRunner.query(`CREATE TABLE "stop" ("id" varchar PRIMARY KEY NOT NULL, "sequence" integer NOT NULL, "type" varchar CHECK( "type" IN ('pickup','dropoff') ) NOT NULL, "childId" varchar, "routeId" varchar)`);
        await queryRunner.query(`INSERT INTO "stop"("id", "sequence", "type", "childId", "routeId") SELECT "id", "sequence", "type", "childId", "routeId" FROM "temporary_stop"`);
        await queryRunner.query(`DROP TABLE "temporary_stop"`);
        await queryRunner.query(`DROP TABLE "route"`);
        await queryRunner.query(`DROP TABLE "stop"`);
    }

}
