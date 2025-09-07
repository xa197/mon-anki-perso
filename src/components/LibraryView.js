import React, { useState } from 'react';

// On ajoute la nouvelle prop `onGenerateCards`
function LibraryView({ navigateTo, allCards, itemsData, onSetQuiz, onSetLoading, onGenerateCards }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [numQCM, setNumQCM] = useState(3);
  const [numQRU, setNumQRU] = useState(2);

  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));
  sortedItems.unshift("500: Divers");

  const handleGenerateQuiz = async () => {
    if (!selectedItem || !itemsData[selectedItem]) return;
    onSetLoading(true);
    navigateTo('quiz');
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: itemsData[selectedItem], numQCM, numQRU })
      });
      if (!response.ok) throw new Error('Erreur de l\'API');
      const quizData = await response.json();
      onSetQuiz(quizData.questions);
    } catch (error) {
      console.error("Erreur génération quiz:", error);
      onSetQuiz([]);
    } finally {
      onSetLoading(false);
    }
  };

  // --- NOUVELLE FONCTION ---
  // Fonction qui sera appelée au clic sur le bouton "Créer des cartes"
  const handleCreateCardsClick = () => {
    if (selectedItem && itemsData[selectedItem]) {
      // On appelle la fonction du parent (App.js) pour qu'il gère la logique
      onGenerateCards(selectedItem, itemsData[selectedItem]);
    }
  };

  return (
    <div id="library-view">
      <div className="library-header">
        <button onClick={() => navigateTo('home')}>← Accueil</button>
        <div className="library-selector-container">
          <label htmlFor="library-item-selector">Consulter l'item :</label>
          <select id="library-item-selector" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">-- Choisir un item --</option>
            {sortedItems.map(item => (<option key={item} value={item}>{item}</option>))}
          </select>
        </div>
      </div>

      <div id="library-content-display">
        {selectedItem ? (<p>{itemsData[selectedItem] || 'Aucune note enregistrée pour cet item.'}</p>) : (<p className="placeholder-text">Veuillez sélectionner un item.</p>)}
      </div>
      
      {selectedItem && itemsData[selectedItem] && (
        <div className="generation-options">
          <label>QCM : <input type="number" min="0" value={numQCM} onChange={e => setNumQCM(parseInt(e.target.value))} /></label>
          <label>QRU : <input type="number" min="0" value={numQRU} onChange={e => setNumQRU(parseInt(e.target.value))} /></label>
        </div>
      )}

      <div id="library-actions-container">
        {selectedItem && itemsData[selectedItem] && (
          <>
            <button className="ia-btn" onClick={handleGenerateQuiz}>S'entraîner (Quiz IA)</button>
            {/* On lie notre nouvelle fonction au clic */}
            <button className="ia-btn success" onClick={handleCreateCardsClick}>Créer des cartes (IA)</button>
          </>
        )}
      </div>
    </div>
  );
}

export default LibraryView;