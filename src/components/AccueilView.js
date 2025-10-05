// Contenu complet pour AccueilView.js - Version MISE À JOUR

import React from 'react';

// Le composant reçoit maintenant la fonction navigateTo en "prop"
function AccueilView({ navigateTo }) {
  return (
    <div className="view-container">
      <h1>Mon Anki Perso</h1>
      <div className="home-actions">
        {/* Ce bouton naviguera vers la vue 'atelier' */}
        <button className="home-btn" onClick={() => navigateTo('atelier')}>
          Gérer le Contenu des Items (Atelier)
        </button>
        
        {/* Ce bouton naviguera vers la vue 'quizGenerator' */}
        <button className="home-btn" onClick={() => navigateTo('quizGenerator')}>
          Lancer un Quiz Personnalisé
        </button>
      </div>
    </div>
  );
}

export default AccueilView;