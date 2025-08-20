document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const cardContainer = document.getElementById('card-container');
    const rectoText = document.getElementById('recto-text');
    const versoText = document.getElementById('verso-text');
    const rectoImage = document.getElementById('recto-image');
    const versoImage = document.getElementById('verso-image');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const difficultyButtons = document.getElementById('difficulty-buttons');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const deckSelector = document.getElementById('deck-selector');
    const toggleFormBtn = document.getElementById('toggle-form-btn');
    const addCardForm = document.getElementById('add-card-form');
    const editCardBtn = document.getElementById('edit-card-btn');
    const deleteCardBtn = document.getElementById('delete-card-btn');
    const editModal = document.getElementById('edit-modal');
    const editCardForm = document.getElementById('edit-card-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // App Data
    let allCards = [];
    let currentCard = null;
    let currentDeck = 'all';

    // API Functions
    async function loadCards() {
        try {
            const response = await fetch('/api/cards');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            allCards = await response.json();
            populateDecks();
            showNextCard();
        } catch (error) {
            console.error("Impossible de charger les cartes:", error);
            rectoText.textContent = "Erreur: Impossible de charger les cartes.";
        }
    }

    async function saveAllCards() {
        try {
            await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allCards),
            });
        } catch (error) { console.error("Erreur de sauvegarde générale:", error); }
    }

    // App Logic
    function populateDecks() {
        const selectedDeck = deckSelector.value;
        deckSelector.innerHTML = '<option value="all">Tous les paquets</option>';
        const deckPaths = new Set();
        allCards.forEach(card => {
            if (card.deck) {
                const parts = card.deck.split('::');
                let currentPath = '';
                for (const part of parts) {
                    currentPath = currentPath ? `${currentPath}::${part}` : part;
                    deckPaths.add(currentPath);
                }
            }
        });
        const sortedDecks = Array.from(deckPaths).sort();
        sortedDecks.forEach(deck => {
            const indent = '· '.repeat(deck.split('::').length - 1);
            const option = document.createElement('option');
            option.value = deck;
            option.textContent = indent + deck.split('::').pop();
            deckSelector.appendChild(option);
        });
        deckSelector.value = selectedDeck;
    }

    function showNextCard() {
        const now = new Date();
        let cardsInScope = allCards;
        if (currentDeck !== 'all') {
            cardsInScope = allCards.filter(card => card.deck && card.deck.startsWith(currentDeck));
        }
        const dueCards = cardsInScope.filter(card => new Date(card.nextReview) <= now);
        if (dueCards.length > 0) {
            currentCard = dueCards[Math.floor(Math.random() * dueCards.length)];
            rectoText.textContent = currentCard.recto;
            versoText.textContent = currentCard.verso;
            rectoImage.style.display = currentCard.rectoImage ? 'block' : 'none';
            rectoImage.src = currentCard.rectoImage || '';
            versoImage.style.display = currentCard.versoImage ? 'block' : 'none';
            versoImage.src = currentCard.versoImage || '';
            cardContainer.classList.remove('is-flipped');
            showAnswerBtn.classList.remove('hidden');
            difficultyButtons.classList.add('hidden');
        } else {
            currentCard = null;
            rectoText.textContent = "🎉 Bravo ! Aucune carte à réviser dans ce paquet.";
            versoText.textContent = "";
            rectoImage.style.display = 'none';
            versoImage.style.display = 'none';
            showAnswerBtn.classList.add('hidden');
            difficultyButtons.classList.add('hidden');
        }
    }

    function updateCard(quality) {
        if (!currentCard) return;
        if (quality < 3) {
            currentCard.interval = 1;
        } else {
            currentCard.interval = (currentCard.interval === 1) ? 6 : Math.round(currentCard.interval * currentCard.easeFactor);
        }
        currentCard.easeFactor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (currentCard.easeFactor < 1.3) currentCard.easeFactor = 1.3;
        const now = new Date();
        now.setDate(now.getDate() + currentCard.interval);
        currentCard.nextReview = now.toISOString();
        saveAllCards();
    }

    // Event Listeners
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

    deckSelector.addEventListener('change', (e) => {
        currentDeck = e.target.value;
        showNextCard();
    });

    toggleFormBtn.addEventListener('click', () => { addCardForm.classList.toggle('hidden'); });

    addCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCard = {
            id: Date.now(), deck: document.getElementById('new-deck').value.trim(), recto: document.getElementById('new-recto').value.trim(), verso: document.getElementById('new-verso').value.trim(), rectoImage: null, versoImage: null, interval: 1, easeFactor: 2.5, nextReview: new Date().toISOString()
        };
        allCards.push(newCard);
        saveAllCards();
        populateDecks();
        addCardForm.reset();
        addCardForm.classList.add('hidden');
        alert('Carte ajoutée avec succès !');
        showNextCard();
    });

    function openEditModal() {
        if (!currentCard) return;
        document.getElementById('edit-deck').value = currentCard.deck;
        document.getElementById('edit-recto').value = currentCard.recto;
        document.getElementById('edit-verso').value = currentCard.verso;
        editModal.classList.remove('hidden');
    }

    function closeEditModal() { editModal.classList.add('hidden'); }

    editCardBtn.addEventListener('click', openEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    editCardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentCard) return;
        const updatedData = { deck: document.getElementById('edit-deck').value, recto: document.getElementById('edit-recto').value, verso: document.getElementById('edit-verso').value, };
        try {
            const response = await fetch(`/api/cards/${currentCard.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData), });
            const updatedCardFromServer = await response.json();
            const cardIndex = allCards.findIndex(c => c.id === currentCard.id);
            if (cardIndex > -1) { allCards[cardIndex] = updatedCardFromServer; }
            currentCard = updatedCardFromServer;
            rectoText.textContent = currentCard.recto;
            versoText.textContent = currentCard.verso;
            closeEditModal();
            populateDecks();
        } catch (error) {
            console.error("Erreur de modification:", error);
            alert("La modification a échoué.");
        }
    });

    deleteCardBtn.addEventListener('click', async () => {
        if (!currentCard) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) {
            try {
                await fetch(`/api/cards/${currentCard.id}`, { method: 'DELETE' });
                allCards = allCards.filter(c => c.id !== currentCard.id);
                populateDecks();
                showNextCard();
            } catch (error) {
                console.error("Erreur de suppression:", error);
                alert("La suppression a échoué.");
            }
        }
    });

    // Startup
    loadCards();
});