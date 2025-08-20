document.addEventListener('DOMContentLoaded', () => {
    // --- VUES & NAVIGATION ---
    const homeView = document.getElementById('home-view');
    const reviewView = document.getElementById('review-view');
    const manageView = document.getElementById('manage-view');
    const goToReviewBtn = document.getElementById('go-to-review-btn');
    const goToManageBtn = document.getElementById('go-to-manage-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const backToHomeFromManageBtn = document.getElementById('back-to-home-from-manage-btn');

    // --- ÉLÉMENTS UI ---
    const itemInput = document.getElementById('item-input');
    const itemList = document.getElementById('item-options');
    const addCardForm = document.getElementById('add-card-form');
    // ... et tous les autres
    
    // NOUVEAUX ÉLÉMENTS DE L'ATELIER
    const workshopItemSelector = document.getElementById('workshop-item-selector');
    const workshopTextarea = document.getElementById('workshop-textarea');
    const workshopSaveBtn = document.getElementById('workshop-save-btn');

    // --- DONNÉES ---
    let allCards = [], currentCard = null, currentItem = '';
    let pastedRectoImageFile = null, pastedVersoImageFile = null;
    let itemsData = {}; // Pour stocker les textes des items

    // --- NAVIGATION ---
    function showView(viewToShow) { homeView.classList.add('hidden'); reviewView.classList.add('hidden'); manageView.classList.add('hidden'); viewToShow.classList.remove('hidden'); }
    goToReviewBtn.addEventListener('click', () => showView(reviewView));
    goToManageBtn.addEventListener('click', () => showView(manageView));
    backToHomeBtn.addEventListener('click', () => showView(homeView));
    backToHomeFromManageBtn.addEventListener('click', () => showView(homeView));

    // --- FONCTIONS API ---
    async function loadAllData() {
        try {
            const [cardsRes, itemsDataRes] = await Promise.all([
                fetch('/api/cards'),
                fetch('/api/items-data') // On charge les deux en parallèle
            ]);
            if (!cardsRes.ok || !itemsDataRes.ok) throw new Error('Erreur de réseau');
            
            allCards = await cardsRes.json();
            itemsData = await itemsDataRes.json();
            
            populateItems();
            showNextCard();
        } catch (e) {
            console.error("Erreur de chargement des données:", e);
            // Gérer l'erreur d'affichage
        }
    }
    
    async function saveAllCards() { /* ... inchangé ... */ }
    async function uploadImage(file) { /* ... inchangé ... */ }

    // NOUVELLE FONCTION API pour sauvegarder les données d'un item
    async function saveItemData(item, text) {
        try {
            await fetch('/api/items-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item, text }),
            });
            itemsData[item] = text; // Mettre à jour notre copie locale
            alert('Texte de l\'item enregistré !');
        } catch (e) {
            console.error("Erreur de sauvegarde des données de l'item:", e);
            alert('La sauvegarde a échoué.');
        }
    }
    
    // --- LOGIQUE APP ---
    function populateItems() {
        itemList.innerHTML = ''; // Pour la saisie intelligente
        workshopItemSelector.innerHTML = '<option value="">-- Choisir un item --</option>'; // Pour le menu déroulant
        
        const itemNames = new Set(allCards.map(c => c.deck).filter(Boolean));
        const sortedItems = Array.from(itemNames).sort((a, b) => parseInt(a.split(':')[0],10) - parseInt(b.split(':')[0],10));
        
        sortedItems.forEach(item => {
            // Pour la saisie intelligente
            const option1 = document.createElement('option');
            option1.value = item;
            itemList.appendChild(option1);

            // Pour le menu déroulant
            const option2 = document.createElement('option');
            option2.value = item;
            option2.textContent = item;
            workshopItemSelector.appendChild(option2);
        });
    }

    // Le reste des fonctions (showNextCard, updateCard, handlePaste, etc.) est identique
    // Pour être sûr, voici le fichier complet
    const cardContainer = document.getElementById('card-container');
    const rectoText = document.getElementById('recto-text'), versoText = document.getElementById('verso-text');
    const rectoImage = document.getElementById('recto-image'), versoImage = document.getElementById('verso-image');
    const showAnswerBtn = document.getElementById('show-answer-btn'), difficultyButtons = document.getElementById('difficulty-buttons');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const editCardBtn = document.getElementById('edit-card-btn'), deleteCardBtn = document.getElementById('delete-card-btn');
    const editModal = document.getElementById('edit-modal'), editCardForm = document.getElementById('edit-card-form'), cancelEditBtn = document.getElementById('cancel-edit-btn');
    const newRectoTextarea = document.getElementById('new-recto'), newVersoTextarea = document.getElementById('new-verso');
    const rectoPreview = document.getElementById('recto-preview-container'), versoPreview = document.getElementById('verso-preview-container');

    async function saveAllCards() { try { await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allCards), }); } catch (e) { console.error("Err sauve:", e); } }
    async function uploadImage(file) { if (!file) return null; const formData = new FormData(); formData.append('image', file); try { const response = await fetch('/api/upload', { method: 'POST', body: formData }); if (!response.ok) throw new Error('Échec du téléversement'); const result = await response.json(); return result.filePath; } catch (error) { console.error("Erreur d'upload:", error); alert("Erreur lors du téléversement de l'image."); return null; } }
    function showNextCard() { const now = new Date(); let cardsInScope = allCards; const validItems = Array.from(itemList.options).map(o => o.value); if (currentItem && validItems.includes(currentItem)) { cardsInScope = allCards.filter(c => c.deck === currentItem); } const dueCards = cardsInScope.filter(c => new Date(c.nextReview) <= now); if (dueCards.length > 0) { currentCard = dueCards[Math.floor(Math.random() * dueCards.length)]; rectoText.textContent = currentCard.recto; versoText.textContent = currentCard.verso; rectoImage.style.display = currentCard.rectoImage ? 'block' : 'none'; rectoImage.src = currentCard.rectoImage || ''; versoImage.style.display = currentCard.versoImage ? 'block' : 'none'; versoImage.src = currentCard.versoImage || ''; cardContainer.classList.remove('is-flipped'); showAnswerBtn.classList.remove('hidden'); difficultyButtons.classList.add('hidden'); } else { currentCard = null; rectoText.textContent = "🎉 Bravo ! Aucune carte à réviser."; versoText.textContent = ""; rectoImage.style.display = 'none'; versoImage.style.display = 'none'; showAnswerBtn.classList.add('hidden'); difficultyButtons.add('hidden'); } }
    function updateCard(q) { if (!currentCard) return; if (q < 3) currentCard.interval = 1; else currentCard.interval = (currentCard.interval === 1) ? 6 : Math.round(currentCard.interval * currentCard.easeFactor); currentCard.easeFactor += (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)); if (currentCard.easeFactor < 1.3) currentCard.easeFactor = 1.3; const now = new Date(); now.setDate(now.getDate() + currentCard.interval); currentCard.nextReview = now.toISOString(); saveAllCards(); }
    function handlePaste(event, previewContainer, fileStore) { const items = (event.clipboardData || event.originalEvent.clipboardData).items; for (const item of items) { if (item.type.indexOf('image') === 0) { event.preventDefault(); const file = item.getAsFile(); if (fileStore === 'recto') pastedRectoImageFile = file; if (fileStore === 'verso') pastedVersoImageFile = file; const reader = new FileReader(); reader.onload = (e) => { previewContainer.innerHTML = `<img src="${e.target.result}" alt="Aperçu"/>`; }; reader.readAsDataURL(file); return; } } }

    // --- ÉVÉNEMENTS ---
    itemInput.addEventListener('input', (e) => { currentItem = e.target.value; showNextCard(); });
    showAnswerBtn.addEventListener('click', () => { cardContainer.classList.add('is-flipped'); showAnswerBtn.classList.add('hidden'); difficultyButtons.classList.remove('hidden'); });
    difficultyBtns.forEach(b => { b.addEventListener('click', (e) => { const q = parseInt(e.target.dataset.quality, 10); updateCard(q); showNextCard(); }); });
    addCardForm.addEventListener('submit', async (e) => { e.preventDefault(); const rectoImagePath = await uploadImage(pastedRectoImageFile); const versoImagePath = await uploadImage(pastedVersoImageFile); const newCard = { id: Date.now(), deck: document.getElementById('new-item').value.trim(), recto: newRectoTextarea.value.trim(), verso: newVersoTextarea.value.trim(), rectoImage: rectoImagePath, versoImage: versoImagePath, interval: 1, easeFactor: 2.5, nextReview: new Date().toISOString() }; allCards.push(newCard); await saveAllCards(); populateItems(); addCardForm.reset(); rectoPreview.innerHTML = ''; versoPreview.innerHTML = ''; pastedRectoImageFile = null; pastedVersoImageFile = null; alert('Carte ajoutée avec succès !'); });
    function openEditModal() { if (!currentCard) return; document.getElementById('edit-item').value = currentCard.deck; document.getElementById('edit-recto').value = currentCard.recto; document.getElementById('edit-verso').value = currentCard.verso; editModal.classList.remove('hidden'); }
    function closeEditModal() { editModal.classList.add('hidden'); }
    editCardBtn.addEventListener('click', openEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editCardForm.addEventListener('submit', async (e) => { e.preventDefault(); if (!currentCard) return; const updatedData = { deck: document.getElementById('edit-item').value, recto: document.getElementById('edit-recto').value, verso: document.getElementById('edit-verso').value, }; try { const r = await fetch(`/api/cards/${currentCard.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData), }); const updatedCard = await r.json(); const i = allCards.findIndex(c => c.id === currentCard.id); if (i > -1) allCards[i] = updatedCard; currentCard = updatedCard; rectoText.textContent = currentCard.recto; versoText.textContent = currentCard.verso; closeEditModal(); populateItems(); } catch (err) { console.error("Err modif:", err); alert("Échec modif."); } });
    deleteCardBtn.addEventListener('click', async () => { if (!currentCard) return; if (confirm("Supprimer cette carte ?")) { try { await fetch(`/api/cards/${currentCard.id}`, { method: 'DELETE' }); allCards = allCards.filter(c => c.id !== currentCard.id); populateItems(); showNextCard(); } catch (err) { console.error("Err suppr:", err); alert("Échec suppr."); } } });
    newRectoTextarea.addEventListener('paste', (e) => handlePaste(e, rectoPreview, 'recto'));
    newVersoTextarea.addEventListener('paste', (e) => handlePaste(e, versoPreview, 'verso'));

    // NOUVEAUX ÉVÉNEMENTS POUR L'ATELIER
    workshopItemSelector.addEventListener('change', () => {
        const selectedItem = workshopItemSelector.value;
        if (selectedItem) {
            workshopTextarea.value = itemsData[selectedItem] || '';
        } else {
            workshopTextarea.value = '';
        }
    });

    workshopSaveBtn.addEventListener('click', () => {
        const selectedItem = workshopItemSelector.value;
        const text = workshopTextarea.value;
        if (!selectedItem) {
            alert('Veuillez d\'abord choisir un item.');
            return;
        }
        saveItemData(selectedItem, text);
    });

    // --- DÉMARRAGE ---
    loadAllData();
    showView(homeView);
});