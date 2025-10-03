require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const app = express();
const PORT = process.env.PORT || 3000;

// === MODIFICATION DE TEST ULTIME ===
// Assurez-vous d'avoir mis votre NOUVELLE clé API générée via Google AI Studio
const API_KEY = "AIzaSyBFI5gzQ3EvaAdC8e4D4EXRDZQD01ye10M"; 
const genAI = new GoogleGenerativeAI(API_KEY);
// ===================================

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
app.use(express.json());
const cardsFilePath = path.join(__dirname, 'cartes.json');
const itemsDataPath = path.join(__dirname, 'items_data.json');

// --- ROUTES API ---

app.post('/api/generate-questions', async (req, res) => {
    const { texts, numQCM } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: "Aucun texte fourni." });
    }
    const qcmCount = parseInt(numQCM, 10) || 5;
    const combinedText = texts.join('\n\n---\n\n');

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        
        const prompt = `**Instruction :** Tu es un assistant expert en création de matériel pédagogique pour des étudiants en médecine. Ton rôle est de générer des questions pertinentes à partir du texte fourni.
        **Format de sortie obligatoire :** Réponds UNIQUEMENT avec un objet JSON valide. Ne rien inclure avant ou après le JSON. N'utilise pas de blocs de code Markdown (\`\`\`json).
        **Structure du JSON :** L'objet JSON doit contenir une clé "questions" qui est un tableau d'objets. Chaque objet question doit avoir : une clé "type" ('QCM'), une clé "question", une clé "options" (un tableau de 4 chaînes de caractères), et une clé "answer" (la réponse correcte, qui doit être l'une des 4 options).
        **Tâche :** Génère ${qcmCount} QCM à partir du texte suivant :
        --- DEBUT DU TEXTE ---
        ${combinedText}
        --- FIN DU TEXTE ---`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        let jsonString = response.text();
        if (!jsonString || jsonString.trim() === '') { throw new Error("Réponse IA vide."); }
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) { throw new Error("Réponse IA invalide."); }
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        res.status(200).json(data);
    } catch (error) {
        console.error("Erreur génération quiz:", error);
        res.status(500).json({ error: "Erreur IA." });
    }
});

// ... (le reste de votre code ne change pas) ...
app.post('/api/add-item', (req, res) => {
    const { newItemName } = req.body;
    if (!newItemName || newItemName.trim() === '') { return res.status(400).send('Le nom de l\'item ne peut pas être vide.'); }
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        let cards = [];
        if (!err && data) { try { cards = JSON.parse(data); } catch (e) {} }
        const itemExists = cards.some(card => card.deck === newItemName);
        if (itemExists) { return res.status(409).send('Cet item existe déjà.'); }
        const placeholderCard = { id: Date.now(), deck: newItemName, recto: "Carte initiale", verso: "Carte initiale", nextReview: new Date().toISOString() };
        cards.push(placeholderCard);
        fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur sauvegarde.');
            res.status(201).send('Item créé avec succès.');
        });
    });
});

app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.get('/api/items-data', (req, res) => { fs.readFile(itemsDataPath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json({}); return res.status(500).send('Erreur lecture données items.'); } if (data.trim() === '') return res.json({}); try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier items_data.json corrompu.'); } }); });
app.post('/api/items-data', (req, res) => { const { item, text } = req.body; if (!item) return res.status(400).send('Nom de l\'item manquant.'); fs.readFile(itemsDataPath, 'utf8', (err, data) => { let itemsData = {}; if (!err && data.trim() !== '') { try { itemsData = JSON.parse(data); } catch (e) {} } itemsData[item] = text; fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde données item.'); res.status(200).send('Données de l\'item sauvegardées.'); }); }); });

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));