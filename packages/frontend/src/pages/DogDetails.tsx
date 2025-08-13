import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { ReportButton } from '../components/ReportButton';

interface DogDetails {
  id: string;
  name?: string;
  age_years?: number;
  gender?: string;
  description?: string;
  area?: string;
  location_lat?: number;
  location_lng?: number;
  health_sterilised?: boolean;
  health_vaccinated?: boolean;
  health_dewormed?: boolean;
  compatibility_kids?: boolean;
  compatibility_dogs?: boolean;
  compatibility_cats?: boolean;
  energy_level?: string;
  temperament?: string;
  playfulness?: string;
  special_needs?: string;
  personality_tag_ids?: number[];
  images?: string[];
  videos?: string[];
  status: 'available' | 'pending' | 'adopted';
  created_at: string;
  posted_by?: string;
  personality_tags?: Array<{ id: number; tag_name: string }>;
}

export default function DogDetails() {
  const { id } = useParams<{ id: string }>();
  const [dog, setDog] = useState<DogDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Adoption request state
  const [adoptionMessage, setAdoptionMessage] = useState('');
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionRequested, setAdoptionRequested] = useState(false);
  
  // User's request status for this dog
  const [myRequest, setMyRequest] = useState<{
    id: string;
    status: 'pending' | 'approved' | 'declined' | 'cancelled';
    message?: string;
    created_at: string;
  } | null>(null);
  
  const { session, userRow } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const handleAdoptionRequest = async () => {
    if (!dog?.id) return;

    try {
      setAdoptionLoading(true);
      const response = await api.post('/adoptions', {
        dog_id: dog.id,
        message: adoptionMessage.trim() || null,
      });

      if (response.data.ok) {
        setAdoptionRequested(true);
        setAdoptionMessage('');
        showSuccess('Request sent! Track it in Dashboard → My Requests.');
      }
    } catch (error: any) {
      console.error('Error submitting adoption request:', error);
      if (error.response?.status === 409) {
        showError('You already have a pending request for this dog.');
      } else {
        showError(error.response?.data?.error || 'Failed to submit adoption request');
      }
    } finally {
      setAdoptionLoading(false);
    }
  };

  const isOwner = userRow && dog && (userRow.id === dog.posted_by);
  const canRequestAdoption = session && !isOwner && dog?.status === 'available' && !adoptionRequested;

  useEffect(() => {
    if (id) {
      fetchDog(id);
      // Fetch user's request status if logged in
      if (session) {
        fetchMyRequest(id);
      }
    }
  }, [id, session]);

  const fetchDog = async (dogId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<DogDetails>(`/dogs/${dogId}`);
      setDog(response.data);
    } catch (err) {
      console.error('Error fetching dog:', err);
      setError('Failed to load dog details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequest = async (dogId: string) => {
    try {
      const response = await api.get(`/dogs/${dogId}/my-request`);
      setMyRequest(response.data.request);
    } catch (err) {
      console.error('Error fetching my request:', err);
      // Don't show error to user - this is optional info
    }
  };

  const handlePrevImage = () => {
    if (dog?.images && dog.images.length > 1) {
      setCurrentImageIndex(prev => 
        prev === 0 ? dog.images!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (dog?.images && dog.images.length > 1) {
      setCurrentImageIndex(prev => 
        prev === dog.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>Loading dog details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <Link to="/" className="filter-button filter-button-primary">
          ← Back to Dogs
        </Link>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🐕</div>
        <h3>Dog not found</h3>
        <p>The dog you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="filter-button filter-button-primary">
          ← Back to Dogs
        </Link>
      </div>
    );
  }

  const displayName = dog.name || 'Unnamed';
  const images = dog.images && dog.images.length > 0 
    ? dog.images 
    : ['https://picsum.photos/seed/pawpal-default/640/480'];
  const currentImage = images[currentImageIndex];

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'available':
        return { emoji: '💚', text: 'Available for Adoption' };
      case 'pending':
        return { emoji: '🟡', text: 'Adoption Pending' };
      case 'adopted':
        return { emoji: '💜', text: 'Adopted' };
      default:
        return { emoji: '🔍', text: status };
    }
  };

  const statusDisplay = getStatusDisplay(dog.status);

  return (
    <div className="dog-details">
      {/* Header Banner */}
      <div className="details-header">
        <div className="details-header-image">
          <img 
            src={currentImage} 
            alt={displayName}
          />
          <div className="details-header-overlay">
            <div className="container">
              <div className="details-header-content">
                <h1 className="details-title">{displayName}</h1>
                {dog.area && (
                  <div className="details-location">
                    <span>📍</span>
                    <span>{dog.area}</span>
                  </div>
                )}
                <div className="details-status">
                  <span className={`badge badge-${dog.status}`}>
                    {statusDisplay.emoji} {statusDisplay.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="details-wrap">
          {/* Left Column - Carousel */}
          <div className="details-left">
            <div className="carousel" tabIndex={0} onKeyDown={handleKeyDown}>
              <div className="carousel-container">
                <img 
                  src={currentImage} 
                  alt={`${displayName} - Image ${currentImageIndex + 1}`}
                  className="carousel-image"
                />
                
                {images.length > 1 && (
                  <>
                    <button 
                      className="carousel-button carousel-button-prev"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button 
                      className="carousel-button carousel-button-next"
                      onClick={handleNextImage}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="carousel-indicators">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
            {dog.videos && dog.videos.length > 0 && (
              <div className="videos-section">
                <h3 className="videos-title">Videos</h3>
                <div className="videos-grid">
                  {dog.videos.map((videoUrl, index) => {
                    const isUploadedVideo = videoUrl.includes('/dog-videos/');
                    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
                    
                    return (
                      <div key={index} className="video-item">
                        {isUploadedVideo ? (
                          <video 
                            controls 
                            muted 
                            className="video-player"
                            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSI+VmlkZW88L3RleHQ+PC9zdmc+"
                          >
                            <source src={videoUrl} />
                            Your browser does not support video playback.
                          </video>
                        ) : isYouTube ? (
                          <div className="external-video">
                            <iframe
                              src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                              title={`${dog.name || 'Dog'} video ${index + 1}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="video-iframe"
                            />
                          </div>
                        ) : (
                          <div className="external-video-link">
                            <div className="video-icon">🎬</div>
                            <p>External Video Link</p>
                            <a 
                              href={videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="video-link-btn"
                            >
                              View Video →
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="details-right">
            {/* Basic Info */}
            <div className="details-card">
              <h3 className="details-card-title">Basic Information</h3>
              <div className="details-info-grid">
                {dog.age_years && (
                  <div className="details-info-item">
                    <span className="details-info-label">Age:</span>
                    <span>{dog.age_years} year{dog.age_years !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {dog.gender && (
                  <div className="details-info-item">
                    <span className="details-info-label">Gender:</span>
                    <span className="details-info-value">{dog.gender.charAt(0).toUpperCase() + dog.gender.slice(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Health Status */}
            <div className="details-card">
              <h3 className="details-card-title">Health Status</h3>
              <div className="details-badges">
                {dog.health_sterilised && (
                  <span className="badge badge-health">✨ Sterilised</span>
                )}
                {dog.health_vaccinated && (
                  <span className="badge badge-health">💉 Vaccinated</span>
                )}
                {dog.health_dewormed && (
                  <span className="badge badge-health">🏥 Dewormed</span>
                )}
                {!dog.health_sterilised && !dog.health_vaccinated && !dog.health_dewormed && (
                  <span className="text-muted">Health information not available</span>
                )}
              </div>
            </div>

            {/* Personality Traits */}
            {(dog.energy_level || dog.temperament || dog.playfulness) && (
              <div className="details-card">
                <h3 className="details-card-title">Personality Traits</h3>
                <div className="details-chips">
                  {dog.energy_level && (
                    <span className="chip">
                      {dog.energy_level === 'high' ? '⚡' : dog.energy_level === 'medium' ? '🚶' : '😴'} 
                      {dog.energy_level.charAt(0).toUpperCase() + dog.energy_level.slice(1)} Energy
                    </span>
                  )}
                  {dog.temperament && (
                    <span className="chip">🎭 {dog.temperament.charAt(0).toUpperCase() + dog.temperament.slice(1)}</span>
                  )}
                  {dog.playfulness && (
                    <span className="chip">🎾 {dog.playfulness.charAt(0).toUpperCase() + dog.playfulness.slice(1)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Compatibility */}
            {(dog.compatibility_kids !== undefined || dog.compatibility_dogs !== undefined || dog.compatibility_cats !== undefined) && (
              <div className="details-card">
                <h3 className="details-card-title">Good With</h3>
                <div className="details-compatibility">
                  <div className="compatibility-item">
                    <span className="compatibility-icon">👶</span>
                    <span className="compatibility-label">Kids</span>
                    <span className={`compatibility-status ${dog.compatibility_kids ? 'yes' : 'no'}`}>
                      {dog.compatibility_kids ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="compatibility-item">
                    <span className="compatibility-icon">🐕</span>
                    <span className="compatibility-label">Dogs</span>
                    <span className={`compatibility-status ${dog.compatibility_dogs ? 'yes' : 'no'}`}>
                      {dog.compatibility_dogs ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="compatibility-item">
                    <span className="compatibility-icon">🐱</span>
                    <span className="compatibility-label">Cats</span>
                    <span className={`compatibility-status ${dog.compatibility_cats ? 'yes' : 'no'}`}>
                      {dog.compatibility_cats ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {dog.description && (
              <div className="details-card">
                <h3 className="details-card-title">About {displayName}</h3>
                <p className="details-description">{dog.description}</p>
              </div>
            )}

            {/* Special Needs */}
            {dog.special_needs && (
              <div className="details-card">
                <h3 className="details-card-title">Special Needs</h3>
                <p className="details-special-needs">{dog.special_needs}</p>
              </div>
            )}

            {/* Personality Tags */}
            {dog.personality_tags && dog.personality_tags.length > 0 && (
              <div className="details-card">
                <h3 className="details-card-title">Personality Tags</h3>
                <div className="details-chips">
                  {dog.personality_tags.map(tag => (
                    <span key={tag.id} className="chip">
                      {tag.tag_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner for User's Request */}
        {session && myRequest && (
          <div className={`status-banner status-banner--${
            myRequest.status === 'approved' ? 'ok' : 
            myRequest.status === 'pending' ? 'warn' : 
            'muted'
          }`}>
            {myRequest.status === 'pending' && (
              <>
                <h4>Your adoption request is pending</h4>
                <p>Your adoption request is pending with the caretaker. They will review it and get back to you soon.</p>
              </>
            )}
            {myRequest.status === 'approved' && (
              <>
                <h4>🎉 Your adoption request was approved!</h4>
                <p>Congratulations! The caretaker has approved your adoption request. Please contact them to arrange the next steps.</p>
                <div className="contact-info">
                  <div className="contact-item">
                    <strong>Name:</strong> 
                    <span>{dog?.posted_by || 'Caretaker'}</span>
                  </div>
                  <div className="contact-item">
                    <strong>Email:</strong> 
                    <span>Contact details will be provided</span>
                  </div>
                  <div className="contact-item">
                    <strong>Phone:</strong> 
                    <span>Contact details will be provided</span>
                  </div>
                </div>
              </>
            )}
            {myRequest.status === 'declined' && (
              <>
                <h4>Request declined</h4>
                <p>Unfortunately, your adoption request was declined by the caretaker. You can still submit a new request if you'd like.</p>
              </>
            )}
          </div>
        )}

        {/* Adoption Request Section */}
        <div className="details-card" style={{ marginTop: '32px' }}>
          <h3 className="details-card-title">Request Adoption</h3>
          
          {!session ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-light)' }}>
                Sign in to request adoption for this dog
              </p>
              <Link 
                to={`/login?redirect=/dogs/${dog.id}`} 
                className="btn btn--primary"
              >
                Sign In to Request Adoption
              </Link>
            </div>
          ) : isOwner ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: 0, color: 'var(--text-light)' }}>
                You posted this dog. Incoming requests appear in your Dashboard.
              </p>
              <Link to="/dashboard" className="btn btn--ghost" style={{ marginTop: '16px' }}>
                View Dashboard
              </Link>
            </div>
          ) : dog.status === 'adopted' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: 0, color: 'var(--text-light)' }}>
                This dog has already been adopted.
              </p>
            </div>
          ) : adoptionRequested ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--ok)', fontWeight: '500' }}>
                ✅ You've requested adoption for this dog
              </p>
              <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                Track your request in Dashboard → My Requests
              </p>
              <Link to="/dashboard" className="btn btn--ghost" style={{ marginTop: '16px' }}>
                View My Requests
              </Link>
            </div>
          ) : canRequestAdoption ? (
            <div>
              <div className="field">
                <label className="label" htmlFor="adoption-message">
                  Message to the caregiver (optional, 500 characters max)
                </label>
                <textarea
                  id="adoption-message"
                  className="textarea"
                  placeholder="Tell them why you'd be a great match for this dog..."
                  value={adoptionMessage}
                  onChange={(e) => setAdoptionMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-light)', textAlign: 'right' }}>
                  {adoptionMessage.length}/500
                </div>
              </div>
              <button
                className="btn btn--primary"
                onClick={handleAdoptionRequest}
                disabled={adoptionLoading}
                style={{ width: '100%' }}
              >
                {adoptionLoading ? 'Sending Request...' : 'Send Adoption Request'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: 0, color: 'var(--text-light)' }}>
                This dog is currently {dog.status}.
              </p>
            </div>
          )}
        </div>

        {/* Report Button Section - Subtle positioning */}
        <div style={{ 
          marginTop: '24px', 
          textAlign: 'right',
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          fontSize: '12px'
        }}>
          <ReportButton 
            dogId={dog.id} 
            caretakerUserId={dog.posted_by || ''} 
            currentUserId={userRow?.id}
          />
        </div>
      </div>
    </div>
  );
}
