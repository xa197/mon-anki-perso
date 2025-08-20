document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.getElementById('card-container');
    const rectoText = document.getElementById('recto-text');
    const versoText = document.getElementById('verso-text');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const difficultyButtons = document.getElementById('difficulty-buttons');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');

    let allCards = [];
    let currentCard = null;

    async function loadCards() {
        const savedProgress = localStorage.getItem('ankiPersoProgress');
        if (savedProgress) {
            allCards = JSON.parse(savedProgress);
        } else {
            const response = await fetch('cartes.json');
            allCards = await response.json();
        }
        showNextCard();
    }

    function showNextCard() {
        const now = new Date();
        const dueCards = allCards.filter(card => new Date(card.nextReview) <= now);

        if (dueCards.length > 0) {
            currentCard = dueCards[Math.floor(Math.random() * dueCards.length)];
            rectoText.textContent = currentCard.recto;
            versoText.textContent = currentCard.verso;
            cardContainer.classList.remove('is-flipped');
            showAnswerBtn.classList.remove('hidden');
            difficultyButtons.classList.add('hidden');
        } else {
            rectoText.textContent = "🎉 Bravo ! Aucune carte à réviser pour le moment.";
            versoText.textContent = "";
            showAnswerBtn.classList.add('hidden');
            difficultyButtons.classList.add('hidden');
        }
    }

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

    loadCards();
});