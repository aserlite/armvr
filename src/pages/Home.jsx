import { useState, useEffect } from 'react';
import SetCard from '../components/SetCard';
import { Search, SlidersHorizontal, Monitor } from 'lucide-react';
import {Link} from "react-router-dom";

export default function Home() {
    const [sets, setSets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortType, setSortType] = useState('date-desc');

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/sets.json`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data.sets) {
                    setSets(data.sets);
                }
            })
            .catch(err => console.error("Erreur de chargement des sets:", err));
    }, []);

    const filteredSets = sets.filter((set) => {
        const query = searchQuery.toLowerCase();

        const matchTitle = set.title.toLowerCase().includes(query);

        const matchTags = set.tags.some(tag => tag.toLowerCase().includes(query));

        const matchTracklist = set.tracklist && set.tracklist.some(track =>
            track.title.toLowerCase().includes(query)
        );

        return matchTitle || matchTags || matchTracklist;
    });

    const sortedAndFilteredSets = [...filteredSets].sort((a, b) => {
        switch (sortType) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'duration-desc':
                return b.duration - a.duration;
            case 'duration-asc':
                return a.duration - b.duration;
            default:
                return 0;
        }
    });

    return (
        <div className="home-page">
            <header className="home-header">
                <div className="header-top">
                    <h1>ARMVR</h1>
                    <Link to="/visualizer" className="tv-mode-btn">
                        <Monitor size={18} />
                        <span className="tv-mode-text">Mode TV</span>
                    </Link>
                </div>
                <div className="controls-bar">
                    <div className="search-wrapper">
                        <Search size={20} className="control-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher un set, un genre, une track..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="sort-wrapper">
                        <SlidersHorizontal size={20} className="control-icon" />
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                            className="sort-select"
                        >
                            <option value="date-desc">Plus récents</option>
                            <option value="date-asc">Plus anciens</option>
                            <option value="duration-desc">Plus longs</option>
                            <option value="duration-asc">Plus courts</option>
                        </select>
                    </div>
                </div>
            </header>

            <div className="sets-list">
                {sortedAndFilteredSets.length > 0 ? (
                    sortedAndFilteredSets.map(set => (
                        <SetCard key={set.id} set={set} />
                    ))
                ) : (
                    <div className="no-results">
                        <p>Aucun set trouvé pour "{searchQuery}"</p>
                        <button className="reset-btn" onClick={() => setSearchQuery('')}>
                            Réinitialiser la recherche
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}