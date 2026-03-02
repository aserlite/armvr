import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Loader2 } from 'lucide-react';

export default function SetCard({ set }) {
    const { currentSet, isPlaying, playSet, isLoading } = usePlayer();
    const navigate = useNavigate();

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}min` : `${m} min`;
    };

    const isCurrentSet = currentSet?.id === set.id;

    const handleCardClick = () => {
        navigate(`/set/${set.id}`);
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        playSet(set);
    };

    return (
        <div
            className={`set-list-item ${isCurrentSet ? 'active' : ''}`}
            onClick={handleCardClick}
            style={{ cursor: 'pointer' }}
        >
            <button
                className="play-btn"
                onClick={handlePlayClick}
                style={{ opacity: isCurrentSet && isLoading ? 0.5 : 1 }}
            >
                {isCurrentSet && isLoading ? (
                    <Loader2 size={20} fill="none" stroke="currentColor" className="animate-spin" />
                ) : isCurrentSet && isPlaying ? (
                    <Pause size={20} fill="currentColor" stroke="none" />
                ) : (
                    <Play size={20} fill="currentColor" stroke="none" style={{ marginLeft: '3px' }} />
                )}
            </button>

            <div className="set-list-cover-link">
                <img src={`${import.meta.env.BASE_URL}${set.coverUrl}`} alt={`Cover ${set.title}`} className="set-list-cover" />
            </div>

            <div className="set-list-info">
                <h3 className="set-link">{set.title}</h3>
                <div className="set-tags">
                    {set.tags.map((tag, index) => <span key={index} className="tag">{tag}</span>)}
                </div>
            </div>

            <div className="set-list-duration">
                {formatDuration(set.duration)}
            </div>
        </div>
    );
}