create extension if not exists "vector" with schema "extensions";


alter table "public"."chats" drop constraint "chats_visibility_check";

alter table "public"."messages" drop constraint "messages_role_check";

create table "public"."document_sections" (
    "id" bigint generated always as identity not null,
    "document_id" bigint not null,
    "chunk_index" integer not null,
    "content" text not null,
    "embedding" vector(1536),
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."document_sections" enable row level security;

create table "public"."documents" (
    "id" bigint generated always as identity not null,
    "name" text not null,
    "drive_file_id" text not null,
    "file_type" text not null default 'text/plain'::text,
    "file_extension" text not null default 'txt'::text,
    "user_id" uuid not null default auth.uid(),
    "last_modified" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."documents" enable row level security;

CREATE UNIQUE INDEX document_sections_document_id_chunk_index_key ON public.document_sections USING btree (document_id, chunk_index);

CREATE INDEX document_sections_embedding_idx ON public.document_sections USING hnsw (embedding vector_ip_ops) WITH (m='16', ef_construction='64');

CREATE UNIQUE INDEX document_sections_pkey ON public.document_sections USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX documents_user_id_drive_file_id_key ON public.documents USING btree (user_id, drive_file_id);

CREATE INDEX idx_documents_file_type ON public.documents USING btree (file_type);

alter table "public"."document_sections" add constraint "document_sections_pkey" PRIMARY KEY using index "document_sections_pkey";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."document_sections" add constraint "document_sections_document_id_chunk_index_key" UNIQUE using index "document_sections_document_id_chunk_index_key";

alter table "public"."document_sections" add constraint "document_sections_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_sections" validate constraint "document_sections_document_id_fkey";

alter table "public"."documents" add constraint "documents_file_type_check" CHECK ((file_type = ANY (ARRAY['text/plain'::text, 'text/markdown'::text, 'application/pdf'::text]))) not valid;

alter table "public"."documents" validate constraint "documents_file_type_check";

alter table "public"."documents" add constraint "documents_user_id_drive_file_id_key" UNIQUE using index "documents_user_id_drive_file_id_key";

alter table "public"."documents" add constraint "documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_user_id_fkey";

alter table "public"."chats" add constraint "chats_visibility_check" CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[]))) not valid;

alter table "public"."chats" validate constraint "chats_visibility_check";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_document_sections(embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id bigint, content text, filename text, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
#variable_conflict use_variable
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
    AND ds.embedding <#> embedding < -match_threshold
  ORDER BY ds.embedding <#> embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_document_and_chunks(p_user_id uuid, p_drive_file_id text, p_name text, p_last_modified timestamp with time zone, p_chunks jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_document_id BIGINT;
BEGIN
  -- Upsert document
  INSERT INTO documents (user_id, drive_file_id, name, last_modified)
  VALUES (p_user_id, p_drive_file_id, p_name, p_last_modified)
  ON CONFLICT (user_id, drive_file_id) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    last_modified = EXCLUDED.last_modified,
    updated_at = NOW()
  RETURNING id INTO v_document_id;
  
  -- Delete existing chunks
  DELETE FROM document_sections 
  WHERE document_id = v_document_id;
  
  -- Insert new chunks
  INSERT INTO document_sections (document_id, chunk_index, content, embedding)
  SELECT 
    v_document_id,
    (chunk->>'chunk_index')::INT,
    chunk->>'content',
    (chunk->>'embedding')::vector(1536)
  FROM jsonb_array_elements(p_chunks) AS chunk;
  
  RETURN v_document_id;
END;
$function$
;

grant delete on table "public"."document_sections" to "anon";

grant insert on table "public"."document_sections" to "anon";

grant references on table "public"."document_sections" to "anon";

grant select on table "public"."document_sections" to "anon";

grant trigger on table "public"."document_sections" to "anon";

grant truncate on table "public"."document_sections" to "anon";

grant update on table "public"."document_sections" to "anon";

grant delete on table "public"."document_sections" to "authenticated";

grant insert on table "public"."document_sections" to "authenticated";

grant references on table "public"."document_sections" to "authenticated";

grant select on table "public"."document_sections" to "authenticated";

grant trigger on table "public"."document_sections" to "authenticated";

grant truncate on table "public"."document_sections" to "authenticated";

grant update on table "public"."document_sections" to "authenticated";

grant delete on table "public"."document_sections" to "service_role";

grant insert on table "public"."document_sections" to "service_role";

grant references on table "public"."document_sections" to "service_role";

grant select on table "public"."document_sections" to "service_role";

grant trigger on table "public"."document_sections" to "service_role";

grant truncate on table "public"."document_sections" to "service_role";

grant update on table "public"."document_sections" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

create policy "Users can insert document sections"
on "public"."document_sections"
as permissive
for insert
to authenticated
with check ((document_id IN ( SELECT documents.id
   FROM documents
  WHERE (documents.user_id = auth.uid()))));


create policy "Users can query their own document sections"
on "public"."document_sections"
as permissive
for select
to authenticated
using ((document_id IN ( SELECT documents.id
   FROM documents
  WHERE (documents.user_id = auth.uid()))));


create policy "Users can insert documents"
on "public"."documents"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can query their own documents"
on "public"."documents"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update their own documents"
on "public"."documents"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



