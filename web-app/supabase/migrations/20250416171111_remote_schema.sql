alter table "public"."chats" drop constraint "chats_visibility_check";

alter table "public"."messages" drop constraint "messages_role_check";

create table "public"."drive_connections" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "refresh_token" text not null,
    "folder_id" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."drive_connections" enable row level security;

CREATE UNIQUE INDEX drive_connections_pkey ON public.drive_connections USING btree (id);

CREATE UNIQUE INDEX drive_connections_user_id_key ON public.drive_connections USING btree (user_id);

alter table "public"."drive_connections" add constraint "drive_connections_pkey" PRIMARY KEY using index "drive_connections_pkey";

alter table "public"."drive_connections" add constraint "drive_connections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."drive_connections" validate constraint "drive_connections_user_id_fkey";

alter table "public"."drive_connections" add constraint "drive_connections_user_id_key" UNIQUE using index "drive_connections_user_id_key";

alter table "public"."chats" add constraint "chats_visibility_check" CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[]))) not valid;

alter table "public"."chats" validate constraint "chats_visibility_check";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

grant delete on table "public"."drive_connections" to "anon";

grant insert on table "public"."drive_connections" to "anon";

grant references on table "public"."drive_connections" to "anon";

grant select on table "public"."drive_connections" to "anon";

grant trigger on table "public"."drive_connections" to "anon";

grant truncate on table "public"."drive_connections" to "anon";

grant update on table "public"."drive_connections" to "anon";

grant delete on table "public"."drive_connections" to "authenticated";

grant insert on table "public"."drive_connections" to "authenticated";

grant references on table "public"."drive_connections" to "authenticated";

grant select on table "public"."drive_connections" to "authenticated";

grant trigger on table "public"."drive_connections" to "authenticated";

grant truncate on table "public"."drive_connections" to "authenticated";

grant update on table "public"."drive_connections" to "authenticated";

grant delete on table "public"."drive_connections" to "service_role";

grant insert on table "public"."drive_connections" to "service_role";

grant references on table "public"."drive_connections" to "service_role";

grant select on table "public"."drive_connections" to "service_role";

grant trigger on table "public"."drive_connections" to "service_role";

grant truncate on table "public"."drive_connections" to "service_role";

grant update on table "public"."drive_connections" to "service_role";

create policy "Service role can manage drive connections"
on "public"."drive_connections"
as permissive
for all
to public
using (true);


create policy "Users can view their own drive connections"
on "public"."drive_connections"
as permissive
for select
to public
using ((auth.uid() = user_id));



