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
  
  // --- NOUVEAUX ÉTATS POUR LA MÉMORISATION ---
  const [currentItemForQuiz, setCurrentItemForQuiz] = useState(null); // Pour savoir de quel item vient le quiz
  const [quizHistory, setQuizHistory] = useState({}); // L'historique complet

  // --- Fonctions de chargement et de sauvegarde (ne changent pas) ---
  const loadInitialData = async () => { /* ... */ };
  useEffect(() => { loadInitialData(); }, []);
  const handleSaveItemData = async (item, text) => { /* ... */ };
  const handleGenerateCards = async (item, text) => { /* ... */ };
  const handleCardUpdate = async (updatedCard) => { /* ... */ };

  // --- NOUVELLE FONCTION ---
  // Se déclenche quand un quiz commence. On mémorise l'item et les questions.
  const handleStartQuiz = (questions, item) => {
    setQuizQuestions(questions);
    setCurrentItemForQuiz(item);
    navigateTo('quiz');
  };

  // --- NOUVELLE FONCTION ---
  // Se déclenche quand un quiz est terminé. On sauvegarde les résultats.
  const handleQuizComplete = (results) => {
    console.log("Quiz terminé ! Résultats pour l'item :", currentItemForQuiz, results);
    // On met à jour l'historique
    setQuizHistory(prevHistory => ({
      ...prevHistory, // On garde l'ancien historique
      [currentItemForQuiz]: results // On ajoute ou remplace les résultats pour l'item actuel
    }));
  };

  const navigateTo = (view) => setCurrentView(view);

  const renderCurrentView = () => {
    if (isLoading) { return <div id="loading-spinner"></div>; }
    
    switch (currentView) {
      case 'library':
        return (
          <LibraryView 
            navigateTo={navigateTo}
            allCards={allCards}
            itemsData={itemsData}
            onStartQuiz={handleStartQuiz} // On passe la nouvelle fonction de démarrage
            onSetLoading={setIsLoading}
            onGenerateCards={handleGenerateCards}
          />
        );
      case 'quiz':
        return (
          <QuizView 
            navigateTo={navigateTo} 
            questions={quizQuestions}
            onQuizComplete={handleQuizComplete} // On passe la fonction de sauvegarde des résultats
          />
        );
      
      // ... (les autres vues ne changent pas)
      case 'review': return <ReviewView navigateTo={navigateTo} allCards={allCards} onUpdateCards={handleCardUpdate} />;
      case 'manage': return (<div><h2>Page de Gestion</h2><button onClick={() => navigateTo('home')}>← Accueil</button></div>);
      case 'home':
      default:
        return <HomeView navigateTo={navigateTo} allCards={allCards} itemsData={itemsData} onSaveItem={handleSaveItemData} />;
    }
  };

  return ( <div className="AppContainer">{renderCurrentView()}</div> );
}

export default App;