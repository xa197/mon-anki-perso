import React, { useState, useEffect } from 'react';

function ReviewView({ navigateTo, allCards, onUpdateCards }) {
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentItem, setCurrentItem] = useState('');

  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));

  useEffect(() => {
    const now = new Date();
    // On s'assure que allCards est bien un tableau avant de filtrer
    const cardsToFilter = Array.isArray(allCards) ? allCards : [];
    const cardsInScope = currentItem ? cardsToFilter.filter(c => c.deck === currentItem) : cardsToFilter;
    const filteredDueCards = cardsInScope.filter(c => new Date(c.nextReview) <= now);
    
    setDueCards(filteredDueCards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [allCards, currentItem]);

  const currentCard = dueCards[currentCardIndex];

  const handleFlip = () => setIsFlipped(true);

  const handleDifficultyClick = (quality) => {
    if (!currentCard) return;

    let newInterval = currentCard.interval;
    let newEaseFactor = currentCard.easeFactor;

    if (quality < 3) {
      newInterval = 1;
    } else {
      newInterval = (newInterval === 1) ? 6 : Math.round(newInterval * newEaseFactor);
      newEaseFactor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newEaseFactor < 1.3) newEaseFactor = 1.3;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    const updatedCard = { ...currentCard, interval: newInterval, easeFactor: newEaseFactor, nextReview: nextReviewDate.toISOString() };

    onUpdateCards(updatedCard);

    // On passe à la carte suivante
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      // Si c'était la dernière carte, on force un "recalcul" en vidant la liste temporairement
      setDueCards([]);
    }
  };

  return (
    <div id="review-view">
      <div className="review-header">
        <button onClick={() => navigateTo('home')}>← Accueil</button>
        <div id="item-selector-container">
          <label htmlFor="item-input">Filtrer par Item :</label>
          <select value={currentItem} onChange={(e) => setCurrentItem(e.target.value)}>
            <option value="">-- Tous les items --</option>
            {sortedItems.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {currentCard ? (
        <div id="app">
          <div id="card-container" className={`card ${isFlipped ? 'is-flipped' : ''}`}>
            <div className="card-face card-front" onClick={handleFlip}>
              <p>{currentCard.recto}</p>
            </div>
            <div className="card-face card-back">
              <p>{currentCard.verso}</p>
            </div>
          </div>
          <div id="controls">
            {!isFlipped ? (
              <button id="show-answer-btn" onClick={handleFlip}>Voir la réponse</button>
            ) : (
              <div id="difficulty-buttons">
                <button className="difficulty-btn" onClick={() => handleDifficultyClick(1)}>À revoir</button>
                <button className="difficulty-btn" onClick={() => handleDifficultyClick(3)}>Difficile</button>
                <button className="difficulty-btn" onClick={() => handleDifficultyClick(4)}>Correct</button>
                <button className="difficulty-btn" onClick={() => handleDifficultyClick(5)}>Facile</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>🎉 Bravo !</h2>
          <p>Aucune carte à réviser pour le moment.</p>
        </div>
      )}
    </div>
  );
}

export default ReviewView;