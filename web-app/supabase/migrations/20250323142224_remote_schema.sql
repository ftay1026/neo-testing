create table "public"."chats" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "user_id" uuid not null,
    "visibility" character varying(7) not null default 'private'::character varying
);


alter table "public"."chats" enable row level security;

create table "public"."messages" (
    "id" uuid not null default uuid_generate_v4(),
    "chat_id" uuid not null,
    "role" character varying(10) not null,
    "parts" jsonb not null,
    "attachments" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."messages" enable row level security;

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."chats" add constraint "chats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_user_id_fkey";

alter table "public"."chats" add constraint "chats_visibility_check" CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[]))) not valid;

alter table "public"."chats" validate constraint "chats_visibility_check";

alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_chat_id_fkey";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

create policy "Public chats can be viewed by anyone"
on "public"."chats"
as permissive
for select
to public
using (((visibility)::text = 'public'::text));


create policy "Users can delete their own chats"
on "public"."chats"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own chats"
on "public"."chats"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own chats"
on "public"."chats"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own chats"
on "public"."chats"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Messages in public chats can be viewed by anyone"
on "public"."messages"
as permissive
for select
to public
using ((chat_id IN ( SELECT chats.id
   FROM chats
  WHERE ((chats.visibility)::text = 'public'::text))));


create policy "Users can insert messages to their own chats"
on "public"."messages"
as permissive
for insert
to public
with check ((chat_id IN ( SELECT chats.id
   FROM chats
  WHERE (chats.user_id = auth.uid()))));


create policy "Users can view messages of their own chats"
on "public"."messages"
as permissive
for select
to public
using ((chat_id IN ( SELECT chats.id
   FROM chats
  WHERE (chats.user_id = auth.uid()))));



