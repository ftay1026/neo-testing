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

CREATE OR REPLACE FUNCTION public.get_credit_summary(p_customer_id text)
 RETURNS TABLE(total_purchased bigint, total_used bigint, current_balance integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_purchased,
    COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as total_used,
    COALESCE((SELECT credits FROM public.credits WHERE customer_id = p_customer_id), 0) as current_balance
  FROM public.credit_transactions
  WHERE customer_id = p_customer_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_monthly_credit_data(p_customer_id text)
 RETURNS TABLE(month_year text, purchased bigint, used bigint, net_credits bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', ct.created_at), 'Month YYYY') as month_year,
    COALESCE(SUM(CASE WHEN ct.amount > 0 THEN ct.amount ELSE 0 END), 0) as purchased,
    COALESCE(ABS(SUM(CASE WHEN ct.amount < 0 THEN ct.amount ELSE 0 END)), 0) as used,
    COALESCE(SUM(ct.amount), 0) as net_credits
  FROM public.credit_transactions ct
  WHERE ct.customer_id = p_customer_id
  GROUP BY DATE_TRUNC('month', ct.created_at)
  ORDER BY DATE_TRUNC('month', ct.created_at) DESC
  LIMIT 12; -- Last 12 months
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

CREATE OR REPLACE FUNCTION public.match_document_sections_by_project(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, p_user_id uuid DEFAULT auth.uid(), p_project_id uuid DEFAULT NULL::uuid)
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


