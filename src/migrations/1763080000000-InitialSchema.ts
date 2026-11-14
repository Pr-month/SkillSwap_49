import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1763080000000 implements MigrationInterface {
  name = 'InitialSchema1763080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_gender_enum" AS ENUM ('MALE', 'FEMALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "requests_status_enum" AS ENUM ('pending', 'accepted', 'rejected', 'inProgress', 'done')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications_type_enum" AS ENUM ('requestReceived', 'requestUpdated')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying NOT NULL,
        "about" text,
        "birthdate" date,
        "city" character varying(100),
        "gender" "users_gender_enum",
        "avatar" character varying,
        "role" "users_role_enum" NOT NULL DEFAULT 'USER',
        "refreshToken" character varying,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "parentId" integer,
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "images" text array NOT NULL DEFAULT '{}',
        "ownerId" integer NOT NULL,
        "categoryId" integer,
        CONSTRAINT "PK_skills_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_want_to_learn" (
        "userId" integer NOT NULL,
        "categoryId" integer NOT NULL,
        CONSTRAINT "PK_user_want_to_learn" PRIMARY KEY ("userId", "categoryId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "requests" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status" "requests_status_enum" NOT NULL DEFAULT 'pending',
        "isRead" boolean NOT NULL DEFAULT false,
        "senderId" integer NOT NULL,
        "receiverId" integer NOT NULL,
        "offeredSkillId" integer NOT NULL,
        "requestedSkillId" integer NOT NULL,
        CONSTRAINT "PK_requests_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "skill_favorites" (
        "userId" integer NOT NULL,
        "skillId" integer NOT NULL,
        CONSTRAINT "PK_skill_favorites" PRIMARY KEY ("userId", "skillId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "message" character varying(500) NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "requestId" integer,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "recipientId" integer NOT NULL,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "categories"
        ADD CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parentId")
        REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "skills"
        ADD CONSTRAINT "FK_skills_owner" FOREIGN KEY ("ownerId")
        REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "skills"
        ADD CONSTRAINT "FK_skills_category" FOREIGN KEY ("categoryId")
        REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_want_to_learn"
        ADD CONSTRAINT "FK_uwtl_user" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_want_to_learn"
        ADD CONSTRAINT "FK_uwtl_category" FOREIGN KEY ("categoryId")
        REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "requests"
        ADD CONSTRAINT "FK_requests_sender" FOREIGN KEY ("senderId")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "requests"
        ADD CONSTRAINT "FK_requests_receiver" FOREIGN KEY ("receiverId")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "requests"
        ADD CONSTRAINT "FK_requests_offeredSkill" FOREIGN KEY ("offeredSkillId")
        REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "requests"
        ADD CONSTRAINT "FK_requests_requestedSkill" FOREIGN KEY ("requestedSkillId")
        REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "skill_favorites"
        ADD CONSTRAINT "FK_sf_user" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "skill_favorites"
        ADD CONSTRAINT "FK_sf_skill" FOREIGN KEY ("skillId")
        REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
        ADD CONSTRAINT "FK_notifications_recipient" FOREIGN KEY ("recipientId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_categories_parentId" ON "categories" ("parentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_skills_ownerId" ON "skills" ("ownerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_skills_categoryId" ON "skills" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_senderId" ON "requests" ("senderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_receiverId" ON "requests" ("receiverId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_offeredSkillId" ON "requests" ("offeredSkillId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_requestedSkillId" ON "requests" ("requestedSkillId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipientId" ON "notifications" ("recipientId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "skill_favorites"`);
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TABLE "user_want_to_learn"`);
    await queryRunner.query(`DROP TABLE "skills"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(`DROP TYPE "users_gender_enum"`);
  }
}
