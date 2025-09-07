import React, { useState } from 'react';

// On reçoit `onStartQuiz` à la place de `onSetQuiz`
function LibraryView({ navigateTo, allCards, itemsData, onStartQuiz, onSetLoading, onGenerateCards }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [numQCM, setNumQCM] = useState(3);
  const [numQRU, setNumQRU] = useState(2);

  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));
  sortedItems.unshift("500: Divers");

  const handleGenerateQuiz = async () => {
    if (!selectedItem || !itemsData[selectedItem]) return;
    onSetLoading(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: itemsData[selectedItem], numQCM, numQRU })
      });
      if (!response.ok) throw new Error('Erreur API');
      const quizData = await response.json();
      
      // ON APPELLE LA NOUVELLE FONCTION AVEC LES QUESTIONS ET L'ITEM
      onStartQuiz(quizData.questions, selectedItem);
      
    } catch (error) {
      console.error("Erreur génération quiz:", error);
      onStartQuiz([], selectedItem); // On démarre un quiz vide en cas d'erreur
    } finally {
      onSetLoading(false);
    }
  };
  
  const handleCreateCardsClick = () => { /* ... (ne change pas) ... */ };

  return (
    <div id="library-view">
      {/* ... (tout le reste du JSX ne change pas) ... */}
      <div className="library-header">
        <button onClick={() => navigateTo('home')}>← Accueil</button>
        {/* ... */}
      </div>
      {/* ... */}
      <div id="library-actions-container">
        {selectedItem && itemsData[selectedItem] && (
          <>
            <button className="ia-btn" onClick={handleGenerateQuiz}>S'entraîner (Quiz IA)</button>
            <button className="ia-btn success" onClick={() => onGenerateCards(selectedItem, itemsData[selectedItem])}>Créer des cartes (IA)</button>
          </>
        )}
      </div>
    </div>
  );
}

export default LibraryView;