set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_documents_by_title(p_search_term text, p_user_id uuid, p_project_id uuid, p_match_count integer DEFAULT 5)
 RETURNS TABLE(id bigint, title text, content text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.created_at,
    d.updated_at
  FROM documents d
  WHERE d.user_id = p_user_id
    AND (p_project_id IS NULL OR d.project_id = p_project_id)
    AND d.title ILIKE '%' || p_search_term || '%'
  ORDER BY 
    CASE 
      WHEN LOWER(d.title) = LOWER(p_search_term) THEN 1  -- Exact match
      WHEN LOWER(d.title) LIKE LOWER(p_search_term) || '%' THEN 2  -- Starts with
      WHEN LOWER(d.title) LIKE '%' || LOWER(p_search_term) || '%' THEN 3  -- Contains
      ELSE 4
    END,
    d.updated_at DESC
  LIMIT p_match_count;
END;
$function$
;


