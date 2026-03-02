import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';

import Home from './pages/Home';
import SetPage from './pages/SetPage';

import GlobalPlayer from './components/GlobalPlayer';
import GlobalVolume from './components/GlobalVolume';

import './App.css';

function App() {
    return (
        <PlayerProvider>
            <Router basename={import.meta.env.BASE_URL}>
                <div className="app-container">

                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/set/:id" element={<SetPage />} />
                    </Routes>

                    <GlobalVolume />
                    <GlobalPlayer />

                </div>
            </Router>
        </PlayerProvider>
    );
}

export default App;