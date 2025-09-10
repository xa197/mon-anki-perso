import React from 'react';

function AccueilView({ navigateTo }) {
  return (
    <div className="view-container">
      <h1>Mon Anki Perso</h1>
      <div className="home-actions">
        <button className="home-btn" onClick={() => navigateTo('atelier')}>
          Gérer le Contenu des Items (Atelier)
        </button>
        <button className="home-btn" onClick={() => navigateTo('quizGenerator')}>
          Lancer un Quiz Personnalisé
        </button>
      </div>
    </div>
  );
}

export default AccueilView;