import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Loader2 } from 'lucide-react';

export default function GlobalPlayer() {
    const {
        currentSet, isPlaying, setIsPlaying, isLoading, setIsLoading,
        currentTime, setCurrentTime, seekRequest, setSeekRequest, volume,
        setAudioAnalyser
    } = usePlayer();

    const audioCtxRef = useRef(null);

    const containerRef = useRef(null);
    const wavesurfer = useRef(null);

    const hasInitiallySeeked = useRef(false);

    useEffect(() => {
        if (!containerRef.current || !currentSet) return;

        if (wavesurfer.current) {
            wavesurfer.current.destroy();
        }

        hasInitiallySeeked.current = false;

        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(255, 255, 255, 0.3)',
            progressColor: '#ff5500',
            url: `${import.meta.env.BASE_URL}${currentSet.audioUrl}`,
            height: 40,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
        });

        wavesurfer.current.setVolume(volume);

        wavesurfer.current.on('ready', () => {
            if (currentTime > 0 && !hasInitiallySeeked.current) {
                wavesurfer.current.setTime(currentTime);
            }
            hasInitiallySeeked.current = true;
            setIsLoading(false);

            if (isPlaying) wavesurfer.current.play();
        });

        wavesurfer.current.on('timeupdate', (time) => {
            if (hasInitiallySeeked.current) {
                setCurrentTime(Math.floor(time));
            }
        });

        wavesurfer.current.on('play', () => {
            setIsPlaying(true);

            try {
                if (!audioCtxRef.current) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioCtxRef.current = new AudioContext();

                    const analyser = audioCtxRef.current.createAnalyser();
                    analyser.fftSize = 256;

                    const mediaElt = wavesurfer.current.getMediaElement();
                    const source = audioCtxRef.current.createMediaElementSource(mediaElt);
                    source.connect(analyser);
                    analyser.connect(audioCtxRef.current.destination);

                    setAudioAnalyser(analyser);
                }

                if (audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
            } catch (err) {
                console.warn("Visualizer audio inactif (sécurité navigateur) :", err);
            }
        });

        wavesurfer.current.on('pause', () => setIsPlaying(false));

        wavesurfer.current.on('finish', () => setIsPlaying(false));

        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
            setAudioAnalyser(null);

            if (wavesurfer.current) wavesurfer.current.destroy();
        };
    }, [currentSet]);

    useEffect(() => {
        if (seekRequest !== null && wavesurfer.current && !isLoading) {
            wavesurfer.current.setTime(seekRequest);
            if (!isPlaying) setIsPlaying(true);
            setSeekRequest(null);
        }
    }, [seekRequest, isLoading, isPlaying, setIsPlaying, setSeekRequest]);

    useEffect(() => {
        if (!wavesurfer.current) return;
        if (wavesurfer.current.getVolume() !== volume) {
            wavesurfer.current.setVolume(volume);
        }
    }, [volume]);

    useEffect(() => {
        if (!wavesurfer.current) return;
        if (!isLoading) {
            if (isPlaying && !wavesurfer.current.isPlaying()) {
                wavesurfer.current.play();
            } else if (!isPlaying && wavesurfer.current.isPlaying()) {
                wavesurfer.current.pause();
            }
        }
    }, [isPlaying, isLoading]);

    useEffect(() => {
        if ('mediaSession' in navigator && currentSet) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: currentSet.title,
                artist: 'ARMVR',
                album: 'ARMVR Sets',
                artwork: [
                    {
                        src: `${import.meta.env.BASE_URL}${currentSet.coverUrl}`,
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                if (wavesurfer.current) wavesurfer.current.play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                if (wavesurfer.current) wavesurfer.current.pause();
            });

            navigator.mediaSession.setActionHandler('seekbackward', () => {
                if (wavesurfer.current) {
                    const currentTime = wavesurfer.current.getCurrentTime();
                    wavesurfer.current.setTime(Math.max(0, currentTime - 15));
                }
            });

            navigator.mediaSession.setActionHandler('seekforward', () => {
                if (wavesurfer.current) {
                    const currentTime = wavesurfer.current.getCurrentTime();
                    const duration = wavesurfer.current.getDuration();
                    wavesurfer.current.setTime(Math.min(duration, currentTime + 15));
                }
            });
        }
    }, [currentSet]);

    const togglePlay = () => {
        if (!isLoading) setIsPlaying(!isPlaying);
    };

    if (!currentSet) return null;

    return (
        <div className="global-player-modal">
            <img src={`${import.meta.env.BASE_URL}${currentSet.coverUrl}`} alt="cover" className="player-cover" />
            <div className="player-controls">
                <div className="player-info">
                    <h4>{currentSet.title}</h4>
                </div>
                <div className="player-waveform-row">
                    <button className="play-btn-small" onClick={togglePlay} style={{ opacity: isLoading ? 0.5 : 1 }}>
                        {isLoading ? (
                            <Loader2 size={18} fill="none" stroke="currentColor" className="animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={18} fill="currentColor" stroke="none" />
                        ) : (
                            <Play size={18} fill="currentColor" stroke="none" style={{ marginLeft: '3px' }} />
                        )}
                    </button>
                    <div className="waveform-container" ref={containerRef} />
                </div>
            </div>
        </div>
    );
}