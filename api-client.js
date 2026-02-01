const CLOUDFLARE_API_TOKEN = 'ZskZXvfSxgQZPr5RhIpQyQfEovYtnatq-GDUMACd';
const ACCOUNT_ID = '2a712d86a85d86cb8a14e2954a2c6f19';
const DB_ID = '18d241ad-9c43-4715-83cf-65c04ce1e6ae';

// Initialisation du leaderboard dans le jeu
class LeaderboardAPI {
  constructor() {
    this.baseURL = 'https://territory-battle-api.clawdgtko.workers.dev';
    this.playerPseudo = localStorage.getItem('tb_player_pseudo') || null;
  }

  async register(pseudo) {
    try {
      const response = await fetch(`${this.baseURL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo })
      });
      const data = await response.json();
      if (data.success) {
        this.playerPseudo = pseudo;
        localStorage.setItem('tb_player_pseudo', pseudo);
      }
      return data;
    } catch (e) {
      console.error('Register error:', e);
      return { success: false, error: e.message };
    }
  }

  async submitGame(score, won, stats = {}) {
    if (!this.playerPseudo) return { success: false, error: 'Not registered' };
    
    try {
      const response = await fetch(`${this.baseURL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo: this.playerPseudo,
          score,
          won,
          ...stats
        })
      });
      return await response.json();
    } catch (e) {
      console.error('Submit error:', e);
      return { success: false, error: e.message };
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/api/leaderboard?limit=${limit}`);
      return await response.json();
    } catch (e) {
      console.error('Leaderboard error:', e);
      return { success: false, error: e.message };
    }
  }

  async getPlayerStats(pseudo = this.playerPseudo) {
    try {
      const response = await fetch(`${this.baseURL}/api/player/${pseudo}`);
      return await response.json();
    } catch (e) {
      console.error('Stats error:', e);
      return { success: false, error: e.message };
    }
  }
}

// Export pour utilisation
window.LeaderboardAPI = LeaderboardAPI;
