# 🚀 Déploiement Rapide - Territory Battle API

## Option 1: Dashboard Cloudflare (2 minutes)

### Étape 1: Créer le Worker
1. Aller sur https://dash.cloudflare.com
2. Cliquer **"Workers & Pages"** dans le menu gauche
3. Cliquer **"Create application"**
4. Cliquer **"Create Worker"**
5. Nommer : `territory-battle-api`
6. Cliquer **"Deploy"**

### Étape 2: Modifier le code
1. Cliquer **"Edit code"**
2. Effacer tout le code par défaut
3. Copier-coller le contenu de `worker/dashboard-version.js`
4. Cliquer **"Save and deploy"**

### Étape 3: Ajouter la base de données
1. Cliquer sur **"Settings"** (onglet en haut)
2. Cliquer **"Variables"**
3. Section **"D1 Database Bindings"**
4. Cliquer **"Add binding"**
5. Variable name : `DB`
6. Database : sélectionner `territory-battle-db`
7. Cliquer **"Save"**

### Étape 4: Initialiser
```bash
curl -X POST https://territory-battle-api.clawdgtko.workers.dev/api/init
```

---

## Option 2: Wrangler (si tu as les droits)

```bash
cd worker
wrangler login
wrangler deploy
```

---

## ✅ Vérification

Test rapide :
```bash
curl https://territory-battle-api.clawdgtko.workers.dev/api/health
```

Réponse attendue :
```json
{"status":"ok","service":"Territory Battle API","version":"1.0.0"}
```

---

## 🎮 Utilisation dans le jeu

Une fois déployé, le leaderboard fonctionne automatiquement !

Les joueurs peuvent :
- ✅ S'enregistrer avec un pseudo
- ✅ Voir le classement global
- ✅ Soumettre leurs scores automatiquement
- ✅ Voir leur position dans le top

---

**Le code est prêt dans `worker/dashboard-version.js`**
