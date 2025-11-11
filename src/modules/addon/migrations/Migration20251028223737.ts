import { Migration } from '@mikro-orm/migrations';

export class Migration20251028223737 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "addon" drop constraint if exists "addon_handle_unique";`);
    this.addSql(`alter table if exists "addon_group" drop constraint if exists "addonGroup_handle_unique";`);
    this.addSql(`create table if not exists "addon_group" ("id" text not null, "title" text not null, "handle" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "addon_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_group_deleted_at" ON "addon_group" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_addonGroup_handle_unique" ON "addon_group" (handle) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "addon" ("id" text not null, "title" text not null, "handle" text not null, "status" text check ("status" in ('draft', 'proposed', 'published', 'rejected')) not null default 'draft', "thumbnail" text null, "metadata" jsonb null, "addon_group_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "addon_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_addon_group_id" ON "addon" (addon_group_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_deleted_at" ON "addon" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_addon_handle_unique" ON "addon" (handle) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_status" ON "addon" (status) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "addon_variant" ("id" text not null, "title" text not null, "manage_inventory" boolean not null default true, "metadata" jsonb null, "variant_rank" integer null default 0, "addon_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "addon_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_variant_addon_id" ON "addon_variant" (addon_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_variant_deleted_at" ON "addon_variant" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_variant_id_addon_id" ON "addon_variant" (id, addon_id) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "addon" add constraint "addon_addon_group_id_foreign" foreign key ("addon_group_id") references "addon_group" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "addon_variant" add constraint "addon_variant_addon_id_foreign" foreign key ("addon_id") references "addon" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "addon" drop constraint if exists "addon_addon_group_id_foreign";`);

    this.addSql(`alter table if exists "addon_variant" drop constraint if exists "addon_variant_addon_id_foreign";`);

    this.addSql(`drop table if exists "addon_group" cascade;`);

    this.addSql(`drop table if exists "addon" cascade;`);

    this.addSql(`drop table if exists "addon_variant" cascade;`);
  }

}
