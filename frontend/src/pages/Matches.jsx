import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../api';

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function MatchCard({ match, onFavorite, onUnfavorite }) {
    const [saved, setSaved] = useState(match.isFavorite || false);

    async function handleToggle() {
        if (saved) {
            await onUnfavorite(match.id);
            setSaved(false);
        } else {
            await onFavorite(match.id);
            setSaved(true);
        }
    }

    const odds = match.liveOdds?.odds;
    const probs = match.liveOdds;

    return (
        <div className="match-card">
            <div className="match-header">
                <div>
                    <div className="match-teams">{match.teamA} vs {match.teamB}</div>
                    <div className="match-meta">
                        {match.league} · {match.sport} · Starts: {formatTime(match.startTime)}
                    </div>
                </div>
                <span className="match-badge">LIVE ODDS</span>
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

            <button
                className={`fav-btn ${saved ? 'saved' : ''}`}
                onClick={handleToggle}
            >
                {saved ? '★ Favorited (Click to remove)' : '☆ Save to Favorites'}
            </button>
        </div>
    );
}

function Matches() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        apiGet('/matches').then(data => {
            setMatches(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    }, [navigate]);

    async function handleFavorite(matchId) {
        await apiPost('/favorites', { matchId });
    }

    async function handleUnfavorite(matchId) {
        await apiDelete(`/favorites/${matchId}`);
    }

    return (
        <div className="container">
            <h1 className="page-title">Live Matches</h1>
            <p className="page-subtitle">Odds are generated in real-time by our AI engine</p>

            {loading && <div className="loading">⏳ Fetching matches & generating odds...</div>}

            {!loading && matches.length === 0 && (
                <div className="empty-state">
                    <h3>No matches available</h3>
                    <p>Check back later for upcoming matches.</p>
                </div>
            )}

            {matches.map(match => (
                <MatchCard 
                    key={match.id} 
                    match={match} 
                    onFavorite={handleFavorite}
                    onUnfavorite={handleUnfavorite} 
                />
            ))}
        </div>
    );
}

export default Matches;
