drop function if exists "public"."match_document_sections"(embedding vector, match_threshold double precision, match_count integer, p_user_id uuid);

drop function if exists "public"."match_document_sections_by_project"(embedding vector, match_threshold double precision, match_count integer, p_user_id uuid, p_project_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_direct_file_and_chunks_by_project(p_user_id uuid, p_title text, p_content text, p_chunks jsonb, p_project_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_document_id BIGINT;
BEGIN
  -- Insert new direct file document with project_id
  INSERT INTO documents (
    user_id, 
    title, 
    content, 
    name, 
    file_type, 
    file_extension, 
    is_direct_file,
    last_modified,
    project_id  -- Added project_id
  )
  VALUES (
    p_user_id, 
    p_title, 
    p_content, 
    p_title, -- name same as title for direct files
    'direct/text', 
    'txt', 
    TRUE,
    NOW(),
    p_project_id  -- Added project_id parameter
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

CREATE OR REPLACE FUNCTION public.match_document_sections_by_project(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, p_user_id uuid DEFAULT auth.uid(), p_project_id uuid DEFAULT NULL::uuid)
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
    (ds.embedding <#> query_embedding) * -1 AS similarity
  FROM document_sections ds
  JOIN documents d ON ds.document_id = d.id
  WHERE d.user_id = p_user_id
    AND (p_project_id IS NULL OR d.project_id = p_project_id)
    AND ds.embedding <#> query_embedding < -match_threshold
  ORDER BY ds.embedding <#> query_embedding
  LIMIT match_count;
END;
$function$
;


