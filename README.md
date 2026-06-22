# Black Meridian — Identity Business (Le Registre)

Application de gestion (React + Vite + **Supabase**). Toutes les données sont stockées dans Supabase, partagées et synchronisées en temps réel entre tous les utilisateurs connectés.

---

## 1. Créer le projet Supabase
1. https://supabase.com → **New project**.
2. **SQL Editor → New query**, colle **`supabase_schema.sql`** (fourni) → **Run**.
   Tables `identities` / `clients` / `sales`, sécurité RLS (données partagées entre utilisateurs connectés), et temps réel activés.

## 2. Compte administrateur
1. **Authentication → Users → Add user**
   - Email : `admin@blackmeridian.app`
   - Mot de passe : `Identity Card`
   - Coche **Auto Confirm User**
2. (Optionnel) **Authentication → Providers → Email** : décoche **Confirm email** pour ajouter d'autres comptes sans validation mail.

Sur la page de connexion, le nom d'utilisateur **`Black Meridian V7`** est relié automatiquement à `admin@blackmeridian.app`.
Identifiants : **Black Meridian V7** / **Identity Card**.
Autres opérateurs : crée-les dans Supabase (email + mot de passe), connecte-toi avec leur email — ou ajoute un alias dans l'objet `ACCOUNTS` de `src/supabaseClient.js`.

## 3. Clés API
**Project Settings → API** :
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` → `VITE_SUPABASE_ANON_KEY`

## 4. Local
```bash
cp .env.example .env      # colle tes 2 valeurs
npm install
npm run dev
```

## 5. Vercel
1. Pousse sur GitHub, importe sur Vercel (preset **Vite** auto-détecté).
2. **Settings → Environment Variables** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
3. **Deploy**.

---

## Fonctionnement
- **Connexion** obligatoire (auth Supabase) avant l'application.
- **Ajout / Modification / Suppression** sur identités, clients et ventes — suppression avec confirmation « Voulez-vous vraiment supprimer cette donnée ? ».
- **Synchro temps réel** entre tous les utilisateurs connectés.
- **Persistance** après fermeture du navigateur ou changement d'appareil (tout dans Supabase, plus rien en localStorage).
- **Tableau de bord** : stats globales (identités, clients, ventes, CA total) + indicateurs opérationnels.

## Vérification
- Crée un profil → visible dans Supabase (Table editor → identities).
- 2ᵉ navigateur connecté au même compte → mêmes données, mises à jour en direct.
- Modifie / supprime → la base se met à jour.

## Structure
```
supabase_schema.sql   ← à exécuter dans Supabase
.env.example
public/logo.png
src/main.jsx
src/App.jsx           ← application (auth + Supabase + UI)
src/supabaseClient.js ← connexion + mapping nom→email
src/index.css
```
