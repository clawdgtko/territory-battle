# 🚀 Activation du Leaderboard - Dernière étape

## ✅ Déjà fait :
- ✅ Jeu déployé sur https://territory-battle.pages.dev
- ✅ API Functions déployées
- ✅ Base D1 créée (ID: 18d241ad-9c43-4715-83cf-65c04ce1e6ae)

## 🔧 Dernière étape (1 minute) :

### 1. Aller sur le Dashboard
https://dash.cloudflare.com → **Workers & Pages** → **territory-battle**

### 2. Cliquer sur "Settings" (onglet en haut)

### 3. Dans le menu de gauche, cliquer **"Functions"**

### 4. Section **"D1 Database Bindings"**
- Cliquer **"Add binding"**
- Variable name : `DB`
- Database : sélectionner **"territory-battle-db"**
- Cliquer **"Save"**

### 5. Redéployer
```bash
cd ~/.openclaw/workspace/territory-battle
wrangler pages deploy . --project-name="territory-battle" --branch="main"
```

### 6. Initialiser la base
```bash
curl -X POST https://territory-battle.pages.dev/api/init
```

## 🎮 Test
Une fois fait, le leaderboard fonctionnera !

Test rapide :
```bash
curl https://territory-battle.pages.dev/api/health
```

Réponse attendue :
```json
{"status":"ok","service":"Territory Battle API","version":"1.0.0"}
```

---

**C'est la dernière étape, après ça tout fonctionne !** 🎉
