-- ============================================================
--  LE REGISTRE — Schéma Supabase
--  À coller dans : Supabase > SQL Editor > New query > Run
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table if not exists identities (
  id         uuid primary key default gen_random_uuid(),
  ref        text,
  photo      text,
  nom        text,
  prenom     text,
  age        text,
  dn         text,
  lieu       text,
  prof       text,
  groupe     text,
  anc        text,
  cat        text,
  rarete     text,
  statut     text,
  cni        boolean default true,
  permis     boolean default true,
  collecte   text,
  op         text,
  casier     text,
  police     text,
  crime      text,
  notes      text,
  client     text,
  created_at timestamptz default now()
);

create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  ref        text,
  groupe     text,
  type       text,
  contact    text,
  tel        text,
  conf       text,
  created_at timestamptz default now()
);

create table if not exists sales (
  id         uuid primary key default gen_random_uuid(),
  ref        text,
  date       text,
  client     text,
  type       text,
  prix       numeric,
  resp       text,
  statut     text,
  identity_id uuid,
  identity   text,
  created_at timestamptz default now()
);

-- ---------- Sécurité (RLS) ----------
-- Données partagées : tout utilisateur AUTHENTIFIÉ voit et modifie les mêmes données.
alter table identities enable row level security;
alter table clients    enable row level security;
alter table sales      enable row level security;

drop policy if exists "auth_all_identities" on identities;
drop policy if exists "auth_all_clients"    on clients;
drop policy if exists "auth_all_sales"      on sales;

create policy "auth_all_identities" on identities for all to authenticated using (true) with check (true);
create policy "auth_all_clients"    on clients    for all to authenticated using (true) with check (true);
create policy "auth_all_sales"      on sales      for all to authenticated using (true) with check (true);

-- ---------- Temps réel ----------
-- Active la synchro live entre tous les utilisateurs connectés.
alter publication supabase_realtime add table identities;
alter publication supabase_realtime add table clients;
alter publication supabase_realtime add table sales;

-- ============================================================
--  Après ce script :
--  1) Authentication > Users > Add user
--     email = admin@blackmeridian.app   mot de passe = Identity Card
--     (coche "Auto Confirm User")
--  2) Authentication > Providers > Email : décoche "Confirm email"
--     si tu veux ajouter d'autres comptes sans validation par mail.
-- ============================================================
