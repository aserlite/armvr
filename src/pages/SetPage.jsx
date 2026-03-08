import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Loader2, Share2, Check } from 'lucide-react';

const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
};

export default function SetPage() {
    const { id } = useParams();
    const [set, setSet] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const [copied, setCopied] = useState(false);

    const { currentSet, isPlaying, playSet, isLoading, currentTime, setSeekRequest } = usePlayer();

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/sets.json`)
            .then((res) => res.json())
            .then((data) => {
                const foundSet = data.sets.find((s) => s.id === id);
                setSet(foundSet);
            });
    }, [id]);

    useEffect(() => {
        const t = searchParams.get('t');

        if (set && t) {
            const timeInSeconds = parseInt(t, 10);
            if (currentSet?.id !== set.id) {
                playSet(set);
            }
            setSeekRequest(timeInSeconds);
            searchParams.delete('t');
            setSearchParams(searchParams, { replace: true });
        }
    }, [set, searchParams, currentSet?.id, playSet, setSeekRequest, setSearchParams]);

    const handleShare = () => {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?t=${isCurrentSet ? currentTime : 0}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!set) return <div className="loading">Chargement...</div>;

    const isCurrentSet = currentSet?.id === set.id;

    const handleTrackClick = (timeStr) => {
        const seconds = parseTimeToSeconds(timeStr);
        if (!isCurrentSet) {
            playSet(set);
        }
        setSeekRequest(seconds);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Date inconnue";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="set-page">
            <Link to="/" className="back-link">← Retour</Link>

            <div className="set-page-header">
                <img src={`${import.meta.env.BASE_URL}${set.coverUrl}`} alt="cover" className="set-page-cover" />


                <div className="set-page-info">
                    <h1>{set.title}</h1>
                    <p className="set-page-date">Enregistré le : {formatDate(set.date)}</p>

                    <div className="set-tags">
                        {set.tags.map((tag, idx) => <span key={idx} className="tag">{tag}</span>)}
                    </div>

                    <div className="set-page-actions">
                        <button
                            className="play-btn-giant"
                            onClick={() => playSet(set)}
                            style={{ opacity: isCurrentSet && isLoading ? 0.5 : 1 }}
                        >
                            {isCurrentSet && isLoading ? (
                                <Loader2 size={36} fill="none" stroke="currentColor" className="animate-spin" />
                            ) : isCurrentSet && isPlaying ? (
                                <Pause size={36} fill="currentColor" stroke="none" />
                            ) : (
                                <Play size={36} fill="currentColor" stroke="none" style={{ marginLeft: '4px' }} />
                            )}
                        </button>

                        <button
                            className="share-btn"
                            onClick={handleShare}
                            title="Copier le lien à ce moment précis"
                        >
                            {copied ? <Check size={24} color="var(--orange-accent)" /> : <Share2 size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {set.tracklist && set.tracklist.length > 0 && (
                <div className="set-page-tracklist">
                    <h2>Tracklist</h2>
                    <ul>
                        {set.tracklist.map((track, index) => {
                            const trackSeconds = parseTimeToSeconds(track.time);
                            const nextTrackSeconds = set.tracklist[index + 1]
                                ? parseTimeToSeconds(set.tracklist[index + 1].time)
                                : set.duration;

                            const isActive = isCurrentSet && (currentTime >= trackSeconds && currentTime < nextTrackSeconds);

                            return (
                                <li
                                    key={index}
                                    className={`track-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleTrackClick(track.time)}
                                >
                                    <span className="track-time">{track.time}</span>
                                    <span className="track-title">{track.title}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}