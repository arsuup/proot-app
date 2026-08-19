# Worker des missions Proot

Ce Worker sert `GET https://proot.arsuup.fr/api/daily` et renvoie trois missions déterministes pour la journée, avec `title`, `content`, `kind`, `target` et `reward`.

Pour publier après avoir configuré Cloudflare :

```powershell
cd C:\Users\Kazza\proot-app\cloudflare-missions-worker
npm.cmd run deploy
```
