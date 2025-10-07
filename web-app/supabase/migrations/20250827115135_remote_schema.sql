alter table "public"."projects" drop constraint "one_default_project_per_user";

drop index if exists "public"."one_default_project_per_user";


