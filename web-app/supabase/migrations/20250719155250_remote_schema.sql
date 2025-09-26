set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_recent_projects_with_activity(p_limit integer DEFAULT 8)
 RETURNS TABLE(id uuid, name text, description text, is_default boolean, created_at timestamp with time zone, updated_at timestamp with time zone, last_activity timestamp with time zone, chat_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.is_default,
    p.created_at,
    p.updated_at,
    COALESCE(MAX(c.created_at), p.updated_at) as last_activity,
    COUNT(c.id)::INTEGER as chat_count
  FROM projects p
  LEFT JOIN chats c ON p.id = c.project_id
  WHERE p.user_id = auth.uid()
  GROUP BY p.id, p.name, p.description, p.is_default, p.created_at, p.updated_at
  ORDER BY last_activity DESC
  LIMIT p_limit;
END;
$function$
;


