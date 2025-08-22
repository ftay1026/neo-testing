alter table "public"."chats" drop constraint "chats_visibility_check";

alter table "public"."messages" drop constraint "messages_role_check";

create table "public"."credit_transactions" (
    "id" uuid not null default uuid_generate_v4(),
    "customer_id" text not null,
    "amount" integer not null,
    "description" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."credit_transactions" enable row level security;

create table "public"."credits" (
    "id" uuid not null default uuid_generate_v4(),
    "customer_id" text not null,
    "credits" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."credits" enable row level security;

CREATE INDEX credit_transactions_customer_id_idx ON public.credit_transactions USING btree (customer_id);

CREATE UNIQUE INDEX credit_transactions_pkey ON public.credit_transactions USING btree (id);

CREATE INDEX credits_customer_id_idx ON public.credits USING btree (customer_id);

CREATE UNIQUE INDEX credits_pkey ON public.credits USING btree (id);

alter table "public"."credit_transactions" add constraint "credit_transactions_pkey" PRIMARY KEY using index "credit_transactions_pkey";

alter table "public"."credits" add constraint "credits_pkey" PRIMARY KEY using index "credits_pkey";

alter table "public"."credit_transactions" add constraint "credit_transactions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(customer_id) not valid;

alter table "public"."credit_transactions" validate constraint "credit_transactions_customer_id_fkey";

alter table "public"."credits" add constraint "credits_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(customer_id) not valid;

alter table "public"."credits" validate constraint "credits_customer_id_fkey";

alter table "public"."chats" add constraint "chats_visibility_check" CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[]))) not valid;

alter table "public"."chats" validate constraint "chats_visibility_check";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_credits(p_customer_id text, p_amount integer, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Log the credit addition in the transactions table
    INSERT INTO public.credit_transactions (customer_id, amount, description)
    VALUES (p_customer_id, p_amount, p_description);

    -- Insert or update the credits table with the added credits
    INSERT INTO public.credits (customer_id, credits)
    VALUES (p_customer_id, p_amount)
    ON CONFLICT (customer_id)
    DO UPDATE SET credits = public.credits.credits + p_amount, updated_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_and_deduct_credits(p_customer_id text, p_required_credits integer)
 RETURNS boolean
 LANGUAGE plpgsql
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

grant delete on table "public"."credit_transactions" to "anon";

grant insert on table "public"."credit_transactions" to "anon";

grant references on table "public"."credit_transactions" to "anon";

grant select on table "public"."credit_transactions" to "anon";

grant trigger on table "public"."credit_transactions" to "anon";

grant truncate on table "public"."credit_transactions" to "anon";

grant update on table "public"."credit_transactions" to "anon";

grant delete on table "public"."credit_transactions" to "authenticated";

grant insert on table "public"."credit_transactions" to "authenticated";

grant references on table "public"."credit_transactions" to "authenticated";

grant select on table "public"."credit_transactions" to "authenticated";

grant trigger on table "public"."credit_transactions" to "authenticated";

grant truncate on table "public"."credit_transactions" to "authenticated";

grant update on table "public"."credit_transactions" to "authenticated";

grant delete on table "public"."credit_transactions" to "service_role";

grant insert on table "public"."credit_transactions" to "service_role";

grant references on table "public"."credit_transactions" to "service_role";

grant select on table "public"."credit_transactions" to "service_role";

grant trigger on table "public"."credit_transactions" to "service_role";

grant truncate on table "public"."credit_transactions" to "service_role";

grant update on table "public"."credit_transactions" to "service_role";

grant delete on table "public"."credits" to "anon";

grant insert on table "public"."credits" to "anon";

grant references on table "public"."credits" to "anon";

grant select on table "public"."credits" to "anon";

grant trigger on table "public"."credits" to "anon";

grant truncate on table "public"."credits" to "anon";

grant update on table "public"."credits" to "anon";

grant delete on table "public"."credits" to "authenticated";

grant insert on table "public"."credits" to "authenticated";

grant references on table "public"."credits" to "authenticated";

grant select on table "public"."credits" to "authenticated";

grant trigger on table "public"."credits" to "authenticated";

grant truncate on table "public"."credits" to "authenticated";

grant update on table "public"."credits" to "authenticated";

grant delete on table "public"."credits" to "service_role";

grant insert on table "public"."credits" to "service_role";

grant references on table "public"."credits" to "service_role";

grant select on table "public"."credits" to "service_role";

grant trigger on table "public"."credits" to "service_role";

grant truncate on table "public"."credits" to "service_role";

grant update on table "public"."credits" to "service_role";

create policy "Allow service role to insert transactions"
on "public"."credit_transactions"
as permissive
for insert
to service_role
with check (true);


create policy "Allow user to read their transactions"
on "public"."credit_transactions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM customers
  WHERE ((customers.customer_id = credit_transactions.customer_id) AND (customers.email = auth.email())))));


create policy "Disallow modifications by users"
on "public"."credit_transactions"
as restrictive
for all
to authenticated
using (false);


create policy "Allow service role to update credits"
on "public"."credits"
as permissive
for update
to service_role
using (true);


create policy "Allow user to read their credits"
on "public"."credits"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM customers
  WHERE ((customers.customer_id = credits.customer_id) AND (customers.email = auth.email())))));


create policy "Disallow direct modifications by users"
on "public"."credits"
as restrictive
for all
to authenticated
using (false);



