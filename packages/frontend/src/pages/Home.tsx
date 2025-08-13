import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DogCard from '../components/DogCard';
import DogFilters from '../components/DogFilters';
import { api } from '../lib/api';
import { parseDogListQuery, stringifyDogListQuery, DogListQuery, createDefaultQuery, buildApiQueryString } from '../lib/query';

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
  items: Dog[];
  page: {
    total: number;
    limit: number;
    offset: number;
  };
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentQuery, setCurrentQuery] = useState<DogListQuery>(createDefaultQuery());

  // Parse query from URL on mount and when URL changes
  useEffect(() => {
    const queryFromUrl = parseDogListQuery(searchParams.toString());
    setCurrentQuery(queryFromUrl);
  }, [searchParams]);

  // Fetch dogs when query changes
  useEffect(() => {
    fetchDogs(currentQuery);
  }, [currentQuery]);

  const fetchDogs = async (query: DogListQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildApiQueryString(query);
      const response = await api.get<DogsResponse>(`/dogs?${queryString}`);
      
      setDogs(response.data.items);
      setTotalCount(response.data.page.total);
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError('Failed to load dogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newQuery: DogListQuery) => {
    const queryString = stringifyDogListQuery(newQuery);
    navigate({ search: queryString }, { replace: true });
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, (currentQuery.offset || 0) - (currentQuery.limit || 24));
    const newQuery = { ...currentQuery, offset: newOffset };
    const queryString = stringifyDogListQuery(newQuery);
    navigate({ search: queryString });
  };

  const handleNextPage = () => {
    const newOffset = (currentQuery.offset || 0) + (currentQuery.limit || 24);
    if (newOffset < totalCount) {
      const newQuery = { ...currentQuery, offset: newOffset };
      const queryString = stringifyDogListQuery(newQuery);
      navigate({ search: queryString });
    }
  };

  const currentPage = Math.floor((currentQuery.offset || 0) / (currentQuery.limit || 24)) + 1;
  const totalPages = Math.ceil(totalCount / (currentQuery.limit || 24));
  const startIndex = (currentQuery.offset || 0) + 1;
  const endIndex = Math.min((currentQuery.offset || 0) + (currentQuery.limit || 24), totalCount);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Find your PawPal 🐾</h1>
            <p>Connect with street dogs looking for loving homes across Delhi/NCR</p>
            <div className="hero-stat">
              <span className="emoji">🐕</span>
              <span>{totalCount} dogs waiting for homes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        <div className="content-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Available Dogs</h2>
              <p className="section-subtitle">
                Use filters below to find your perfect companion
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <DogFilters 
            value={currentQuery} 
            onChange={handleFiltersChange}
          />

          {/* Results */}
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <span>Loading dogs...</span>
            </div>
          ) : error ? (
            <div className="error">
              <p>{error}</p>
              <button onClick={() => fetchDogs(currentQuery)} style={{ marginTop: '12px', padding: '8px 16px' }}>
                Try Again
              </button>
            </div>
          ) : dogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">�</div>
              <h3>No dogs found</h3>
              <p>Try adjusting your filters to see more results</p>
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="section-header mb-4">
                <p className="text-muted">
                  Showing {startIndex}-{endIndex} of {totalCount} dogs
                </p>
              </div>

              {/* Dogs Grid */}
              <div className="dogs-grid">
                {dogs.map((dog) => (
                  <DogCard
                    key={dog.id}
                    id={dog.id}
                    name={dog.name}
                    area={dog.area}
                    images={dog.images}
                    health_sterilised={dog.health_sterilised}
                    health_vaccinated={dog.health_vaccinated}
                    energy_level={dog.energy_level}
                    status={dog.status}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
