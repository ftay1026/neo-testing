alter table "public"."documents" drop constraint "documents_user_id_drive_file_id_key";

alter table "public"."documents" drop constraint "documents_file_type_check";

drop index if exists "public"."documents_user_id_drive_file_id_key";

alter table "public"."documents" add column "content" text;

alter table "public"."documents" add column "is_direct_file" boolean default false;

alter table "public"."documents" add column "title" text;

alter table "public"."documents" alter column "drive_file_id" drop not null;

CREATE UNIQUE INDEX documents_user_id_title_key ON public.documents USING btree (user_id, title) WHERE (is_direct_file = true);

CREATE INDEX idx_documents_title_search ON public.documents USING gin (to_tsvector('english'::regconfig, title)) WHERE (is_direct_file = true);

CREATE INDEX idx_documents_user_direct_files ON public.documents USING btree (user_id, is_direct_file, created_at DESC) WHERE (is_direct_file = true);

CREATE UNIQUE INDEX documents_user_id_drive_file_id_key ON public.documents USING btree (user_id, drive_file_id) WHERE (drive_file_id IS NOT NULL);

alter table "public"."documents" add constraint "documents_file_type_check" CHECK ((file_type = ANY (ARRAY['text/plain'::text, 'text/markdown'::text, 'application/pdf'::text, 'direct/text'::text]))) not valid;

alter table "public"."documents" validate constraint "documents_file_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_direct_file_and_chunks(p_user_id uuid, p_title text, p_content text, p_chunks jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_document_id BIGINT;
BEGIN
  -- Insert new direct file document
  INSERT INTO documents (
    user_id, 
    title, 
    content, 
    name, 
    file_type, 
    file_extension, 
    is_direct_file,
    last_modified
  )
  VALUES (
    p_user_id, 
    p_title, 
    p_content, 
    p_title, -- name same as title for direct files
    'direct/text', 
    'txt', 
    TRUE,
    NOW()
  )
  RETURNING id INTO v_document_id;
  
  -- Insert chunks
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

CREATE OR REPLACE FUNCTION public.update_direct_file_and_chunks(p_document_id bigint, p_user_id uuid, p_title text, p_content text, p_chunks jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update document
  UPDATE documents
  SET 
    title = p_title,
    content = p_content,
    name = p_title,
    last_modified = NOW(),
    updated_at = NOW()
  WHERE id = p_document_id 
    AND user_id = p_user_id 
    AND is_direct_file = TRUE;
  
  -- Delete existing chunks
  DELETE FROM document_sections 
  WHERE document_id = p_document_id;
  
  -- Insert new chunks
  INSERT INTO document_sections (document_id, chunk_index, content, embedding)
  SELECT 
    p_document_id,
    (chunk->>'chunk_index')::INT,
    chunk->>'content',
    (chunk->>'embedding')::vector(1536)
  FROM jsonb_array_elements(p_chunks) AS chunk;
  
  RETURN p_document_id;
END;
$function$
;

create policy "Users can create direct files"
on "public"."documents"
as permissive
for insert
to authenticated
with check (((auth.uid() = user_id) AND (is_direct_file = true) AND (drive_file_id IS NULL)));



