set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_and_deduct_credits(p_customer_id text, p_required_credits integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_credits int;
BEGIN
    -- Get current credits
    SELECT credits INTO v_current_credits
    FROM public.credits
    WHERE customer_id = p_customer_id;

    -- If no record exists, create one with 0 credits
    IF v_current_credits IS NULL THEN
        INSERT INTO public.credits (customer_id, credits)
        VALUES (p_customer_id, 0);
        v_current_credits := 0;
    END IF;

    -- Allow deduction if current balance is >= 0 (can go negative)
    -- Block if already negative
    IF v_current_credits >= 0 THEN
        -- Deduct the credits (can make balance negative)
        UPDATE public.credits
        SET credits = credits - p_required_credits,
            updated_at = now()
        WHERE customer_id = p_customer_id;

        -- Log the deduction
        INSERT INTO public.credit_transactions (customer_id, amount, description)
        VALUES (p_customer_id, -p_required_credits, 'Chat API usage');

        RETURN true;
    ELSE
        -- Already negative, don't allow
        RETURN false;
    END IF;
END;
$function$
;


