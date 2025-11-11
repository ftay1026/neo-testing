
  create table "public"."interaction_logs" (
    "id" bigint generated always as identity not null,
    "project_id" uuid not null,
    "user_id" uuid not null default auth.uid(),
    "title" text not null,
    "content" text not null,
    "log_period_start" timestamp with time zone not null,
    "log_period_end" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."interaction_logs" enable row level security;

CREATE UNIQUE INDEX interaction_logs_pkey ON public.interaction_logs USING btree (id);

CREATE INDEX interaction_logs_project_id_idx ON public.interaction_logs USING btree (project_id);

CREATE INDEX interaction_logs_user_id_idx ON public.interaction_logs USING btree (user_id);

alter table "public"."interaction_logs" add constraint "interaction_logs_pkey" PRIMARY KEY using index "interaction_logs_pkey";

alter table "public"."interaction_logs" add constraint "interaction_logs_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."interaction_logs" validate constraint "interaction_logs_project_id_fkey";

alter table "public"."interaction_logs" add constraint "interaction_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."interaction_logs" validate constraint "interaction_logs_user_id_fkey";

grant delete on table "public"."interaction_logs" to "anon";

grant insert on table "public"."interaction_logs" to "anon";

grant references on table "public"."interaction_logs" to "anon";

grant select on table "public"."interaction_logs" to "anon";

grant trigger on table "public"."interaction_logs" to "anon";

grant truncate on table "public"."interaction_logs" to "anon";

grant update on table "public"."interaction_logs" to "anon";

grant delete on table "public"."interaction_logs" to "authenticated";

grant insert on table "public"."interaction_logs" to "authenticated";

grant references on table "public"."interaction_logs" to "authenticated";

grant select on table "public"."interaction_logs" to "authenticated";

grant trigger on table "public"."interaction_logs" to "authenticated";

grant truncate on table "public"."interaction_logs" to "authenticated";

grant update on table "public"."interaction_logs" to "authenticated";

grant delete on table "public"."interaction_logs" to "service_role";

grant insert on table "public"."interaction_logs" to "service_role";

grant references on table "public"."interaction_logs" to "service_role";

grant select on table "public"."interaction_logs" to "service_role";

grant trigger on table "public"."interaction_logs" to "service_role";

grant truncate on table "public"."interaction_logs" to "service_role";

grant update on table "public"."interaction_logs" to "service_role";


  create policy "Users can delete their own interaction logs"
  on "public"."interaction_logs"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own interaction logs"
  on "public"."interaction_logs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update their own interaction logs"
  on "public"."interaction_logs"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can view their own interaction logs"
  on "public"."interaction_logs"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



