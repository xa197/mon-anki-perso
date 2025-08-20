document.addEventListener('DOMContentLoaded', () => {
    // Éléments UI
    const cardContainer = document.getElementById('card-container');
    const rectoText = document.getElementById('recto-text');
    const versoText = document.getElementById('verso-text');
    const rectoImage = document.getElementById('recto-image');
    const versoImage = document.getElementById('verso-image');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const difficultyButtons = document.getElementById('difficulty-buttons');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const deckSelector = document.getElementById('deck-selector'); // NOUVEAU

    // Données de l'application
    let allCards = [];
    let currentCard = null;
    let currentDeck = 'all'; // NOUVEAU

    // --- FONCTIONS ---

    async function loadCards() {
        const savedProgress = localStorage.getItem('ankiPersoProgress');
        if (savedProgress) {
            allCards = JSON.parse(savedProgress);
        } else {
            const response = await fetch('cartes.json');
            allCards = await response.json();
        }
        populateDecks(); // NOUVEAU
        showNextCard();
    }
    
    // NOUVELLE FONCTION pour remplir le menu des paquets
    function populateDecks() {
        const decks = [...new Set(allCards.map(card => card.deck))];
        decks.forEach(deck => {
            if (deck) {
                const option = document.createElement('option');
                option.value = deck;
                option.textContent = deck;
                deckSelector.appendChild(option);
            }
        });
    }

    // MODIFICATION MAJEURE de cette fonction
    function showNextCard() {
        const now = new Date();
        
        let cardsInScope = allCards;
        if (currentDeck !== 'all') {
            cardsInScope = allCards.filter(card => card.deck === currentDeck);
        }

        const dueCards = cardsInScope.filter(card => new Date(card.nextReview) <= now);

        if (dueCards.length > 0) {
            currentCard = dueCards[Math.floor(Math.random() * dueCards.length)];
            
            rectoText.textContent = currentCard.recto;
            versoText.textContent = currentCard.verso;

            if (currentCard.rectoImage) {
                rectoImage.src = currentCard.rectoImage;
                rectoImage.style.display = 'block';
            } else {
                rectoImage.style.display = 'none';
            }

            if (currentCard.versoImage) {
                versoImage.src = currentCard.versoImage;
                versoImage.style.display = 'block';
            } else {
                versoImage.style.display = 'none';
            }

            cardContainer.classList.remove('is-flipped');
            showAnswerBtn.classList.remove('hidden');
            difficultyButtons.classList.add('hidden');
        } else {
            rectoText.textContent = "🎉 Bravo ! Aucune carte à réviser dans ce paquet.";
            versoText.textContent = "";
            rectoImage.style.display = 'none';
            versoImage.style.display = 'none';
            showAnswerBtn.classList.add('hidden');
            difficultyButtons.classList.add('hidden');
        }
    }

    function updateCard(quality) {
        if (quality < 3) {
            currentCard.interval = 1;
        } else {
            if (currentCard.interval === 1) {
                currentCard.interval = 6;
            } else {
                currentCard.interval = Math.round(currentCard.interval * currentCard.easeFactor);
            }
        }
        
        currentCard.easeFactor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (currentCard.easeFactor < 1.3) currentCard.easeFactor = 1.3;

        const now = new Date();
        now.setDate(now.getDate() + currentCard.interval);
        currentCard.nextReview = now.toISOString();

        saveProgress();
    }

    function saveProgress() {
        localStorage.setItem('ankiPersoProgress', JSON.stringify(allCards));
    }

    // --- ÉVÉNEMENTS ---

    showAnswerBtn.addEventListener('click', () => {
        cardContainer.classList.add('is-flipped');
        showAnswerBtn.classList.add('hidden');
        difficultyButtons.classList.remove('hidden');
    });

    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const quality = parseInt(e.target.dataset.quality, 10);
            updateCard(quality);
            showNextCard();
        });
    });
    
    // NOUVEAU : Gérer le changement de paquet
    deckSelector.addEventListener('change', (e) => {
        currentDeck = e.target.value;
        showNextCard();
    });

    // --- DÉMARRAGE ---
    loadCards();
});