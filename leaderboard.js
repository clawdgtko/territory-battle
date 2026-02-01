// 🏆 Territory Battle - Leaderboard Integration
// Client API pour le classement en ligne

(function() {
  'use strict';

  // Configuration
  const API_BASE_URL = 'https://territory-battle-api.clawdgtko.workers.dev';
  
  // Classe API
  class LeaderboardAPI {
    constructor() {
      this.baseURL = API_BASE_URL;
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
        return { success: false, error: 'API unavailable', offline: true };
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
        // Sauvegarder localement pour synchronisation plus tard
        this.queueOfflineGame({ score, won, stats, date: new Date().toISOString() });
        return { success: false, error: 'API unavailable', offline: true };
      }
    }

    async getLeaderboard(limit = 10) {
      try {
        const response = await fetch(`${this.baseURL}/api/leaderboard?limit=${limit}`);
        return await response.json();
      } catch (e) {
        console.error('Leaderboard error:', e);
        return { success: false, error: 'API unavailable', offline: true };
      }
    }

    async getPlayerStats(pseudo = this.playerPseudo) {
      try {
        const response = await fetch(`${this.baseURL}/api/player/${pseudo}`);
        return await response.json();
      } catch (e) {
        console.error('Stats error:', e);
        return { success: false, error: 'API unavailable', offline: true };
      }
    }

    queueOfflineGame(gameData) {
      const queue = JSON.parse(localStorage.getItem('tb_offline_queue') || '[]');
      queue.push(gameData);
      localStorage.setItem('tb_offline_queue', JSON.stringify(queue));
    }

    getOfflineQueue() {
      return JSON.parse(localStorage.getItem('tb_offline_queue') || '[]');
    }

    clearOfflineQueue() {
      localStorage.removeItem('tb_offline_queue');
    }

    logout() {
      this.playerPseudo = null;
      localStorage.removeItem('tb_player_pseudo');
    }
  }

  // Exporter globalement
  window.LeaderboardAPI = LeaderboardAPI;
  window.leaderboardAPI = new LeaderboardAPI();

  // UI pour le leaderboard
  window.showLeaderboardUI = async function() {
    const api = window.leaderboardAPI;
    const result = await api.getLeaderboard(10);
    
    let html = `
      <div id="leaderboard-screen" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.6em;
      ">
        <h2 style="color: #f1c40f; margin-bottom: 30px; font-size: 1.5em; text-shadow: 2px 2px 0 #000;">🏆 CLASSEMENT</h2>
    `;
    
    if (result.offline) {
      html += `
        <div style="color: #e74c3c; text-align: center; padding: 20px;">
          ⚠️ Mode hors ligne<br><br>
          Le classement sera disponible<br>quand l'API sera déployée.
        </div>
      `;
    } else if (result.success && result.leaderboard) {
      html += '<div style="max-height: 60vh; overflow-y: auto;">';
      html += '<table style="border-collapse: collapse;">';
      html += '<tr style="background: #1a1a2e;">'
        + '<th style="padding: 10px; border: 2px solid #333;">RANG</th>'
        + '<th style="padding: 10px; border: 2px solid #333;">JOUEUR</th>'
        + '<th style="padding: 10px; border: 2px solid #333;">VICTOIRES</th>'
        + '<th style="padding: 10px; border: 2px solid #333;">SCORE</th>'
        + '</tr>';
      
      result.leaderboard.forEach((player, index) => {
        const colors = ['#f1c40f', '#95a5a6', '#cd7f32', '#fff'];
        const color = colors[index] || '#fff';
        const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
        
        html += `<tr style="background: ${index % 2 === 0 ? '#0a0a12' : '#1a1a2e'};">`
          + `<td style="padding: 10px; border: 2px solid #333; color: ${color};">${medal}</td>`
          + `<td style="padding: 10px; border: 2px solid #333;">${player.pseudo}</td>`
          + `<td style="padding: 10px; border: 2px solid #333; text-align: center;">${player.wins}</td>`
          + `<td style="padding: 10px; border: 2px solid #333; text-align: center;">${player.total_score}</td>`
          + '</tr>';
      });
      
      html += '</table></div>';
      
      if (result.stats) {
        html += `
          <div style="margin-top: 20px; color: #888; font-size: 0.8em;">
            ${result.stats.total_players} joueurs • ${result.stats.total_games} parties
          </div>
        `;
      }
    } else {
      html += `<div style="color: #e74c3c;">Erreur: ${result.error || 'Unknown'}</div>`;
    }
    
    html += `
        <button onclick="document.getElementById('leaderboard-screen').remove()" 
          style="margin-top: 30px; font-family: 'Press Start 2P', monospace; font-size: 0.8em; 
                 padding: 15px 30px; background: #c0392b; border: 2px solid #e74c3c; color: #fff; 
                 cursor: pointer; box-shadow: 0 4px 0 #8b0000;">
          FERMER
        </button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // UI pour saisir le pseudo
  window.showRegisterUI = function() {
    const existingPseudo = localStorage.getItem('tb_player_pseudo');
    
    const html = `
      <div id="register-screen" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        font-family: 'Press Start 2P', monospace;
      ">
        <h2 style="color: #f1c40f; margin-bottom: 30px; font-size: 1.2em; text-shadow: 2px 2px 0 #000;">
          👤 ENTREZ VOTRE NOM
        </h2>
        <input type="text" id="player-pseudo-input" placeholder="Pseudo" maxlength="20"
          value="${existingPseudo || ''}"
          style="
            font-family: 'Press Start 2P', monospace;
            font-size: 0.8em;
            padding: 15px;
            background: #1a1a2e;
            border: 3px solid #333;
            color: #fff;
            text-align: center;
            width: 250px;
            margin-bottom: 20px;
          ">
        <div id="register-error" style="color: #e74c3c; font-size: 0.7em; margin-bottom: 15px; min-height: 20px;"></div>
        <button onclick="window.handleRegister()" 
          style="font-family: 'Press Start 2P', monospace; font-size: 0.8em; 
                 padding: 15px 30px; background: #27ae60; border: 2px solid #2ecc71; color: #fff; 
                 cursor: pointer; box-shadow: 0 4px 0 #1e8449;">
          JOUER
        </button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    document.getElementById('player-pseudo-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.handleRegister();
    });
    document.getElementById('player-pseudo-input').focus();
  };

  window.handleRegister = async function() {
    const input = document.getElementById('player-pseudo-input');
    const errorDiv = document.getElementById('register-error');
    const pseudo = input.value.trim();
    
    if (pseudo.length < 2 || pseudo.length > 20) {
      errorDiv.textContent = 'Pseudo: 2-20 caractères';
      return;
    }
    
    const result = await window.leaderboardAPI.register(pseudo);
    
    if (result.success || result.offline) {
      document.getElementById('register-screen').remove();
      if (typeof startGame === 'function') {
        startGame();
      }
    } else {
      errorDiv.textContent = result.error || 'Erreur';
    }
  };

  // Soumettre une partie à la fin
  window.submitGameResult = async function(score, won, stats = {}) {
    const result = await window.leaderboardAPI.submitGame(score, won, stats);
    console.log('Game submitted:', result);
    return result;
  };

  console.log('🏆 Leaderboard API loaded');
})();
