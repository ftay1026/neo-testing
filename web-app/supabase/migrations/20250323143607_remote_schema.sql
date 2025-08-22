alter table "public"."chats" drop constraint "chats_visibility_check";

alter table "public"."messages" drop constraint "messages_role_check";

alter table "public"."chats" alter column "user_id" set default auth.uid();

alter table "public"."chats" add constraint "chats_visibility_check" CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[]))) not valid;

alter table "public"."chats" validate constraint "chats_visibility_check";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";


