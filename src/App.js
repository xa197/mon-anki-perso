import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import LibraryView from './components/LibraryView';
import QuizView from './components/QuizView'; // ON IMPORTE LA VUE DU QUIZ

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [allCards, setAllCards] = useState([]);
  const [itemsData, setItemsData] = useState({});
  // --- NOUVEAUX ÉTATS ---
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadInitialData = async () => { /* ... (ne change pas) ... */
    try {
      const [cardsRes, itemsDataRes] = await Promise.all([ fetch('/api/cards'), fetch('/api/items-data') ]);
      if (!cardsRes.ok || !itemsDataRes.ok) { throw new Error('Erreur serveur'); }
      setAllCards(await cardsRes.json());
      setItemsData(await itemsDataRes.json());
    } catch (e) { console.error("Erreur chargement:", e); }
  };
  
  useEffect(() => { loadInitialData(); }, []);

  const handleSaveItemData = async (item, text) => { /* ... (ne change pas) ... */
    try {
      await fetch('/api/items-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item, text }) });
      await loadInitialData();
      alert('Texte enregistré !');
    } catch (e) { alert('Échec.'); }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'library':
        return (
          <LibraryView 
            navigateTo={setCurrentView} 
            allCards={allCards}
            itemsData={itemsData}
            // On passe les fonctions pour mettre à jour l'état du quiz
            onSetQuiz={setQuizQuestions}
            onSetLoading={setIsLoading}
          />
        );
      case 'quiz':
        // On affiche un spinner si c'est en cours de chargement
        if (isLoading) {
          return <div id="loading-spinner"></div>;
        }
        return <QuizView navigateTo={setCurrentView} questions={quizQuestions} />;
      
      // ... (les autres vues ne changent pas)
      case 'review': return (<div><h2>Page de Révision</h2><button onClick={() => setCurrentView('home')}>← Accueil</button></div>);
      case 'manage': return (<div><h2>Page de Gestion</h2><button onClick={() => setCurrentView('home')}>← Accueil</button></div>);
      case 'home':
      default:
        return (
          <HomeView 
            navigateTo={setCurrentView} 
            allCards={allCards}
            itemsData={itemsData}
            onSaveItem={handleSaveItemData} 
          />
        );
    }
  };

  return ( <div className="AppContainer">{renderCurrentView()}</div> );
}

export default App;