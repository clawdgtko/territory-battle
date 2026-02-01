// Territory Battle API - Single File Version
// Copy-paste this into Cloudflare Dashboard

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function initDB(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pseudo TEXT UNIQUE NOT NULL,
      wins INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      territories_conquered INTEGER DEFAULT 0,
      units_lost INTEGER DEFAULT 0,
      units_killed INTEGER DEFAULT 0,
      turns_played INTEGER DEFAULT 0,
      won BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_player_stats ON players(wins, total_score)`)
  ]);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    try {
      // Health check
      if (path === '/api/health' && method === 'GET') {
        return jsonResponse({ status: 'ok', service: 'Territory Battle API', version: '1.0.0' });
      }
      
      // Init DB
      if (path === '/api/init' && method === 'POST') {
        await initDB(env.DB);
        return jsonResponse({ success: true, message: 'Database initialized' });
      }
      
      // Register player
      if (path === '/api/register' && method === 'POST') {
        const { pseudo } = await request.json();
        if (!pseudo || pseudo.length < 2 || pseudo.length > 20) {
          return jsonResponse({ success: false, error: 'Pseudo must be 2-20 characters' }, 400);
        }
        
        const existing = await env.DB.prepare('SELECT id FROM players WHERE pseudo = ?').bind(pseudo).first();
        if (existing) {
          return jsonResponse({ success: false, error: 'Pseudo already taken' }, 409);
        }
        
        const result = await env.DB.prepare('INSERT INTO players (pseudo) VALUES (?)').bind(pseudo).run();
        return jsonResponse({ 
          success: true, 
          player: { id: result.meta.last_row_id, pseudo, wins: 0, games_played: 0, total_score: 0, best_score: 0 }
        });
      }
      
      // Get player stats
      if (path.startsWith('/api/player/') && method === 'GET') {
        const pseudo = path.split('/')[3];
        const player = await env.DB.prepare('SELECT * FROM players WHERE pseudo = ?').bind(pseudo).first();
        if (!player) return jsonResponse({ success: false, error: 'Player not found' }, 404);
        
        const games = await env.DB.prepare('SELECT * FROM games WHERE player_id = ? ORDER BY created_at DESC LIMIT 10')
          .bind(player.id).all();
        
        // Calculate rank
        const rankResult = await env.DB.prepare(`
          SELECT COUNT(*) + 1 as rank FROM players 
          WHERE wins > ? OR (wins = ? AND total_score > ?)
        `).bind(player.wins, player.wins, player.total_score).first();
        
        return jsonResponse({ success: true, player: { ...player, rank: rankResult?.rank || 1, recent_games: games.results || [] } });
      }
      
      // Submit game
      if (path === '/api/game' && method === 'POST') {
        const { pseudo, score = 0, territories_conquered = 0, units_lost = 0, units_killed = 0, turns_played = 0, won = false } = await request.json();
        
        if (!pseudo) return jsonResponse({ success: false, error: 'Pseudo required' }, 400);
        
        let player = await env.DB.prepare('SELECT id FROM players WHERE pseudo = ?').bind(pseudo).first();
        if (!player) {
          const result = await env.DB.prepare('INSERT INTO players (pseudo) VALUES (?)').bind(pseudo).run();
          player = { id: result.meta.last_row_id };
        }
        
        await env.DB.prepare(`INSERT INTO games 
          (player_id, score, territories_conquered, units_lost, units_killed, turns_played, won) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(player.id, score, territories_conquered, units_lost, units_killed, turns_played, won ? 1 : 0).run();
        
        await env.DB.prepare(`UPDATE players SET 
          games_played = games_played + 1, wins = wins + ?, total_score = total_score + ?, best_score = MAX(best_score, ?)
          WHERE id = ?`).bind(won ? 1 : 0, score, score, player.id).run();
        
        const updated = await env.DB.prepare('SELECT * FROM players WHERE id = ?').bind(player.id).first();
        return jsonResponse({ success: true, message: won ? 'Victory recorded!' : 'Game recorded', player: updated });
      }
      
      // Leaderboard
      if (path === '/api/leaderboard' && method === 'GET') {
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 100);
        const leaderboard = await env.DB.prepare(`
          SELECT pseudo, wins, games_played, total_score, best_score,
            ROUND(CAST(wins AS FLOAT) / NULLIF(games_played, 0) * 100, 1) as win_rate,
            RANK() OVER (ORDER BY wins DESC, total_score DESC) as rank
          FROM players WHERE games_played > 0 ORDER BY wins DESC, total_score DESC LIMIT ?
        `).bind(limit).all();
        
        const stats = await env.DB.prepare('SELECT COUNT(*) as total_players, SUM(games_played) as total_games, SUM(wins) as total_wins FROM players').first();
        
        return jsonResponse({ success: true, leaderboard: leaderboard.results || [], stats });
      }
      
      // Recent games
      if (path === '/api/games/recent' && method === 'GET') {
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
        const games = await env.DB.prepare(`
          SELECT p.pseudo, g.score, g.territories_conquered, g.won, datetime(g.created_at) as played_at
          FROM games g JOIN players p ON g.player_id = p.id ORDER BY g.created_at DESC LIMIT ?
        `).bind(limit).all();
        
        return jsonResponse({ success: true, games: games.results || [] });
      }
      
      return jsonResponse({ success: false, error: 'Not found' }, 404);
      
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500);
    }
  }
};
