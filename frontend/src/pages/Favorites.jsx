import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '../api';

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function Favorites() {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }

        fetchFavorites();
    }, [navigate]);

    function fetchFavorites() {
        apiGet('/favorites').then(data => {
            setFavorites(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    }

    async function handleRemove(matchId) {
        // Optimistically remove from UI
        setFavorites(prev => prev.filter(m => m.id !== matchId));
        // Call backend to delete
        try {
            await apiDelete(`/favorites/${matchId}`);
        } catch (err) {
            console.error('Failed to remove favorite', err);
            // Re-fetch to restore state if it failed
            fetchFavorites();
        }
    }

    return (
        <div className="container">
            <h1 className="page-title">My Favorites</h1>
            <p className="page-subtitle">Saved matches with live odds</p>

            {loading && <div className="loading">⏳ Loading favorites...</div>}

            {!loading && favorites.length === 0 && (
                <div className="empty-state">
                    <h3>No favorites yet</h3>
                    <p>Go to the Matches page and save some games you want to track!</p>
                </div>
            )}

            {favorites.map(match => {
                const odds = match.liveOdds?.odds;
                const probs = match.liveOdds;

                return (
                    <div className="match-card" key={match.id}>
                        <div className="match-header">
                            <div>
                                <div className="match-teams">{match.teamA} vs {match.teamB}</div>
                                <div className="match-meta">
                                    {match.league} · {match.sport} · Starts: {formatTime(match.startTime)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="match-badge">FAVORITE</span>
                                <button 
                                    onClick={() => handleRemove(match.id)}
                                    style={{
                                        background: 'none', 
                                        border: '1px solid #ff4d4f', 
                                        color: '#ff4d4f', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}>
                                    REMOVE
                                </button>
                            </div>
                        </div>

                        {odds ? (
                            <>
                                <div className="odds-row">
                                    <div className="odds-box">
                                        <div className="odds-label">{match.teamA}</div>
                                        <div className="odds-value">{odds.teamA}</div>
                                        <div className="odds-prob">{(probs.teamA_win_prob * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="odds-box">
                                        <div className="odds-label">Draw</div>
                                        <div className="odds-value">{odds.draw}</div>
                                        <div className="odds-prob">{(probs.draw_prob * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="odds-box">
                                        <div className="odds-label">{match.teamB}</div>
                                        <div className="odds-value">{odds.teamB}</div>
                                        <div className="odds-prob">{(probs.teamB_win_prob * 100).toFixed(0)}%</div>
                                    </div>
                                </div>

                                <div className="prob-bar-wrap">
                                    <div className="prob-bar-labels">
                                        <span>{match.teamA}</span>
                                        <span>Draw</span>
                                        <span>{match.teamB}</span>
                                    </div>
                                    <div className="prob-bar">
                                        <div className="prob-bar-a" style={{ width: `${probs.teamA_win_prob * 100}%` }} />
                                        <div className="prob-bar-d" style={{ width: `${probs.draw_prob * 100}%` }} />
                                        <div className="prob-bar-b" style={{ width: `${probs.teamB_win_prob * 100}%` }} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Odds unavailable</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default Favorites;
