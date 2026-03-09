import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { X, Play, Pause, Eye, EyeOff, Music, Loader2 } from 'lucide-react';
import './Visualiser.css';

const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
};

export default function Visualizer() {
    const { currentSet, isPlaying, isLoading, audioAnalyser, playSet, currentTime } = usePlayer();
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    const [hudVisible, setHudVisible] = useState(true);

    const [vizType, setVizType] = useState(() => {
        return localStorage.getItem('dj-viz-type') || 'bars';
    });

    const [currentTrackName, setCurrentTrackName] = useState("");
    const [trackCover, setTrackCover] = useState("");

    useEffect(() => {
        localStorage.setItem('dj-viz-type', vizType);
    }, [vizType]);

    useEffect(() => {
        if (!currentSet?.tracklist || currentSet.tracklist.length === 0) {
            setCurrentTrackName("");
            return;
        }

        let activeTrack = null;
        for (let i = 0; i < currentSet.tracklist.length; i++) {
            const trackTime = parseTimeToSeconds(currentSet.tracklist[i].time);
            const nextTrackTime = currentSet.tracklist[i + 1]
                ? parseTimeToSeconds(currentSet.tracklist[i + 1].time)
                : Infinity;

            if (currentTime >= trackTime && currentTime < nextTrackTime) {
                activeTrack = currentSet.tracklist[i];
                break;
            }
        }

        if (activeTrack && activeTrack.title !== currentTrackName) {
            setCurrentTrackName(activeTrack.title);
        } else if (!activeTrack && currentTime === 0) {
            setCurrentTrackName("");
        }
    }, [currentTime, currentSet, currentTrackName]);

    useEffect(() => {
        const defaultCover = `${import.meta.env.BASE_URL}${currentSet?.coverUrl}`;

        if (!currentTrackName) {
            setTrackCover(defaultCover);
            return;
        }

        const fetchCover = async () => {
            try {
                const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(currentTrackName)}&entity=song&limit=1`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const highResUrl = data.results[0].artworkUrl100.replace('100x100bb', '500x500bb');
                    setTrackCover(highResUrl);
                } else {
                    setTrackCover(defaultCover);
                }
            } catch (error) {
                console.error(error);
                setTrackCover(defaultCover);
            }
        };

        fetchCover();
    }, [currentTrackName, currentSet]);

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
            const cy = canvas.height * 0.45;

            const usefulSpectrumPercent = 0.7;
            const usefulBufferLength = Math.floor(bufferLength * usefulSpectrumPercent);

            const sliceWidth = canvas.width / (usefulBufferLength - 1);
            let x = 0;

            if (vizType === 'bars') {
                for (let i = 0; i < usefulBufferLength; i++) {
                    const barHeight = dataArray[i] * 3;
                    const r = 255 - (i / usefulSpectrumPercent); // Dégradé adapté
                    const g = 85 + (i / 2);
                    const b = i * 2;
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, canvas.height - barHeight, (canvas.width/usefulBufferLength) - 2, barHeight);
                    x += canvas.width/usefulBufferLength;
                }
            }
            else if (vizType === 'radial') {
                const radius = Math.min(cx, cy) * 0.45;
                for (let i = 0; i < usefulBufferLength; i++) {
                    const barHeight = dataArray[i] * 1.5;
                    const angle = (i * 2 * Math.PI) / usefulBufferLength;
                    const r = 255 - ((i * 2) / usefulSpectrumPercent);
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
                for (let i = 0; i < usefulBufferLength; i++) {
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
            else if (vizType === 'neon-line') {
                ctx.beginPath();
                ctx.moveTo(0, cy);
                for (let i = 0; i < usefulBufferLength; i++) {
                    const v = dataArray[i] / 255;
                    const y = cy - (v * canvas.height * 0.3);
                    ctx.lineTo(x, y);
                    x += sliceWidth;
                }

                ctx.strokeStyle = "#ff5500";
                ctx.lineWidth = 8;
                ctx.shadowBlur = 40;
                ctx.shadowColor = "#ff5500";
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, cy);
                x = 0;
                for (let i = 0; i < usefulBufferLength; i++) {
                    const v = dataArray[i] / 255;
                    const y = cy - (v * canvas.height * 0.3);
                    ctx.lineTo(x, y);
                    x += sliceWidth;
                }

                ctx.shadowBlur = 0;
                ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            else if (vizType === 'pulse-circles') {
                const bass = (dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3]) / 4;
                const mid = dataArray[Math.floor(usefulBufferLength / 2)];

                const bassRadius = (bass / 255) * (canvas.height * 0.4);
                const midRadius = (mid / 255) * (canvas.height * 0.6);

                ctx.beginPath();
                ctx.arc(cx, cy, bassRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = `rgba(255, 85, 0, ${bass / 255})`;
                ctx.lineWidth = 8;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cx, cy, midRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = `rgba(5, 1, 255, ${mid / 255})`;
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            else if (vizType === 'mirrored-bars') {
                const barWidth = canvas.width / usefulBufferLength;
                let x = 0;
                for (let i = 0; i < usefulBufferLength; i++) {
                    const barHeight = dataArray[i] * 1.5;
                    const r = 255 - i;
                    const g = 85 + (i / 2);
                    const b = i * 2;
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, cy - barHeight, barWidth - 2, barHeight * 2);
                    x += barWidth;
                }
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

            <div className={`viz-vinyl-container ${isPlaying && !isLoading ? 'spinning' : ''}`}>
                <img src={trackCover} alt="vinyl" className="viz-vinyl" />
                <div className="viz-vinyl-hole" />
            </div>

            <div className={`minimal-track-info ${!hudVisible && currentTrackName ? 'visible' : ''}`}>
                <Music size={18} />
                <span>{currentTrackName}</span>
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

                        {currentTrackName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', marginBottom: '0.8rem' }}>
                                <Music size={16} />
                                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{currentTrackName}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                className="play-btn"
                                style={{ background: 'var(--orange-accent)', color: 'white', border: 'none', opacity: isLoading ? 0.7 : 1 }}
                                onClick={() => !isLoading && playSet(currentSet)}
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : isPlaying ? (
                                    <Pause size={20} fill="currentColor" />
                                ) : (
                                    <Play size={20} fill="currentColor" />
                                )}
                            </button>
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                {isLoading ? "Chargement..." : isPlaying ? "En lecture" : "En pause"}
                            </p>
                        </div>
                    </div>

                    <select
                        className="viz-selector"
                        value={vizType}
                        onChange={(e) => setVizType(e.target.value)}
                    >
                        <option value="bars">Barres classiques</option>
                        <option value="mirrored-bars">Barres symétriques</option>
                        <option value="radial">Cercle Radial</option>
                        <option value="wave">Vague pleine</option>
                        <option value="neon-line">Ligne Néon</option>
                        <option value="pulse-circles">Cercles Pulsants</option>
                    </select>
                </div>
            </div>
        </div>
    );
}