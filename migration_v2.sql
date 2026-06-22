-- ============================================================
--  MIGRATION v2 — liaison stock / clients / ventes
--  À exécuter dans Supabase > SQL Editor si tu as DÉJÀ créé
--  les tables avec supabase_schema.sql (sinon, ignore : le
--  nouveau supabase_schema.sql contient déjà ces colonnes).
-- ============================================================
alter table identities add column if not exists client text;
alter table sales      add column if not exists identity_id uuid;
alter table sales      add column if not exists identity text;
