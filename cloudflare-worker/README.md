# Worker Cloudflare de Root

Ce Worker utilise Workers AI : il ne dépend plus de Gemini et aucune clé d'IA ne se trouve dans l'app mobile.

## Déployer

Dans ce dossier :

```powershell
npm install
npx wrangler login
npm run deploy
```

Cloudflare affiche alors une URL du type `https://proot-root-ai.<sous-domaine>.workers.dev`.

Dans le fichier `.env` à la racine de Proot, ajoute :

```env
EXPO_PUBLIC_ROOT_AI_URL=https://proot-root-ai.<sous-domaine>.workers.dev/ai
```

Supprime ensuite les anciennes lignes `EXPO_PUBLIC_GEMINI_*`, puis relance Expo avec `npx expo start -c`.

## Test

```powershell
Invoke-RestMethod -Uri "https://proot-root-ai.<sous-domaine>.workers.dev/ai" -Method POST -ContentType "application/json" -Body '{"prompt":"Réponds uniquement : TEST OK"}'
```

Le résultat attendu contient une propriété `text`.
