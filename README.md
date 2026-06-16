# Le Registre — Bureau des Identités

Application de gestion (React + Vite). Stock d'identités, fiches profil, clients, ventes, tableau de bord.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (par défaut http://localhost:5173).

## Build de production

```bash
npm run build      # génère le dossier dist/
npm run preview    # prévisualise le build
```

## Déployer sur Vercel

### Option A — via le site Vercel (le plus simple)
1. Mets ce dossier sur un dépôt GitHub.
2. Sur https://vercel.com → **Add New… → Project** → importe le dépôt.
3. Vercel détecte **Vite** automatiquement :
   - Build Command : `npm run build`
   - Output Directory : `dist`
4. Clique **Deploy**.

### Option B — via la ligne de commande
```bash
npm i -g vercel
vercel        # première fois : suis les questions
vercel --prod # déploiement en production
```

## Notes
- Les données saisies (profils, clients, ventes, photos) sont **enregistrées localement dans le navigateur** (localStorage). Elles persistent après rechargement mais restent sur l'appareil utilisé — ce n'est pas encore une base partagée.
- Pour une vraie base multi-utilisateurs (synchro entre appareils), il faudra brancher un backend (ex. Supabase). Dis-le quand tu veux passer à cette étape.

## Structure
```
index.html
vite.config.js
vercel.json
public/logo.png
src/
  main.jsx
  App.jsx        ← toute l'application
  index.css
```
