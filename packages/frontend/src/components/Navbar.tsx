import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import './Navbar.css';

export default function Navbar() {
  const { session, userRow, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      useAuthStore.getState().clear();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            🐕 PawPal
          </Link>
        </div>

        <div className="nav-right">
          {loading ? (
            <div className="nav-loading">Loading...</div>
          ) : session ? (
            // Authenticated user
            <div className="nav-auth">
              <span className="nav-greeting">
                Hello, {userRow?.name || session.user?.email}
              </span>
              
              <div className="nav-links">
                <Link to="/post-dog" className="nav-link">
                  Post Dog
                </Link>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
              </div>

              <button 
                onClick={handleLogout}
                className="nav-button logout"
              >
                Logout
              </button>
            </div>
          ) : (
            // Guest user
            <div className="nav-guest">
              <Link to="/login" className="nav-button login">
                Login
              </Link>
              <Link to="/signup" className="nav-button signup">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
