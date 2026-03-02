import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SetCard from './components/SetCard';
import GlobalPlayer from './components/GlobalPlayer';
import SetPage from './pages/SetPage';
import GlobalVolume from "./components/GlobalVolume.jsx";

function Home() {
    const [sets, setSets] = useState([]);

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/sets.json`)
            .then((res) => res.json())
            .then((data) => setSets(data?.sets || []));
    }, []);

    return (
        <main className="sets-list">
            {sets.map((set) => <SetCard key={set.id} set={set} />)}
        </main>
    );
}

function App() {
    return (
        <Router>
            <div className="app-container">
                <header>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h1>ARMVR</h1>
                    </Link>
                </header>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/set/:id" element={<SetPage />} />
                </Routes>
                <GlobalVolume />
                <GlobalPlayer />
            </div>
        </Router>
    );
}

export default App;