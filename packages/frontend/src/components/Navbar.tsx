import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import './Navbar.css';

export default function Navbar() {
  const { session, userRow, loading } = useAuthStore();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

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

  // Fetch pending incoming requests count
  useEffect(() => {
    if (session) {
      fetchPendingCount();
      // Set up polling every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/adoptions/incoming');
      const incoming = response.data.items || [];
      const pending = incoming.filter((item: any) => item.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Error fetching pending count:', error);
      setPendingCount(0);
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
                  {pendingCount > 0 && (
                    <span className="nav-badge">{pendingCount}</span>
                  )}
                </Link>
                {userRow?.role === 'admin' && (
                  <Link to="/admin" className="nav-link">
                    Admin
                  </Link>
                )}
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
