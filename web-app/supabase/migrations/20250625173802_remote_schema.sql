drop index if exists "public"."documents_user_id_drive_file_id_key";

drop index if exists "public"."documents_user_id_title_key";

create table "public"."projects" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "user_id" uuid not null,
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."projects" enable row level security;

alter table "public"."chats" add column "project_id" uuid not null;

alter table "public"."documents" add column "project_id" uuid not null;

CREATE INDEX chats_project_id_idx ON public.chats USING btree (project_id);

CREATE UNIQUE INDEX documents_project_drive_file_id_key ON public.documents USING btree (project_id, drive_file_id) WHERE (drive_file_id IS NOT NULL);

CREATE INDEX documents_project_id_idx ON public.documents USING btree (project_id);

CREATE UNIQUE INDEX documents_project_title_key ON public.documents USING btree (project_id, title) WHERE (is_direct_file = true);

CREATE UNIQUE INDEX one_default_project_per_user ON public.projects USING btree (user_id, is_default);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX projects_user_default_unique ON public.projects USING btree (user_id) WHERE (is_default = true);

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."chats" add constraint "chats_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_project_id_fkey";

alter table "public"."documents" add constraint "documents_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_project_id_fkey";

alter table "public"."projects" add constraint "one_default_project_per_user" UNIQUE using index "one_default_project_per_user" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."projects" add constraint "projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_document_sections(embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, p_user_id uuid DEFAULT auth.uid(), p_project_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id bigint, content text, filename text, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id,
    ds.content,
    d.name AS filename,
    (ds.embedding <#> embedding) * -1 AS similarity
  FROM document_sections ds
  JOIN documents d ON ds.document_id = d.id
  WHERE d.user_id = p_user_id
    AND (p_project_id IS NULL OR d.project_id = p_project_id)
    AND ds.embedding <#> embedding < -match_threshold
  ORDER BY ds.embedding <#> embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_project_id uuid;
BEGIN
    -- Create user profile (existing logic)
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    
    -- Create default project for new user
    INSERT INTO public.projects (user_id, name, description, is_default)
    VALUES (new.id, 'Default Project', 'Your default project', true)
    RETURNING id INTO v_project_id;
    
    RETURN new;
END;
$function$
;

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

create policy "Users can delete their own non-default projects"
on "public"."projects"
as permissive
for delete
to authenticated
using (((auth.uid() = user_id) AND (is_default = false)));


create policy "Users can insert their own projects"
on "public"."projects"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own projects"
on "public"."projects"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "Users can view their own projects"
on "public"."projects"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));



