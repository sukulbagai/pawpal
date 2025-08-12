import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import DogCard from '../components/DogCard';
import { api } from '../lib/api';
import './Home.css';

interface Dog {
  id: string;
  name?: string;
  area?: string;
  images?: string[];
  status: 'available' | 'pending' | 'adopted';
  health_sterilised?: boolean;
  health_vaccinated?: boolean;
  energy_level?: string;
  temperament?: string;
  created_at: string;
}

interface DogsResponse {
  dogs: Dog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export default function Home() {
  const { session, userRow } = useAuthStore();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<DogsResponse>('/dogs?limit=24');
      setDogs(response.data.dogs);
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError('Failed to load dogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>🐕 Welcome to PawPal</h1>
          <p>Connecting street dogs with loving homes across Delhi/NCR</p>
          
          {session && userRow && (
            <div className="user-welcome">
              <h2>Hello, {userRow.name}! 👋</h2>
              <p>Ready to help some dogs find homes?</p>
            </div>
          )}
        </div>
      </section>

      {/* Dogs List Section */}
      <section className="dogs-section">
        <div className="section-header">
          <h2>Dogs Looking for Homes</h2>
          <p>Meet these wonderful dogs waiting for their forever families</p>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">🔄</div>
            <p>Loading dogs...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <p>{error}</p>
            <button onClick={fetchDogs} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && dogs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🐕</div>
            <p>No dogs found. Please run the seed data first!</p>
          </div>
        )}

        {!loading && !error && dogs.length > 0 && (
          <div className="dogs-grid">
            {dogs.map((dog) => (
              <DogCard
                key={dog.id}
                name={dog.name}
                area={dog.area}
                cover={dog.images?.[0]}
                sterilised={dog.health_sterilised}
                vaccinated={dog.health_vaccinated}
                status={dog.status}
              />
            ))}
          </div>
        )}

        {!loading && !error && dogs.length > 0 && (
          <div className="dogs-footer">
            <p>Showing {dogs.length} dogs • More filters coming in Step 6!</p>
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-card">
          <h3>🚀 Development Status</h3>
          <ul>
            <li>✅ Authentication system</li>
            <li>✅ User bootstrap & management</li>
            <li>✅ Dog listings with seed data</li>
            <li>🔄 Adoption requests (Step 7)</li>
            <li>🔄 Dog posting form (Step 5)</li>
            <li>🔄 Advanced filters (Step 6)</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
