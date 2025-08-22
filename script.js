document.addEventListener('DOMContentLoaded', () => {
    // Les déclarations de variables en haut sont identiques
    const homeView = document.getElementById('home-view'), reviewView = document.getElementById('review-view'), manageView = document.getElementById('manage-view'), libraryView = document.getElementById('library-view'), quizView = document.getElementById('quiz-view'), quizResultsView = document.getElementById('quiz-results-view');
    const goToReviewBtn = document.getElementById('go-to-review-btn'), goToManageBtn = document.getElementById('go-to-manage-btn'), goToLibraryBtn = document.getElementById('go-to-library-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn'), backToHomeFromManageBtn = document.getElementById('back-to-home-from-manage-btn'), backToHomeFromLibraryBtn = document.getElementById('back-to-home-from-library-btn');
    const backToLibraryBtn = document.getElementById('back-to-library-btn'), backToLibraryFromResultsBtn = document.getElementById('back-to-library-from-results-btn');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const cardContainer = document.getElementById('card-container');
    const rectoText = document.getElementById('recto-text'), versoText = document.getElementById('verso-text');
    const rectoImage = document.getElementById('recto-image'), versoImage = document.getElementById('verso-image');
    const showAnswerBtn = document.getElementById('show-answer-btn'), difficultyButtons = document.getElementById('difficulty-buttons');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const itemInput = document.getElementById('item-input'), itemList = document.getElementById('item-options');
    const editCardBtn = document.getElementById('edit-card-btn'), deleteCardBtn = document.getElementById('delete-card-btn');
    const addCardForm = document.getElementById('add-card-form');
    const newRectoTextarea = document.getElementById('new-recto'), newVersoTextarea = document.getElementById('new-verso');
    const rectoPreview = document.getElementById('recto-preview-container'), versoPreview = document.getElementById('verso-preview-container');
    const workshopItemSelector = document.getElementById('workshop-item-selector'), workshopTextarea = document.getElementById('workshop-textarea'), workshopSaveBtn = document.getElementById('workshop-save-btn');
    const libraryItemSelector = document.getElementById('library-item-selector');
    const libraryContentDisplay = document.getElementById('library-content-display');
    const quizTitle = document.getElementById('quiz-title'), quizProgressValue = document.getElementById('quiz-progress-value'), quizQuestionText = document.getElementById('quiz-question-text'), quizOptionsContainer = document.getElementById('quiz-options-container'), quizFeedback = document.getElementById('quiz-feedback'), loadingSpinner = document.getElementById('loading-spinner');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizContainer = document.getElementById('quiz-container');
    const finalScoreEl = document.getElementById('final-score');
    const editModal = document.getElementById('edit-modal'), editCardForm = document.getElementById('edit-card-form'), cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // Données
    let allCards = [], itemsData = {}, currentCard = null, currentItem = '';
    let pastedRectoImageFile = null, pastedVersoImageFile = null;
    let quizQuestions = [], currentQuestionIndex = 0, score = 0;

    // Navigation
    function showView(viewId) { const views = { 'home-view': homeView, 'review-view': reviewView, 'manage-view': manageView, 'library-view': libraryView, 'quiz-view': quizView, 'quiz-results-view': quizResultsView }; Object.keys(views).forEach(id => { if (views[id]) { if (id === viewId) views[id].classList.remove('hidden'); else views[id].classList.add('hidden'); } }); }
    
    // Fonctions API
    async function loadAllData() { try { const [cardsRes, itemsDataRes] = await Promise.all([fetch('/api/cards'), fetch('/api/items-data')]); allCards = await cardsRes.json(); itemsData = await itemsDataRes.json(); populateItems(); } catch (e) { console.error("Erreur chargement:", e); } }
    async function saveAllCards() { try { await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allCards) }); } catch (e) { console.error("Err sauve:", e); } }
    async function uploadImage(file) { if (!file) return null; const formData = new FormData(); formData.append('image', file); try { const r = await fetch('/api/upload', { method: 'POST', body: formData }); if (!r.ok) throw new Error('Échec upload'); return (await r.json()).filePath; } catch (e) { return null; } }
    async function saveItemData(item, text) { try { await fetch('/api/items-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item, text }) }); itemsData[item] = text; alert('Texte enregistré !'); } catch (e) { alert('Échec sauvegarde.'); } }
    
    // Logique App
    function populateItems() { const itemSelectors = [itemList, workshopItemSelector, libraryItemSelector]; itemSelectors.forEach(sel => { if(sel) sel.innerHTML = ''; }); const itemNames = new Set(allCards.map(c => c.deck).filter(Boolean)); const sortedItems = Array.from(itemNames).sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10)); sortedItems.forEach(item => { itemSelectors.forEach((sel, i) => { if (sel) { const opt = document.createElement('option'); opt.value = item; if (i > 0) opt.textContent = item; sel.appendChild(opt); } }); }); [workshopItemSelector, libraryItemSelector].forEach(sel => { if(sel) sel.insertAdjacentHTML('afterbegin', '<option value="">-- Choisir un item --</option>'); }); }
    function showNextCard() { const now = new Date(); let cardsInScope = allCards; const validItems = Array.from(itemList.options).map(o => o.value); if (currentItem && validItems.includes(currentItem)) { cardsInScope = allCards.filter(c => c.deck === currentItem); } const dueCards = cardsInScope.filter(c => new Date(c.nextReview) <= now); if (dueCards.length > 0) { currentCard = dueCards[Math.floor(Math.random() * dueCards.length)]; rectoText.textContent = currentCard.recto; versoText.textContent = currentCard.verso; rectoImage.style.display = currentCard.rectoImage ? 'block' : 'none'; rectoImage.src = currentCard.rectoImage || ''; versoImage.style.display = currentCard.versoImage ? 'block' : 'none'; versoImage.src = currentCard.versoImage || ''; cardContainer.classList.remove('is-flipped'); showAnswerBtn.classList.remove('hidden'); difficultyButtons.classList.add('hidden'); } else { currentCard = null; rectoText.textContent = "🎉 Bravo ! Aucune carte à réviser."; versoText.textContent = ""; rectoImage.style.display = 'none'; versoImage.style.display = 'none'; showAnswerBtn.classList.add('hidden'); difficultyButtons.add('hidden'); } }
    function updateCard(q) { if (!currentCard) return; if (q < 3) currentCard.interval = 1; else currentCard.interval = (currentCard.interval === 1) ? 6 : Math.round(currentCard.interval * currentCard.easeFactor); currentCard.easeFactor += (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)); if (currentCard.easeFactor < 1.3) currentCard.easeFactor = 1.3; const now = new Date(); now.setDate(now.getDate() + currentCard.interval); currentCard.nextReview = now.toISOString(); saveAllCards(); }
    function handlePaste(event, previewContainer, fileStore) { const items = (event.clipboardData || event.originalEvent.clipboardData).items; for (const item of items) { if (item.type.indexOf('image') === 0) { event.preventDefault(); const file = item.getAsFile(); if (fileStore === 'recto') pastedRectoImageFile = file; if (fileStore === 'verso') pastedVersoImageFile = file; const reader = new FileReader(); reader.onload = (e) => { previewContainer.innerHTML = `<img src="${e.target.result}" alt="Aperçu"/>`; }; reader.readAsDataURL(file); return; } } }
    async function generateQuiz() { const selectedItem = libraryItemSelector.value; const text = itemsData[selectedItem]; if (!text) return; showView('quiz-view'); quizTitle.textContent = `Quiz pour : ${selectedItem}`; quizContainer.style.display = 'none'; loadingSpinner.classList.remove('hidden'); try { const response = await fetch('/api/generate-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); if (!response.ok) throw new Error("Erreur du serveur."); const data = await response.json(); startQuiz(data.questions); } catch (error) { quizContainer.innerHTML = `<p>Impossible de générer le quiz. Réessayez plus tard.</p>`; } finally { loadingSpinner.classList.add('hidden'); quizContainer.style.display = 'block'; } }
    async function generateCards(event) { const selectedItem = libraryItemSelector.value; const text = itemsData[selectedItem]; if (!text) return; const btn = event.target; btn.textContent = 'Génération en cours...'; btn.disabled = true; try { const response = await fetch('/api/generate-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, item: selectedItem }), }); if (!response.ok) throw new Error("Erreur du serveur."); const result = await response.json(); alert(result.message); await loadAllData(); } catch (error) { console.error(error); alert("Impossible de générer les cartes."); } finally { btn.textContent = 'Créer des cartes (IA)'; btn.disabled = false; } }
    function startQuiz(questions) { quizQuestions = questions; currentQuestionIndex = 0; score = 0; displayCurrentQuestion(); }
    function displayCurrentQuestion() { quizFeedback.innerHTML = ''; quizOptionsContainer.innerHTML = ''; nextQuestionBtn.classList.add('hidden'); if (currentQuestionIndex >= quizQuestions.length) { showResults(); return; } const q = quizQuestions[currentQuestionIndex]; quizQuestionText.textContent = q.question; quizProgressValue.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`; if (q.type === 'QCM') { q.options.forEach(option => { const btn = document.createElement('button'); btn.textContent = option; btn.addEventListener('click', handleOptionClick); quizOptionsContainer.appendChild(btn); }); } else { const showAnswerBtnQRU = document.createElement('button'); showAnswerBtnQRU.textContent = "Voir la réponse"; showAnswerBtnQRU.className = 'qru-show-answer-btn'; quizOptionsContainer.appendChild(showAnswerBtnQRU); showAnswerBtnQRU.addEventListener('click', () => { const answerDiv = document.createElement('div'); answerDiv.className = 'qru-answer'; answerDiv.innerHTML = `<strong>Réponse :</strong> ${q.answer}`; quizOptionsContainer.innerHTML = ''; quizOptionsContainer.appendChild(answerDiv); nextQuestionBtn.classList.remove('hidden'); }, { once: true }); } }
    function handleOptionClick(event) { const selectedButton = event.target; const q = quizQuestions[currentQuestionIndex]; quizOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true); if (selectedButton.textContent === q.answer) { score++; selectedButton.classList.add('correct'); quizFeedback.textContent = "Bonne réponse !"; quizFeedback.style.color = 'var(--success-color)'; } else { selectedButton.classList.add('incorrect'); quizFeedback.textContent = `Mauvaise réponse. La bonne réponse était : ${q.answer}`; quizFeedback.style.color = 'var(--danger-color)'; quizOptionsContainer.querySelectorAll('button').forEach(btn => { if (btn.textContent === q.answer) btn.classList.add('correct'); }); } nextQuestionBtn.classList.remove('hidden'); }
    function showResults() { showView('quiz-results-view'); finalScoreEl.textContent = `${score} / ${quizQuestions.length}`; }
    
    // --- ÉVÉNEMENTS ---
    goToReviewBtn.addEventListener('click', () => { showNextCard(); showView('review-view'); });
    goToManageBtn.addEventListener('click', () => showView('manage-view'));
    goToLibraryBtn.addEventListener('click', () => showView('library-view'));
    backToHomeBtn.addEventListener('click', () => showView('home-view'));
    backToHomeFromManageBtn.addEventListener('click', () => showView('home-view'));
    backToHomeFromLibraryBtn.addEventListener('click', () => showView('home-view'));
    backToLibraryBtn.addEventListener('click', () => showView('library-view'));
    backToLibraryFromResultsBtn.addEventListener('click', () => showView('library-view'));
    restartQuizBtn.addEventListener('click', () => { showView('quiz-view'); startQuiz(quizQuestions); });
    nextQuestionBtn.addEventListener('click', () => { currentQuestionIndex++; displayCurrentQuestion(); });
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
    workshopItemSelector.addEventListener('change', () => { const selectedItem = workshopItemSelector.value; workshopTextarea.value = selectedItem ? itemsData[selectedItem] || '' : ''; });
    workshopSaveBtn.addEventListener('click', () => { const selectedItem = workshopItemSelector.value; if (!selectedItem) { alert('Veuillez choisir un item.'); return; } saveItemData(selectedItem, workshopTextarea.value); });
    
    // Logique mise à jour pour la bibliothèque
    libraryItemSelector.addEventListener('change', () => {
        const actionsContainer = document.getElementById('library-actions-container');
        actionsContainer.innerHTML = ''; // Nettoyer les anciens boutons
        
        const selectedItem = libraryItemSelector.value;
        if (!selectedItem) {
            libraryContentDisplay.innerHTML = `<p class="placeholder-text">Veuillez sélectionner un item.</p>`;
            return;
        }

        // Afficher le texte ou le placeholder
        libraryContentDisplay.textContent = itemsData[selectedItem] || '';
        if (!itemsData[selectedItem]) {
            libraryContentDisplay.innerHTML = `<p class="placeholder-text">Aucune note n'a été enregistrée pour cet item.</p>`;
        }
        
        // Créer et ajouter les boutons
        const quizBtn = document.createElement('button');
        quizBtn.className = 'ia-btn';
        quizBtn.textContent = "S'entraîner (Quiz IA)";
        quizBtn.disabled = !itemsData[selectedItem]; // Désactivé si pas de texte
        quizBtn.addEventListener('click', generateQuiz);

        const cardsBtn = document.createElement('button');
        cardsBtn.className = 'ia-btn success';
        cardsBtn.textContent = "Créer des cartes (IA)";
        cardsBtn.disabled = !itemsData[selectedItem]; // Désactivé si pas de texte
        cardsBtn.addEventListener('click', generateCards);

        actionsContainer.append(quizBtn, cardsBtn);
    });

    // --- DÉMARRAGE ---
    loadAllData();
    showView('home-view');
});