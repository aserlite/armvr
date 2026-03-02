import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

export default function GlobalVolume() {
    const { currentSet, volume, setVolume } = usePlayer();
    const [prevVolume, setPrevVolume] = useState(1);

    if (!currentSet) return null;

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const toggleMute = () => {
        if (volume > 0) {
            setPrevVolume(volume);
            setVolume(0);
        } else {
            setVolume(prevVolume);
        }
    };

    let VolumeIcon = Volume2;
    if (volume === 0) VolumeIcon = VolumeX;
    else if (volume < 0.5) VolumeIcon = Volume1;

    return (
        <div className="global-volume-container">
            <button className="volume-btn" onClick={toggleMute}>
                <VolumeIcon size={20} stroke="currentColor" fill="none" />
            </button>

            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
            />
        </div>
    );
}