alter table "public"."credit_transactions" drop constraint "credit_transactions_customer_id_fkey";

alter table "public"."credits" drop constraint "credits_customer_id_fkey";

alter table "public"."credit_transactions" add constraint "credit_transactions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."credit_transactions" validate constraint "credit_transactions_customer_id_fkey";

alter table "public"."credits" add constraint "credits_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."credits" validate constraint "credits_customer_id_fkey";


