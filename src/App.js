import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
// Importez les autres vues ici quand elles seront prêtes
// import ReviewView from './components/ReviewView'; 
// import ManageView from './components/ManageView';
// import LibraryView from './components/LibraryView';

function App() {
  // L'état 'currentView' nous dit quelle page afficher. On commence par 'home'.
  const [currentView, setCurrentView] = useState('home');
  
  // Ces états contiendront vos données quand les API fonctionneront
  const [allCards, setAllCards] = useState([]);
  const [itemsData, setItemsData] = useState({});

  // useEffect est l'équivalent de "DOMContentLoaded" pour React.
  // Il se lance une seule fois au démarrage pour charger les données.
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cardsRes, itemsDataRes] = await Promise.all([
          fetch('/api/cards'),
          fetch('/api/items-data')
        ]);
        
        if (!cardsRes.ok || !itemsDataRes.ok) {
            throw new Error('La réponse du serveur n\'est pas OK');
        }

        const cardsJson = await cardsRes.json();
        const itemsDataJson = await itemsDataRes.json();
        
        setAllCards(cardsJson);
        setItemsData(itemsDataJson);
        console.log("Données chargées !", { cards: cardsJson, items: itemsDataJson });

      } catch (e) {
        console.error("Erreur de chargement initial des données:", e);
      }
    }
    loadInitialData();
  }, []); // Le tableau vide [] signifie : "ne lance cet effet qu'une seule fois".

  // Cette fonction choisit le bon composant à afficher
  const renderCurrentView = () => {
    switch (currentView) {
      case 'review':
        // Pour l'instant, on affiche un simple message
        return (
            <div>
                <h2>Page de Révision</h2>
                <button onClick={() => setCurrentView('home')}>← Retour à l'accueil</button>
            </div>
        );
      case 'manage':
        return (
            <div>
                <h2>Page de Gestion des Cartes</h2>
                <button onClick={() => setCurrentView('home')}>← Retour à l'accueil</button>
            </div>
        );
      case 'library':
        return (
            <div>
                <h2>Bibliothèque</h2>
                <button onClick={() => setCurrentView('home')}>← Retour à l'accueil</button>
            </div>
        );
      case 'home':
      default:
        // On passe la fonction setCurrentView à notre composant HomeView
        // pour qu'il puisse changer de page.
        return <HomeView navigateTo={setCurrentView} />;
    }
  };

  return (
    <div className="AppContainer">
      {renderCurrentView()}
    </div>
  );
}

export default App;