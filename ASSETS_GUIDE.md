# 🎮 Assets Médiévaux Gratuits pour Territory Battle

## 🖼️ Sites de sprites gratuits

### 1. **OpenGameArt.org** (Recommandé)
- https://opengameart.org
- Rechercher : "medieval soldiers", "fantasy units", "strategy game"
- Licences : CC0 (public domain), CC-BY (avec attribution)

### 2. **Itch.io** (Assets gratuits)
- https://itch.io/game-assets/free
- Tags : "medieval", "fantasy", "pixel art", "strategy"
- Excellente qualité, souvent CC0

### 3. **Kenney.nl** (Assets gratuits)
- https://kenney.nl/assets
- Rechercher : "strategy", "rpg", "fantasy"
- Tous en CC0 (utilisation libre)

### 4. **Craftpix.net**
- https://craftpix.net/freebies/
- Section "Free Game Assets"
- Personnages 2D médiévaux de qualité

### 5. **Game-icons.net**
- https://game-icons.net
- Icônes SVG gratuites pour l'interface
- Parfait pour les boutons et statistiques

---

## 🎨 Sprites spécifiques recherchés

Pour remplacer les emojis actuels, cherchez :

| Type | Nom de fichier suggéré | Taille recommandée |
|------|------------------------|-------------------|
| Soldat basique | `soldier_idle.png` | 64×64px |
| Archer | `archer.png` | 64×64px |
| Chevalier | `knight.png` | 64×64px |
| Roi/Héros | `king.png` | 64×64px |

### Format recommandé :
- **PNG** avec transparence
- **64×64px** ou **32×32px** par unité
- Style **pixel art** ou **cartoon médiéval**

---

## 🏰 Packs d'assets complets suggérés

### Pack "Tiny Medieval"
- Style cute/chibi
- Parfait pour jeu mobile
- Souvent gratuit sur itch.io

### Pack "Strategy Units"
- Vues de dessus (top-down)
- Idéal pour territorial
- Chercher "top down soldier sprites"

### Pack "Fantasy Kingdom"
- Bâtiments + unités
- Style cohérent
- Pour remplacer emojis terrains

---

## 🔧 Intégration

Une fois les sprites téléchargés :

1. Créer un dossier `assets/` dans le projet
2. Remplacer les emojis dans le code :
   ```javascript
   // Avant
   emojis: ['🧍','🚶','🏃','🤺','⚔️','🛡️','👑']
   
   // Après (avec sprites)
   sprites: ['soldier1.png','soldier2.png','knight.png','king.png']
   ```

3. Modifier le CSS pour afficher des images :
   ```css
   .unit::after {
       content: '';
       background-image: var(--unit-sprite);
       background-size: contain;
       width: 100%;
       height: 100%;
   }
   ```

---

## 📦 Alternative : Emoji améliorés

Si tu veux garder les emojis mais plus variés :

```javascript
const UNIT_EMOJIS = {
    1: ['🧍', '🧍‍♂️', '🧍‍♀️'],  // Recrues
    2: ['🚶', '🚶‍♂️', '🚶‍♀️'],  // Soldats
    3: ['🏃', '🏃‍♂️', '🏃‍♀️'],  // Combattants
    4: ['🤺'],  // Duellistes
    5: ['⚔️'],  // Guerriers
    6: ['🛡️'],  // Chevaliers
    7: ['🐴'],  // Cavaliers
    8: ['👑'],  // Généraux
    9: ['🏰']   // Roi
};
```

---

## 💡 Conseil

Pour un prototype rapide, les **emojis actuels** sont parfaits.
Pour une version finale, les **sprites sur itch.io** (packs à $0) offrent le meilleur rapport qualité/simplicité.

---

*Généré pour Territory Battle - 2026*
