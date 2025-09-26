set check_function_bodies = off;

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


