import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import LibraryView from './components/LibraryView';
import QuizView from './components/QuizView';
import ReviewView from './components/ReviewView';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [allCards, setAllCards] = useState([]);
  const [itemsData, setItemsData] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Fonctions de chargement et de sauvegarde ---
  const loadInitialData = async () => {
    try {
      const [cardsRes, itemsDataRes] = await Promise.all([ fetch('/api/cards'), fetch('/api/items-data') ]);
      if (!cardsRes.ok || !itemsDataRes.ok) { throw new Error('Erreur serveur'); }
      setAllCards(await cardsRes.json());
      setItemsData(await itemsDataRes.json());
    } catch (e) { console.error("Erreur chargement:", e); }
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleSaveItemData = async (item, text) => {
    try {
      await fetch('/api/items-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item, text }) });
      await loadInitialData(); // Recharge les données après sauvegarde
      alert('Texte enregistré !');
    } catch (e) { alert('Échec.'); }
  };

  const handleGenerateCards = async (item, text) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, text }),
      });
      if (!response.ok) throw new Error('Erreur serveur génération cartes.');

      const result = await response.json();
      alert(result.message);
      await loadInitialData(); // Recharge les données après génération
    } catch (error) {
      console.error(error);
      alert("Impossible de générer les cartes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardUpdate = async (updatedCard) => {
    const newCardsList = allCards.map(card => card.id === updatedCard.id ? updatedCard : card);
    setAllCards(newCardsList); // Met à jour l'état local immédiatement pour la réactivité
    try {
      await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCardsList) });
    } catch (e) { console.error("Échec sauvegarde carte:", e); }
  };

  // --- Rendu des vues ---
  const renderCurrentView = () => {
    if (isLoading) { return <div id="loading-spinner"></div>; }
    
    switch (currentView) {
      case 'review':
        return <ReviewView navigateTo={setCurrentView} allCards={allCards} onUpdateCards={handleCardUpdate} />;
      case 'library':
        return <LibraryView navigateTo={setCurrentView} allCards={allCards} itemsData={itemsData} onSetQuiz={setQuizQuestions} onSetLoading={setIsLoading} onGenerateCards={handleGenerateCards} />;
      case 'quiz':
        return <QuizView navigateTo={setCurrentView} questions={quizQuestions} />;
      case 'manage': 
        return (<div><h2>Page de Gestion</h2><button onClick={() => setCurrentView('home')}>← Accueil</button></div>);
      case 'home':
      default:
        return <HomeView navigateTo={setCurrentView} allCards={allCards} itemsData={itemsData} onSaveItem={handleSaveItemData} />;
    }
  };

  return ( <div className="AppContainer">{renderCurrentView()}</div> );
}

export default App;