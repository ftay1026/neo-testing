alter table "public"."chats" add column "inheritance_summary" text;

CREATE INDEX idx_chats_inheritance_summary ON public.chats USING btree (parent_chat_id) WHERE (inheritance_summary IS NOT NULL);


