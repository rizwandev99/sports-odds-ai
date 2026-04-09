import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    function handleLogout() {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <nav>
            <Link to="/" className="logo">⚽ SportsOdds</Link>
            {token && (
                <ul className="nav-links">
                    <li><Link to="/">Matches</Link></li>
                    <li><Link to="/favorites">Favorites</Link></li>
                    <li><Link to="/agent">AI Agent</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
            )}
        </nav>
    );
}

export default Navbar;
