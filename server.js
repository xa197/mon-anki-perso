require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// --- LA LIGNE MANQUANTE EST ICI ---
const app = express();
// --- FIN DE LA CORRECTION ---

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


// ---  ROUTES API ---

app.post('/api/generate-questions', async (req, res) => {
    const { text, numQCM, numQRU } = req.body;
    if (!text) { return res.status(400).json({ error: "Le texte est manquant." }); }
    const qcmCount = parseInt(numQCM, 10) || 3;
    const qruCount = parseInt(numQRU, 10) || 2;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings });
        const prompt = `**Tâche :** Génère ${qcmCount} QCM et ${qruCount} QRU... à partir du texte suivant :\n${text}`; // Mettez votre prompt complet ici
        const result = await model.generateContent(prompt);
        let jsonString = result.response.text();
        // ... (votre logique de parsing) ...
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        res.status(200).json(data);
    } catch (error) {
        console.error("Erreur génération quiz:", error.message);
        res.status(500).json({ error: "Erreur IA." });
    }
});

// ... (toutes vos autres routes API : /api/upload, /api/cards, etc. ne changent pas)
app.post('/api/upload', upload.single('image'), (req, res) => { if (!req.file) return res.status(400).send('Aucun fichier.'); res.json({ filePath: `/uploads/${req.file.filename}` }); });
app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.get('/api/items-data', (req, res) => { fs.readFile(itemsDataPath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json({}); return res.status(500).send('Erreur lecture données items.'); } if (data.trim() === '') return res.json({}); try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier items_data.json corrompu.'); } }); });
app.post('/api/cards', (req, res) => { fs.writeFile(cardsFilePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).send('Sauvegardé.'); }); });
app.put('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); const updatedData = req.body; fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const i = cards.findIndex(c => c.id === cardId); if (i === -1) return res.status(404).send('Non trouvé.'); cards[i] = { ...cards[i], ...updatedData }; fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).json(cards[i]); }); }); });
app.delete('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const filtered = cards.filter(c => c.id !== cardId); fs.writeFile(cardsFilePath, JSON.stringify(filtered, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur suppression.'); res.status(200).send('Supprimé.'); }); }); });
app.post('/api/items-data', (req, res) => { const { item, text } = req.body; if (!item) return res.status(400).send('Nom de l\'item manquant.'); fs.readFile(itemsDataPath, 'utf8', (err, data) => { let itemsData = {}; if (!err && data.trim() !== '') { try { itemsData = JSON.parse(data); } catch (e) { /* on écrase */ } } itemsData[item] = text; fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde données item.'); res.status(200).send('Données de l\'item sauvegardées.'); }); }); });
app.post('/api/generate-cards', async (req, res) => { const { text, item } = req.body; if (!text || !item) return res.status(400).send("Texte ou item manquant."); try { const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", safetySettings }); const prompt = `**Instruction :** Tu es un assistant qui crée des flashcards...`; const result = await model.generateContent(prompt); const response = await result.response; let jsonResponse = response.text(); const jsonStart = jsonResponse.indexOf('{'); const jsonEnd = jsonResponse.lastIndexOf('}'); if (jsonStart === -1 || jsonEnd === -1) throw new Error("Réponse IA invalide."); jsonResponse = jsonResponse.substring(jsonStart, jsonEnd + 1); const generatedData = JSON.parse(jsonResponse); fs.readFile(cardsFilePath, 'utf8', (err, data) => { let cards = []; if(!err && data) { cards = JSON.parse(data); } generatedData.newCards.forEach(newCard => { cards.push({ id: Date.now() + Math.random(), deck: item, recto: newCard.recto, verso: newCard.verso, rectoImage: null, versoImage: null, interval: 1, easeFactor: 2.5, nextReview: new Date().toISOString() }); }); fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).json({ message: `${generatedData.newCards.length} cartes créées !` }); }); }); } catch (error) { console.error("Erreur Gemini (génération de cartes):", error.message); res.status(500).send("Erreur IA."); } });


// --- FICHIERS STATIQUES & ROUTE CATCH-ALL ---

app.use(express.static(path.join(__dirname, 'build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));