set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_document_and_chunks(p_user_id uuid, p_drive_file_id text, p_name text, p_file_type text, p_file_extension text, p_last_modified timestamp with time zone, p_chunks jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_document_id BIGINT;
BEGIN
  -- Upsert document
  INSERT INTO documents (
    user_id, drive_file_id, name, file_type, file_extension, last_modified
  )
  VALUES (
    p_user_id, p_drive_file_id, p_name, p_file_type, p_file_extension, p_last_modified
  )
  ON CONFLICT (user_id, drive_file_id) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    file_type = EXCLUDED.file_type,
    file_extension = EXCLUDED.file_extension,
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

create policy "Users can delete sections from their own documents"
on "public"."document_sections"
as permissive
for delete
to authenticated
using ((document_id IN ( SELECT documents.id
   FROM documents
  WHERE (documents.user_id = auth.uid()))));


create policy "Users can delete their own documents"
on "public"."documents"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));



revoke select on table "auth"."schema_migrations" from "postgres";


