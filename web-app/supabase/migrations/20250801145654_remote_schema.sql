set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.grant_signup_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    signup_credits_amount INTEGER := 100;
    signup_description TEXT := 'Welcome bonus - 100 free credits to get started';
    user_email TEXT;
BEGIN
    -- Get user email with better fallback handling
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
    
    -- If still no email, create a synthetic one
    IF user_email IS NULL THEN
        user_email := NEW.id::text || '@neo.local';
    END IF;

    -- Create customer record using email as customer_id (HitPay pattern)
    INSERT INTO public.customers (customer_id, email, created_at, updated_at)
    VALUES (
        user_email,  -- email as customer_id for HitPay compatibility
        user_email,  -- email field
        NOW(),
        NOW()
    )
    ON CONFLICT (customer_id) DO NOTHING;

    -- Grant signup credits using existing add_credits function
    PERFORM add_credits(
        user_email,  -- customer_id (email)
        signup_credits_amount,
        signup_description
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to grant signup credits to user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$
;


