# 🏆 API Leaderboard - Territory Battle

## ⚠️ Configuration Requise

Le token API Cloudflare fourni n'a pas les permissions nécessaires pour déployer des Workers.

### Option 1: Déploiement manuel via Dashboard

1. Aller sur https://dash.cloudflare.com → Workers & Pages
2. Cliquer "Create application" → "Create Worker"
3. Nommer le worker: `territory-battle-api`
4. Remplacer le code par le contenu de `worker/src/index.js`
5. Cliquer "Deploy"

### Option 2: Créer un token API avec permissions

1. Aller sur https://dash.cloudflare.com/profile/api-tokens
2. "Create Token" → "Custom token"
3. Permissions nécessaires:
   - `Cloudflare Workers:Edit`
   - `Account Settings:Read`
4. Zone Resources: `Include - All zones`
5. Créer le token et le fournir

### Option 3: Utiliser wrangler login

```bash
cd worker
wrangler login
# Ouvrir le lien dans le navigateur et autoriser
wrangler deploy
```

## 📊 Structure de la Base D1

Déjà créée: `territory-battle-db` (ID: 18d241ad-9c43-4715-83cf-65c04ce1e6ae)

### Tables:

```sql
-- Joueurs
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo TEXT UNIQUE NOT NULL,
  wins INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parties
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  territories_conquered INTEGER DEFAULT 0,
  units_lost INTEGER DEFAULT 0,
  units_killed INTEGER DEFAULT 0,
  turns_played INTEGER DEFAULT 0,
  won BOOLEAN DEFAULT 0,
  game_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);
```

## 🔌 Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/health` | GET | Vérifier l'état |
| `/api/init` | POST | Initialiser la DB |
| `/api/register` | POST | Créer un joueur |
| `/api/player/:pseudo` | GET | Stats d'un joueur |
| `/api/game` | POST | Enregistrer une partie |
| `/api/leaderboard` | GET | Classement global |
| `/api/leaderboard/wins` | GET | Top victoires |
| `/api/leaderboard/scores` | GET | Top scores |
| `/api/games/recent` | GET | Dernières parties |

## 🎮 Intégration dans le Jeu

Le fichier `api-client.js` est prêt à être utilisé.

Exemple d'utilisation:

```javascript
const api = new LeaderboardAPI();

// S'enregistrer
await api.register('MonPseudo');

// Soumettre une partie
await api.submitGame(1000, true, {
  territories_conquered: 45,
  units_lost: 12,
  units_killed: 30,
  turns_played: 25
});

// Voir le classement
const leaderboard = await api.getLeaderboard(10);
```

## 🚀 Prochaines étapes

1. [ ] Déployer le Worker (manuel ou avec bon token)
2. [ ] Initialiser la base: `POST /api/init`
3. [ ] Modifier `territory-battle.html` pour intégrer le leaderboard
4. [ ] Ajouter écran de saisie du pseudo
5. [ ] Afficher classement en fin de partie

---

*API prête mais nécessite déploiement manuel ou token avec permissions Workers*
