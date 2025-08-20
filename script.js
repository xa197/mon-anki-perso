document.addEventListener('DOMContentLoaded', () => {
    // --- VUES & NAVIGATION ---
    const homeView = document.getElementById('home-view');
    const reviewView = document.getElementById('review-view');
    const manageView = document.getElementById('manage-view');
    const libraryView = document.getElementById('library-view');
    const quizView = document.getElementById('quiz-view');
    const goToReviewBtn = document.getElementById('go-to-review-btn');
    const goToManageBtn = document.getElementById('go-to-manage-btn');
    const goToLibraryBtn = document.getElementById('go-to-library-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const backToHomeFromManageBtn = document.getElementById('back-to-home-from-manage-btn');
    const backToHomeFromLibraryBtn = document.getElementById('back-to-home-from-library-btn');
    const backToLibraryBtn = document.getElementById('back-to-library-btn');

    // --- ÉLÉMENTS UI ---
    const cardContainer = document.getElementById('card-container');
    const rectoText = document.getElementById('recto-text');
    const versoText = document.getElementById('verso-text');
    const itemInput = document.getElementById('item-input');
    const itemList = document.getElementById('item-options');
    const rectoImage = document.getElementById('recto-image');
    const versoImage = document.getElementById('verso-image');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const difficultyButtons = document.getElementById('difficulty-buttons');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const addCardForm = document.getElementById('add-card-form');
    const editCardBtn = document.getElementById('edit-card-btn');
    const deleteCardBtn = document.getElementById('delete-card-btn');
    const editModal = document.getElementById('edit-modal');
    const editCardForm = document.getElementById('edit-card-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const newRectoTextarea = document.getElementById('new-recto');
    const newVersoTextarea = document.getElementById('new-verso');
    const rectoPreview = document.getElementById('recto-preview-container');
    const versoPreview = document.getElementById('verso-preview-container');
    const workshopItemSelector = document.getElementById('workshop-item-selector');
    const workshopTextarea = document.getElementById('workshop-textarea');
    const workshopSaveBtn = document.getElementById('workshop-save-btn');
    const libraryItemSelector = document.getElementById('library-item-selector');
    const libraryContentDisplay = document.getElementById('library-content-display');
    const generateQuizBtn = document.getElementById('generate-quiz-btn');
    const quizTitle = document.getElementById('quiz-title');
    const quizContainer = document.getElementById('quiz-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    // --- DONNÉES ---
    let allCards = [], itemsData = {}, currentCard = null, currentItem = '';
    let pastedRectoImageFile = null, pastedVersoImageFile = null;

    // --- NAVIGATION ---
    function showView(viewToShow) { homeView.classList.add('hidden'); reviewView.classList.add('hidden'); manageView.classList.add('hidden'); libraryView.classList.add('hidden'); quizView.classList.add('hidden'); viewToShow.classList.remove('hidden'); }
    goToReviewBtn.addEventListener('click', () => showView(reviewView));
    goToManageBtn.addEventListener('click', () => showView(manageView));
    goToLibraryBtn.addEventListener('click', () => showView(libraryView));
    backToHomeBtn.addEventListener('click', () => showView(homeView));
    backToHomeFromManageBtn.addEventListener('click', () => showView(homeView));
    backToHomeFromLibraryBtn.addEventListener('click', () => showView(homeView));
    backToLibraryBtn.addEventListener('click', () => showView(libraryView));

    // --- FONCTIONS API ---
    async function loadAllData() {
        try {
            // Étape 1 : Charger les cartes (essentiel)
            const cardsRes = await fetch('/api/cards');
            if (!cardsRes.ok) throw new Error('Erreur réseau lors du chargement des cartes');
            allCards = await cardsRes.json();

            // Étape 2 : Charger les données des items (secondaire)
            const itemsDataRes = await fetch('/api/items-data');
            if (itemsDataRes.ok) {
                itemsData = await itemsDataRes.json();
            } else {
                console.warn("Le chargement des données de l'atelier a échoué, mais l'application continue.");
            }
            
            // Étape 3 : Mettre à jour l'interface avec les données chargées
            populateItems();
            showNextCard();
        } catch (e) {
            console.error("Erreur critique de chargement :", e);
            rectoText.textContent = "Erreur de chargement des données essentielles.";
        }
    }
    
    async function saveAllCards() { try { await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allCards) }); } catch (e) { console.error("Err sauve:", e); } }
    async function uploadImage(file) { if (!file) return null; const formData = new FormData(); formData.append('image', file); try { const r = await fetch('/api/upload', { method: 'POST', body: formData }); if (!r.ok) throw new Error('Échec upload'); return (await r.json()).filePath; } catch (e) { console.error("Err upload:", e); return null; } }
    async function saveItemData(item, text) { try { await fetch('/api/items-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item, text }) }); itemsData[item] = text; alert('Texte enregistré !'); } catch (e) { console.error("Err sauve item:", e); alert('Échec sauvegarde.'); } }
    
    // --- LOGIQUE APP ---
    function populateItems() {
        itemList.innerHTML = ''; workshopItemSelector.innerHTML = '<option value="">-- Choisir un item --</option>'; libraryItemSelector.innerHTML = '<option value="">-- Choisir un item --</option>';
        const itemNames = new Set(allCards.map(c => c.deck).filter(Boolean));
        const sortedItems = Array.from(itemNames).sort((a, b) => {
            const numA = parseInt(a.split(':')[0], 10) || 0;
            const numB = parseInt(b.split(':')[0], 10) || 0;
            return numA - numB;
        });
        sortedItems.forEach(item => {
            const opt1 = document.createElement('option'); opt1.value = item; itemList.appendChild(opt1);
            const opt2 = document.createElement('option'); opt2.value = item; opt2.textContent = item; workshopItemSelector.appendChild(opt2);
            const opt3 = document.createElement('option'); opt3.value = item; opt3.textContent = item; libraryItemSelector.appendChild(opt3);
        });
    }

    // Le reste du code est inchangé
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
    workshopItemSelector.addEventListener('change', () => { const selectedItem = workshopItemSelector.value; if (selectedItem) { workshopTextarea.value = itemsData[selectedItem] || ''; } else { workshopTextarea.value = ''; } });
    workshopSaveBtn.addEventListener('click', () => { const selectedItem = workshopItemSelector.value; const text = workshopTextarea.value; if (!selectedItem) { alert('Veuillez d\'abord choisir un item.'); return; } saveItemData(selectedItem, text); });
    libraryItemSelector.addEventListener('change', () => { const selectedItem = libraryItemSelector.value; if (selectedItem && itemsData[selectedItem]) { libraryContentDisplay.textContent = itemsData[selectedItem]; generateQuizBtn.disabled = false; } else if (selectedItem) { libraryContentDisplay.innerHTML = `<p class="placeholder-text">Aucune note n'a été enregistrée pour cet item.</p>`; generateQuizBtn.disabled = true; } else { libraryContentDisplay.innerHTML = `<p class="placeholder-text">Veuillez sélectionner un item pour afficher son contenu.</p>`; generateQuizBtn.disabled = true; } });
    generateQuizBtn.addEventListener('click', async () => { const selectedItem = libraryItemSelector.value; const text = itemsData[selectedItem]; if (!text) { alert("Le texte de cet item est vide."); return; } showView(quizView); quizTitle.textContent = `Quiz pour : ${selectedItem}`; quizContainer.innerHTML = ''; loadingSpinner.classList.remove('hidden'); try { const response = await fetch('/api/generate-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); if (!response.ok) throw new Error("Erreur du serveur lors de la génération."); const data = await response.json(); displayQuiz(data.questions); } catch (error) { quizContainer.innerHTML = `<p>Impossible de générer le quiz. Réessayez plus tard.</p>`; console.error(error); } finally { loadingSpinner.classList.add('hidden'); } });
    function displayQuiz(questions) { quizContainer.innerHTML = ''; questions.forEach((q, index) => { const questionEl = document.createElement('div'); questionEl.className = 'quiz-question'; let optionsHTML = ''; if (q.type === 'QCM') { optionsHTML = `<div class="qcm-options">${q.options.map(opt => `<button>${opt}</button>`).join('')}</div>`; } questionEl.innerHTML = `<p><strong>${index + 1}. (${q.type})</strong> ${q.question}</p>${optionsHTML}`; if (q.type === 'QCM') { questionEl.querySelectorAll('.qcm-options button').forEach(btn => { btn.addEventListener('click', () => { questionEl.querySelectorAll('.qcm-options button').forEach(b => { if (b.textContent === q.answer) b.classList.add('correct'); else b.classList.add('incorrect'); }); }, { once: true }); }); } else { const answerDiv = document.createElement('div'); answerDiv.className = 'qru-answer'; answerDiv.innerHTML = `<strong>Réponse :</strong> ${q.answer}`; questionEl.appendChild(answerDiv); } quizContainer.appendChild(questionEl); }); }

    // --- DÉMARRAGE ---
    loadAllData();
    showView(homeView);
});