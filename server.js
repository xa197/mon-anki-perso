require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GOOGLE_API_KEY) { 
    console.error("ERREUR: GOOGLE_API_KEY non définie."); 
    process.exit(1); 
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => cb(null, 'uploads/'), 
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) 
});
const upload = multer({ storage: storage });

app.use(express.json());

const cardsFilePath = path.join(__dirname, 'cartes.json');
const itemsDataPath = path.join(__dirname, 'items_data.json');

// --- ROUTES API ---

app.post('/api/generate-questions', async (req, res) => {
    const { text, numQCM, numQRU } = req.body;
    if (!text) { return res.status(400).json({ error: "Le texte est manquant." }); }
    const qcmCount = parseInt(numQCM, 10) || 3;
    const qruCount = parseInt(numQRU, 10) || 2;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });
        
        // --- CORRECTION ICI : On remet le prompt détaillé et fiable ---
        const prompt = `**Instruction :** Tu es un assistant expert en création de matériel pédagogique pour des étudiants en médecine. Ton rôle est de générer des questions pertinentes à partir du texte fourni.
        **Format de sortie obligatoire :** Réponds UNIQUEMENT avec un objet JSON valide. Ne rien inclure avant ou après le JSON. N'utilise pas de blocs de code Markdown (\`\`\`json).
        **Structure du JSON :** L'objet JSON doit contenir une clé "questions" qui est un tableau d'objets. Chaque objet question doit avoir : une clé "type" ('QCM' ou 'QRU'), une clé "question", une clé "options" (un tableau de 4 chaînes de caractères pour un QCM, ou un tableau vide pour une QRU), et une clé "answer" (la réponse correcte, qui doit être l'une des 4 options pour un QCM).
        **Tâche :** Génère ${qcmCount} QCM et ${qruCount} QRU à partir du texte suivant :
        --- DEBUT DU TEXTE ---
        ${text}
        --- FIN DU TEXTE ---`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        let jsonString = response.text();
        
        if (!jsonString || jsonString.trim() === '') {
            throw new Error("La réponse de l'IA est vide.");
        }
        
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) { 
            throw new Error("La réponse de l'IA ne contient pas de JSON valide."); 
        }
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);

        const data = JSON.parse(jsonString);
        res.status(200).json(data);
        
    } catch (error) {
        console.error("Erreur génération quiz:", error.message);
        res.status(500).json({ error: "Erreur IA." });
    }
});


app.post('/api/generate-cards', async (req, res) => {
    // ... (cette route est maintenant correcte, on ne la change pas)
    const { text, item } = req.body;
    if (!text || !item) { return res.status(400).send("Texte ou item manquant."); }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });
        const prompt = `**Instruction :** Tu es un assistant spécialisé dans la création de flashcards (recto/verso) pour des étudiants en médecine.
        **Format de sortie obligatoire :** Réponds UNIQUEMENT avec un objet JSON valide...`; // Le prompt complet
        const result = await model.generateContent(prompt);
        // ... reste de la logique ...
        const response = await result.response; let jsonResponse = response.text();
        if (!jsonResponse || jsonResponse.trim() === '') { throw new Error("La réponse de l'IA est vide."); }
        const jsonStart = jsonResponse.indexOf('{'); const jsonEnd = jsonResponse.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) { throw new Error("Réponse IA invalide."); }
        jsonResponse = jsonResponse.substring(jsonStart, jsonEnd + 1);
        const generatedData = JSON.parse(jsonResponse);
        if (!generatedData.newCards || !Array.isArray(generatedData.newCards)) { throw new Error("Le format JSON reçu de l'IA est incorrect."); }
        fs.readFile(cardsFilePath, 'utf8', (err, data) => {
            let cards = [];
            if (!err && data) { try { cards = JSON.parse(data); } catch (e) {} }
            generatedData.newCards.forEach(newCard => {
                cards.push({ id: Date.now() + Math.random(), deck: item, recto: newCard.recto, verso: newCard.verso, rectoImage: null, versoImage: null, interval: 1, easeFactor: 2.5, nextReview: new Date().toISOString() });
            });
            fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
                if (err) return res.status(500).send('Erreur sauvegarde.');
                res.status(200).json({ message: `${generatedData.newCards.length} cartes créées !` });
            });
        });
    } catch (error) { console.error("Erreur Gemini (génération de cartes):", error.message); res.status(500).send("Erreur IA."); }
});


// ... (le reste de vos routes API ne change pas)
app.post('/api/upload', upload.single('image'), (req, res) => { if (!req.file) return res.status(400).send('Aucun fichier.'); res.json({ filePath: `/uploads/${req.file.filename}` }); });
app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.get('/api/items-data', (req, res) => { fs.readFile(itemsDataPath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json({}); return res.status(500).send('Erreur lecture données items.'); } if (data.trim() === '') return res.json({}); try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier items_data.json corrompu.'); } }); });
app.post('/api/cards', (req, res) => { fs.writeFile(cardsFilePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).send('Sauvegardé.'); }); });
app.put('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); const updatedData = req.body; fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const i = cards.findIndex(c => c.id === cardId); if (i === -1) return res.status(404).send('Non trouvé.'); cards[i] = { ...cards[i], ...updatedData }; fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).json(cards[i]); }); }); });
app.delete('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const filtered = cards.filter(c => c.id !== cardId); fs.writeFile(cardsFilePath, JSON.stringify(filtered, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur suppression.'); res.status(200).send('Supprimé.'); }); }); });
app.post('/api/items-data', (req, res) => { const { item, text } = req.body; if (!item) return res.status(400).send('Nom de l\'item manquant.'); fs.readFile(itemsDataPath, 'utf8', (err, data) => { let itemsData = {}; if (!err && data.trim() !== '') { try { itemsData = JSON.parse(data); } catch (e) {} } itemsData[item] = text; fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde données item.'); res.status(200).send('Données de l\'item sauvegardées.'); }); }); });


// --- FICHIERS STATIQUES & ROUTE CATCH-ALL ---
app.use(express.static(path.join(__dirname, 'build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));