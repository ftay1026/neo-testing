set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  RETURN v_user_id;
END;
$function$
;


