alter table "public"."interaction_logs" add column "chat_id" uuid;

CREATE INDEX interaction_logs_chat_id_idx ON public.interaction_logs USING btree (chat_id);

alter table "public"."interaction_logs" add constraint "interaction_logs_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE not valid;

alter table "public"."interaction_logs" validate constraint "interaction_logs_chat_id_fkey";


