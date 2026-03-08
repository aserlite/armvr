import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { X, Play, Pause } from 'lucide-react';
import './Visualiser.css';

export default function Visualizer() {
    const { currentSet, isPlaying, audioAnalyser, playSet } = usePlayer();
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!audioAnalyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = audioAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let animationId;

        const renderFrame = () => {
            animationId = requestAnimationFrame(renderFrame);

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            audioAnalyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bufferLength;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * 3; // On multiplie par 3 pour que les barres montent plus haut

                const r = 255 - i;
                const g = 85 + (i / 2);
                const b = i * 2;

                ctx.fillStyle = `rgb(${r},${g},${b})`;

                // On dessine la barre (barWidth - 2 permet de laisser 2px d'espace entre chaque barre)
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

                x += barWidth;
            }
        };

        renderFrame();

        return () => cancelAnimationFrame(animationId);
    }, [audioAnalyser]);

    if (!currentSet) {
        return (
            <div className="visualizer-page empty">
                <h2>Aucun set en cours de lecture</h2>
                <button onClick={() => navigate(-1)} className="close-viz-btn">Retour</button>
            </div>
        );
    }

    return (
        <div className="visualizer-page">
            <button className="close-viz-btn" onClick={() => navigate(-1)}>
                <X size={32} />
            </button>

            <div
                className="viz-background"
                style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${currentSet.coverUrl})` }}
            />
            <div className="viz-overlay" />

            <canvas ref={canvasRef} className="viz-canvas" />

            <div className="viz-info">
                <img src={`${import.meta.env.BASE_URL}${currentSet.coverUrl}`} alt="cover" className="viz-cover" />
                <div className="viz-text">
                    <h1>{currentSet.title}</h1>

                    {/* --- NOUVEAU BOUTON PLAY/PAUSE --- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                            className="play-btn"
                            style={{ background: 'var(--orange-accent)', color: 'white', border: 'none' }}
                            onClick={() => playSet(currentSet)}
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        <p style={{ margin: 0, opacity: 0.8 }}>
                            {isPlaying ? "En lecture" : "En pause"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}