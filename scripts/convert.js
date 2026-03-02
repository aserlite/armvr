import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const audioDir = './public/audio';

async function convertWavToMp3() {
    if (!fs.existsSync(audioDir)) {
        console.error("❌ Dossier /public/audio introuvable.");
        return;
    }

    const files = fs.readdirSync(audioDir).filter(f => f.toLowerCase().endsWith('.wav'));

    if (files.length === 0) {
        console.log("✅ Aucun fichier WAV à convertir.");
        return;
    }

    console.log(`⏳ ${files.length} fichier(s) WAV trouvé(s). Début de la conversion en MP3 (320kbps)...`);

    for (const file of files) {
        const wavPath = path.join(audioDir, file);
        const mp3Path = path.join(audioDir, file.replace(/\.wav$/i, '.mp3'));

        console.log(`🎵 Conversion de : ${file} ...`);

        try {
            await execPromise(`ffmpeg -i "${wavPath}" -b:a 320k "${mp3Path}"`);

            console.log(`✅ MP3 généré. Suppression du fichier original : ${file}`);

            fs.unlinkSync(wavPath);

        } catch (error) {
            console.error(`❌ Erreur lors de la conversion de ${file}.`);
            console.error("L'erreur complète :", error.message);
            console.log("💡 Astuce : Assure-toi que FFmpeg est bien installé et accessible dans ton terminal.");
        }
    }

    console.log("🎉 Toutes les conversions et nettoyages sont terminés !");
}

convertWavToMp3();