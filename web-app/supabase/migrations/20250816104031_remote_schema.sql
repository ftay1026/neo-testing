alter table "public"."chats" add column "parent_chat_id" uuid;

alter table "public"."chats" add constraint "chats_parent_chat_id_fkey" FOREIGN KEY (parent_chat_id) REFERENCES chats(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_parent_chat_id_fkey";


