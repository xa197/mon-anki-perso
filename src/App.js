import React, { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [allCards, setAllCards] = useState([]);
  // ... autres états ...

  useEffect(() => {
    async function loadInitialData() {
      try {
        const cardsRes = await fetch('/api/cards');
        const cardsJson = await cardsRes.json();
        setAllCards(cardsJson);
      } catch (e) {
        console.error("Erreur de chargement initial des données:", e);
      }
    }
    loadInitialData();
  }, []);

  if (currentView === 'home') {
    return (
      <div>
        <h1>Mon Anki Perso</h1>
        <button onClick={() => setCurrentView('review')}>Réviser les cartes</button>
        {/* ... autres boutons ... */}
      </div>
    );
  }
  
  if (currentView === 'review') {
    return (
      <div>
        <button onClick={() => setCurrentView('home')}>Accueil</button>
        <h2>Page de révision</h2>
        <p>Nombre de cartes: {allCards.length}</p>
      </div>
    );
  }

  return <div>Vue inconnue</div>;
}

export default App;