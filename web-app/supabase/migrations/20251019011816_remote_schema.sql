alter table "public"."customers" add column "user_id" uuid;

alter table "public"."prompts" add column "primingPrompt" text not null;

CREATE UNIQUE INDEX customers_user_id_unique ON public.customers USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_customers_user_id ON public.customers USING btree (user_id);

alter table "public"."customers" add constraint "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_user_id_fkey";

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
    -- Get user email
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', NEW.id::text || '@neo.local');

    -- Create customer record with BOTH email and user_id
    INSERT INTO public.customers (customer_id, email, user_id, created_at, updated_at)
    VALUES (
        user_email,  -- HitPay customer_id (email)
        user_email,  -- email field
        NEW.id,      -- NEW: Direct link to user
        NOW(),
        NOW()
    )
    ON CONFLICT (customer_id) 
    DO UPDATE SET 
        user_id = NEW.id,  -- Update user_id if customer already exists
        updated_at = NOW();

    -- Grant signup credits
    PERFORM add_credits(
        user_email,
        signup_credits_amount,
        signup_description
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to grant signup credits to user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$
;


