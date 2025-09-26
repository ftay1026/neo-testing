drop policy "Allow user to read their transactions" on "public"."credit_transactions";

drop policy "Disallow modifications by users" on "public"."credit_transactions";

drop policy "Allow user to read their credits" on "public"."credits";

drop policy "Disallow direct modifications by users" on "public"."credits";

drop policy "Public profiles are viewable by everyone." on "public"."profiles";

alter table "public"."chats" drop constraint "chats_visibility_check";

alter table "public"."messages" drop constraint "messages_role_check";

CREATE UNIQUE INDEX credits_customer_id_key ON public.credits USING btree (customer_id);

CREATE INDEX customers_email_idx ON public.customers USING btree (email);

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

alter table "public"."credits" add constraint "credits_customer_id_key" UNIQUE using index "credits_customer_id_key";

alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key";

alter table "public"."chats" add constraint "chats_visibility_check" CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[]))) not valid;

alter table "public"."chats" validate constraint "chats_visibility_check";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

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
    -- Retrieve current credits for the given customer
    SELECT credits INTO v_current_credits
    FROM public.credits
    WHERE customer_id = p_customer_id;

    -- Check if the customer has sufficient credits
    IF v_current_credits IS NULL OR v_current_credits < p_required_credits THEN
        RETURN false; -- Insufficient credits, function will return false
    END IF;

    -- Deduct the specified number of credits
    UPDATE public.credits
    SET credits = credits - p_required_credits,
        updated_at = now()
    WHERE customer_id = p_customer_id;

    -- Log the deduction in the transactions table
    INSERT INTO public.credit_transactions (customer_id, amount, description)
    VALUES (p_customer_id, -p_required_credits, 'Chat API usage');

    RETURN true; -- Deduction was successful
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$function$
;

create policy "Allow user to read their transactions via user_id"
on "public"."credit_transactions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM customers
  WHERE ((customers.customer_id = credit_transactions.customer_id) AND (customers.email = auth.email())))));


create policy "Disallow deletes by users"
on "public"."credit_transactions"
as restrictive
for delete
to authenticated
using (false);


create policy "Disallow inserts by users"
on "public"."credit_transactions"
as restrictive
for insert
to authenticated
with check (false);


create policy "Disallow updates by users"
on "public"."credit_transactions"
as restrictive
for update
to authenticated
using (false);


create policy "Allow user to read their credits via user_id"
on "public"."credits"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM customers
  WHERE ((customers.customer_id = credits.customer_id) AND (customers.email = auth.email())))));


create policy "Disallow deletes by users"
on "public"."credits"
as restrictive
for delete
to authenticated
using (false);


create policy "Disallow inserts by users"
on "public"."credits"
as restrictive
for insert
to authenticated
with check (false);


create policy "Disallow updates by users"
on "public"."credits"
as restrictive
for update
to authenticated
using (false);


create policy "Users can view their own profile."
on "public"."profiles"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = id));



