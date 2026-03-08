import { createContext, useState, useContext, useEffect } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const [currentSet, setCurrentSet] = useState(() => {
        const savedSet = localStorage.getItem('dj-current-set');
        return savedSet ? JSON.parse(savedSet) : null;
    });

    const [volume, setVolume] = useState(() => {
        const savedVolume = localStorage.getItem('dj-volume');
        return savedVolume !== null ? parseFloat(savedVolume) : 1;
    });

    const [currentTime, setCurrentTime] = useState(() => {
        const savedTime = localStorage.getItem('dj-current-time');
        return savedTime !== null ? parseInt(savedTime, 10) : 0;
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(() => {
        return localStorage.getItem('dj-current-set') !== null;
    });
    const [seekRequest, setSeekRequest] = useState(null);

    const [audioAnalyser, setAudioAnalyser] = useState(null);

    useEffect(() => {
        if (currentSet) {
            localStorage.setItem('dj-current-set', JSON.stringify(currentSet));
        }
    }, [currentSet]);

    useEffect(() => {
        localStorage.setItem('dj-volume', volume);
    }, [volume]);

    useEffect(() => {
        if (currentSet) {
            localStorage.setItem('dj-current-time', currentTime);
        }
    }, [currentTime, currentSet]);

    const playSet = (set) => {
        if (currentSet?.id === set.id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentSet(set);
            setIsPlaying(true);
            setIsLoading(true);
            setCurrentTime(0);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentSet, isPlaying, setIsPlaying, playSet,
            isLoading, setIsLoading,
            currentTime, setCurrentTime,
            seekRequest, setSeekRequest,
            volume, setVolume,
            audioAnalyser, setAudioAnalyser
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);