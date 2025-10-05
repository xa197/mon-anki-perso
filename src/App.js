// Contenu complet pour App.js - Version MISE À JOUR

import React, { useState } from 'react';
import './style.css'; // Assurez-vous que le chemin vers votre CSS est correct

import AccueilView from './components/AccueilView';
import AtelierView from './components/AtelierView';
import QuizGeneratorView from './components/QuizGeneratorView';

function App() {
  const [currentView, setCurrentView] = useState('accueil'); // Par défaut, on affiche l'accueil
  const [quizQuestions, setQuizQuestions] = useState(null);

  // La fonction "chef d'orchestre" qui change la vue affichée
  const navigateTo = (view) => {
    setCurrentView(view);
  };

  // Fonction pour démarrer le quiz avec les bonnes questions
  const startQuiz = (questions) => {
    setQuizQuestions(questions);
    navigateTo('quiz'); // Affiche la vue du quiz
  }

  // Affiche le bon composant en fonction de l'état 'currentView'
  const renderView = () => {
    switch (currentView) {
      case 'atelier':
        return <AtelierView navigateTo={navigateTo} />;
      case 'quizGenerator':
        return <QuizGeneratorView navigateTo={navigateTo} startQuiz={startQuiz} />;
      // case 'quiz': // On ajoutera le quiz plus tard si besoin
      //   return <QuizView questions={quizQuestions} onQuizEnd={() => navigateTo('accueil')} />;
      case 'accueil':
      default:
        return <AccueilView navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;