import React, { useState } from 'react';

// ON REÇOIT DE NOUVELLES PROPS : onSetQuiz et onSetLoading
function LibraryView({ navigateTo, allCards, itemsData, onSetQuiz, onSetLoading }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [numQCM, setNumQCM] = useState(3);
  const [numQRU, setNumQRU] = useState(2);

  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));
  sortedItems.unshift("500: Divers");

  const handleGenerateQuiz = async () => {
    if (!selectedItem || !itemsData[selectedItem]) return;
    
    onSetLoading(true); // On dit à App.js d'afficher un spinner
    navigateTo('quiz'); // On navigue vers la page de quiz immédiatement

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: itemsData[selectedItem],
          numQCM,
          numQRU 
        })
      });

      if (!response.ok) throw new Error('Erreur de l\'API');
      
      const quizData = await response.json();
      onSetQuiz(quizData.questions); // On envoie les questions à App.js
      
    } catch (error) {
      console.error("Erreur lors de la génération du quiz:", error);
      onSetQuiz([]); // En cas d'erreur, on envoie un quiz vide
    } finally {
      onSetLoading(false); // On dit à App.js de cacher le spinner
    }
  };

  return (
    <div id="library-view">
        {/* ... (le header et le content display ne changent pas) ... */}
        <div className="library-header">
            <button onClick={() => navigateTo('home')}>← Accueil</button>
            <div className="library-selector-container">
              <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                <option value="">-- Choisir un item --</option>
                {sortedItems.map(item => (<option key={item} value={item}>{item}</option>))}
              </select>
            </div>
        </div>
        <div id="library-content-display">
            {selectedItem ? (<p>{itemsData[selectedItem] || 'Aucune note.'}</p>) : (<p>Veuillez sélectionner un item.</p>)}
        </div>
      
      {selectedItem && itemsData[selectedItem] && (
        <div className="generation-options" style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
          <label>QCM : <input type="number" min="0" value={numQCM} onChange={e => setNumQCM(parseInt(e.target.value))} style={{width: '60px'}} /></label>
          <label>QRU : <input type="number" min="0" value={numQRU} onChange={e => setNumQRU(parseInt(e.target.value))} style={{width: '60px'}} /></label>
        </div>
      )}

      <div id="library-actions-container">
        {selectedItem && itemsData[selectedItem] && (
          <>
            <button className="ia-btn" onClick={handleGenerateQuiz}>S'entraîner (Quiz IA)</button>
            <button className="ia-btn success">Créer des cartes (IA)</button>
          </>
        )}
      </div>
    </div>
  );
}

export default LibraryView;