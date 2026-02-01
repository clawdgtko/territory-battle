// Territory Battle API - Leaderboard & Stats
// Cloudflare Worker avec D1

import { Router } from './router.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialisation de la base de données
async function initDB(db) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pseudo TEXT UNIQUE NOT NULL,
        wins INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS games (
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
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_player_stats ON players(wins, total_score)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_id, created_at)
    `)
  ]);
}

// Réponse JSON avec CORS
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Routes
const router = new Router();

// Health check
router.get('/api/health', async (request, env) => {
  return jsonResponse({ 
    status: 'ok', 
    service: 'Territory Battle API',
    version: '1.0.0'
  });
});

// Initialiser la DB (à appeler une fois au déploiement)
router.post('/api/init', async (request, env) => {
  try {
    await initDB(env.DB);
    return jsonResponse({ success: true, message: 'Database initialized' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Enregistrer un nouveau joueur
router.post('/api/register', async (request, env) => {
  try {
    const { pseudo } = await request.json();
    
    if (!pseudo || pseudo.length < 2 || pseudo.length > 20) {
      return jsonResponse({ 
        success: false, 
        error: 'Pseudo must be between 2 and 20 characters' 
      }, 400);
    }
    
    // Vérifier si le pseudo existe déjà
    const existing = await env.DB.prepare(
      'SELECT id FROM players WHERE pseudo = ?'
    ).bind(pseudo).first();
    
    if (existing) {
      return jsonResponse({ 
        success: false, 
        error: 'Pseudo already taken' 
      }, 409);
    }
    
    // Créer le joueur
    const result = await env.DB.prepare(
      'INSERT INTO players (pseudo) VALUES (?)'
    ).bind(pseudo).run();
    
    return jsonResponse({ 
      success: true, 
      player: {
        id: result.meta.last_row_id,
        pseudo,
        wins: 0,
        games_played: 0,
        total_score: 0,
        best_score: 0
      }
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Récupérer les infos d'un joueur
router.get('/api/player/:pseudo', async (request, env) => {
  try {
    const { pseudo } = request.params;
    
    const player = await env.DB.prepare(`
      SELECT 
        p.*,
        RANK() OVER (ORDER BY p.wins DESC, p.total_score DESC) as rank
      FROM players p
      WHERE p.pseudo = ?
    `).bind(pseudo).first();
    
    if (!player) {
      return jsonResponse({ success: false, error: 'Player not found' }, 404);
    }
    
    // Récupérer l'historique des parties récentes
    const recentGames = await env.DB.prepare(`
      SELECT 
        g.*,
        datetime(g.created_at) as played_at
      FROM games g
      JOIN players p ON g.player_id = p.id
      WHERE p.pseudo = ?
      ORDER BY g.created_at DESC
      LIMIT 10
    `).bind(pseudo).all();
    
    return jsonResponse({
      success: true,
      player: {
        ...player,
        recent_games: recentGames.results || []
      }
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Enregistrer une partie
router.post('/api/game', async (request, env) => {
  try {
    const { 
      pseudo, 
      score = 0, 
      territories_conquered = 0,
      units_lost = 0,
      units_killed = 0,
      turns_played = 0,
      won = false,
      game_data = null
    } = await request.json();
    
    if (!pseudo) {
      return jsonResponse({ success: false, error: 'Pseudo required' }, 400);
    }
    
    // Récupérer ou créer le joueur
    let player = await env.DB.prepare(
      'SELECT id FROM players WHERE pseudo = ?'
    ).bind(pseudo).first();
    
    if (!player) {
      // Auto-créer le joueur s'il n'existe pas
      const result = await env.DB.prepare(
        'INSERT INTO players (pseudo) VALUES (?)'
      ).bind(pseudo).run();
      player = { id: result.meta.last_row_id };
    }
    
    // Enregistrer la partie
    await env.DB.prepare(`
      INSERT INTO games 
      (player_id, score, territories_conquered, units_lost, units_killed, turns_played, won, game_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      player.id, 
      score, 
      territories_conquered,
      units_lost,
      units_killed,
      turns_played,
      won ? 1 : 0,
      game_data ? JSON.stringify(game_data) : null
    ).run();
    
    // Mettre à jour les stats du joueur
    await env.DB.prepare(`
      UPDATE players 
      SET 
        games_played = games_played + 1,
        wins = wins + ?,
        total_score = total_score + ?,
        best_score = MAX(best_score, ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(won ? 1 : 0, score, score, player.id).run();
    
    // Récupérer les nouvelles stats
    const updatedPlayer = await env.DB.prepare(`
      SELECT * FROM players WHERE id = ?
    `).bind(player.id).first();
    
    return jsonResponse({
      success: true,
      message: won ? 'Victory recorded!' : 'Game recorded',
      player: updatedPlayer
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Classement global
router.get('/api/leaderboard', async (request, env) => {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    const leaderboard = await env.DB.prepare(`
      SELECT 
        pseudo,
        wins,
        games_played,
        total_score,
        best_score,
        ROUND(CAST(wins AS FLOAT) / NULLIF(games_played, 0) * 100, 1) as win_rate,
        RANK() OVER (ORDER BY wins DESC, total_score DESC) as rank
      FROM players
      WHERE games_played > 0
      ORDER BY wins DESC, total_score DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    // Stats globales
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_players,
        SUM(games_played) as total_games,
        SUM(wins) as total_wins
      FROM players
    `).first();
    
    return jsonResponse({
      success: true,
      leaderboard: leaderboard.results || [],
      stats: {
        ...stats,
        total_players: stats.total_players || 0,
        total_games: stats.total_games || 0,
        total_wins: stats.total_wins || 0
      },
      pagination: {
        limit,
        offset,
        has_more: (leaderboard.results || []).length === limit
      }
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Top victoires
router.get('/api/leaderboard/wins', async (request, env) => {
  try {
    const leaderboard = await env.DB.prepare(`
      SELECT 
        pseudo,
        wins,
        games_played,
        ROUND(CAST(wins AS FLOAT) / NULLIF(games_played, 0) * 100, 1) as win_rate
      FROM players
      WHERE games_played > 0
      ORDER BY wins DESC, games_played ASC
      LIMIT 20
    `).all();
    
    return jsonResponse({
      success: true,
      leaderboard: leaderboard.results || []
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Top scores
router.get('/api/leaderboard/scores', async (request, env) => {
  try {
    const leaderboard = await env.DB.prepare(`
      SELECT 
        pseudo,
        best_score,
        total_score,
        games_played
      FROM players
      WHERE games_played > 0
      ORDER BY best_score DESC
      LIMIT 20
    `).all();
    
    return jsonResponse({
      success: true,
      leaderboard: leaderboard.results || []
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Dernières parties
router.get('/api/games/recent', async (request, env) => {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
    
    const games = await env.DB.prepare(`
      SELECT 
        p.pseudo,
        g.score,
        g.territories_conquered,
        g.won,
        datetime(g.created_at) as played_at
      FROM games g
      JOIN players p ON g.player_id = p.id
      ORDER BY g.created_at DESC
      LIMIT ?
    `).bind(limit).all();
    
    return jsonResponse({
      success: true,
      games: games.results || []
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// Gérer les requêtes
export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      return await router.handle(request, env);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500);
    }
  }
};
