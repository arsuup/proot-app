# Worker des missions quotidiennes

Ce Worker renvoie trois missions identiques pour toute la journée. Chaque tâche contient `title`, `content`, `id` et `reward` (10 gemmes).

## Déploiement

```powershell
cd C:\Users\Kazza\proot-app\cloudflare-missions-worker
npm.cmd install
npx.cmd wrangler login
npm.cmd run deploy
```

Dans Cloudflare, associez ensuite le Worker à la route :

```text
proot.arsuup.fr/api/dailymission*
```

Test :

```powershell
Invoke-RestMethod -Uri "https://proot.arsuup.fr/api/dailymission"
```

Le résultat doit être un JSON avec `tasks`, contenant exactement trois objets.
