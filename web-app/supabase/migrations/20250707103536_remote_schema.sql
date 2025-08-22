drop function if exists "public"."match_document_sections"(embedding vector, match_threshold double precision, match_count integer, p_user_id uuid, p_project_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_document_sections_by_project(embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, p_user_id uuid DEFAULT auth.uid(), p_project_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id bigint, content text, filename text, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$BEGIN
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
END;$function$
;


