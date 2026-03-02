import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';

const audioDir = './public/audio';
const dataDir = './public/data';
const jsonPath = path.join(dataDir, 'sets.json');

async function generateJSON() {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(audioDir)) return console.error("Dossier /public/audio introuvable.");

    let existingSets = {};
    if (fs.existsSync(jsonPath)) {
        try {
            const fileContent = fs.readFileSync(jsonPath, 'utf8');
            const parsedData = JSON.parse(fileContent);
            if (parsedData.sets) {
                parsedData.sets.forEach(s => {
                    existingSets[s.id] = s;
                });
            }
        } catch (err) {
            console.error("Erreur de lecture de l'ancien sets.json (il sera écrasé) :", err);
        }
    }

    const files = fs.readdirSync(audioDir).filter(f => ['.mp3', '.wav'].some(ext => f.toLowerCase().endsWith(ext)));

    const sets = await Promise.all(files.map(async (file) => {
        const filePath = path.join(audioDir, file);
        const metadata = await parseFile(filePath);
        const baseName = path.parse(file).name;
        const id = baseName.replace(/\s+/g, '_');
        const stat = fs.statSync(filePath);

        const existingData = existingSets[id];

        const finalTags = (existingData && existingData.tags)
            ? existingData.tags
            : (metadata.common.genre || ['Uncategorized']);

        const finalTracklist = (existingData && existingData.tracklist)
            ? existingData.tracklist
            : [{ time: "00:00", title: "Unknown" }];

        const finalTitle = (existingData && existingData.title)
            ? existingData.title
            : (metadata.common.title || baseName);

        const finalDate = (existingData && existingData.date)
            ? existingData.date
            : (metadata.common.date || stat.birthtime.toISOString().split('T')[0]);

        return {
            id: id,
            title: finalTitle,
            duration: Math.round(metadata.format.duration),
            tags: finalTags,
            date: finalDate,
            audioUrl: `audio/${file}`,
            coverUrl: `images/${baseName}.jpg`,
            tracklist: finalTracklist
        };
    }));

    fs.writeFileSync(jsonPath, JSON.stringify({ sets }, null, 2));
    console.log(`sets.json mis à jour avec ${sets.length} sets`);
}

generateJSON();