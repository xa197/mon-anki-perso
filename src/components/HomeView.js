import React from 'react';

// { navigateTo } est une "prop". C'est une fonction que le parent (App.js) va nous donner.
function HomeView({ navigateTo }) {

  // Pour l'instant, la logique de l'atelier se fera plus tard.
  // Concentrons-nous sur l'affichage et la navigation.
  
  return (
    <div id="home-view">
        <div className="home-container"> {/* Rappel : class -> className en JSX */}
            <h1>Mon Anki Perso</h1>
            <div className="home-actions">
                <button onClick={() => navigateTo('review')} className="home-btn">Réviser les cartes</button>
                <button onClick={() => navigateTo('manage')} className="home-btn">Ajouter des cartes</button>
                <button onClick={() => navigateTo('library')} className="home-btn">Consulter la Bibliothèque</button> 
            </div>
            <div className="workshop-container">
                <h2>Atelier de création rapide</h2>
                <p>Choisissez un item pour y ajouter rapidement des notes.</p>
                <div className="workshop-form">
                    <select id="workshop-item-selector"><option value="">-- Choisir un item --</option></select>
                    <textarea id="workshop-textarea" placeholder="Collez vos phrases ou notes ici..."></textarea>
                    <button id="workshop-save-btn">Enregistrer le texte</button>
                </div>
            </div>
        </div>
    </div>
  );
}

export default HomeView;