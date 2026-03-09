import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { X, Play, Pause, Eye, EyeOff } from 'lucide-react';
import './Visualiser.css';

export default function Visualizer() {
    const { currentSet, isPlaying, audioAnalyser, playSet } = usePlayer();
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    const [hudVisible, setHudVisible] = useState(true);
    const [vizType, setVizType] = useState('bars');

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

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            if (vizType === 'bars') {
                const barWidth = canvas.width / bufferLength;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] * 3;
                    const r = 255 - i;
                    const g = 85 + (i / 2);
                    const b = i * 2;
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
                    x += barWidth;
                }
            }
            else if (vizType === 'radial') {
                const radius = Math.min(cx, cy) * 0.45;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] * 1.5;
                    const angle = (i * 2 * Math.PI) / bufferLength;

                    const r = 255 - (i * 2);
                    const g = 85 + (i / 2);
                    const b = i * 2;

                    ctx.strokeStyle = `rgb(${r},${g},${b})`;
                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";

                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
                    ctx.lineTo(cx + Math.cos(angle) * (radius + barHeight), cy + Math.sin(angle) * (radius + barHeight));
                    ctx.stroke();
                }
            }
            else if (vizType === 'wave') {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);
                const sliceWidth = canvas.width / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 255;
                    const y = canvas.height - (v * canvas.height * 0.6);
                    ctx.lineTo(x, y);
                    x += sliceWidth;
                }
                ctx.lineTo(canvas.width, canvas.height);
                ctx.closePath();
                const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                grad.addColorStop(0, "rgba(255, 85, 0, 1)");
                grad.addColorStop(0.25, "rgba(255, 85, 100, 0.9)");
                grad.addColorStop(1, "rgba(5, 1, 148, 0.8)");
                ctx.fillStyle = grad;
                ctx.fill();
            }
        };

        renderFrame();

        return () => cancelAnimationFrame(animationId);
    }, [audioAnalyser, vizType]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                playSet(currentSet);
            }
            if (event.code === 'KeyH') {
                setHudVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playSet, currentSet]);

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
            <div
                className="viz-background"
                style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${currentSet.coverUrl})` }}
            />
            <div className="viz-overlay" />

            <canvas ref={canvasRef} className="viz-canvas" />

            <div className={`viz-vinyl-container ${isPlaying ? 'spinning' : ''}`}>
                <img src={`${import.meta.env.BASE_URL}${currentSet.coverUrl}`} alt="vinyl" className="viz-vinyl" />
                <div className="viz-vinyl-hole" />
            </div>

            <button
                className={`hud-toggle-btn ${!hudVisible ? 'hud-hidden' : ''}`}
                onClick={() => setHudVisible(!hudVisible)}
                title="Cacher/Afficher l'interface (Touche H)"
            >
                {hudVisible ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>

            <div className={`viz-hud ${hudVisible ? '' : 'hidden'}`}>
                <button className="close-viz-btn" onClick={() => navigate(-1)}>
                    <X size={32} />
                </button>

                <div className="viz-info">
                    <img src={`${import.meta.env.BASE_URL}${currentSet.coverUrl}`} alt="cover" className="viz-cover" />
                    <div className="viz-text" style={{ flex: 1 }}>
                        <h1>{currentSet.title}</h1>

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

                    <select
                        className="viz-selector"
                        value={vizType}
                        onChange={(e) => setVizType(e.target.value)}
                    >
                        <option value="bars">Barres classiques</option>
                        <option value="radial">Cercle Radial</option>
                        <option value="wave">Vague</option>
                    </select>
                </div>
            </div>
        </div>
    );
}