import { Link } from 'react-router-dom';

interface DogCardProps {
  id: string;
  name?: string;
  area?: string;
  images?: string[];
  health_sterilised?: boolean;
  health_vaccinated?: boolean;
  energy_level?: string;
  status: 'available' | 'pending' | 'adopted';
}

export default function DogCard({
  id,
  name,
  area,
  images,
  health_sterilised,
  health_vaccinated,
  energy_level,
  status
}: DogCardProps) {
  const displayName = name || 'Unnamed';
  const displayImage = images?.[0] || 'https://picsum.photos/seed/pawpal-default/640/480';

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'available':
        return { emoji: '💚', text: 'Available' };
      case 'pending':
        return { emoji: '🟡', text: 'Pending' };
      case 'adopted':
        return { emoji: '💜', text: 'Adopted' };
      default:
        return { emoji: '🔍', text: status };
    }
  };

  const statusDisplay = getStatusDisplay(status);

  return (
    <div className="dog-card">
      <div className="dog-card-image">
        <img 
          src={displayImage} 
          alt={displayName}
          loading="lazy"
        />
        <div className="dog-card-status">
          <span className={`badge badge-${status}`}>
            {statusDisplay.emoji} {statusDisplay.text}
          </span>
        </div>
      </div>
      
      <div className="dog-card-content">
        <h3 className="dog-card-name">{displayName}</h3>
        {area && (
          <div className="dog-card-area">
            <span>📍</span>
            <span>{area}</span>
          </div>
        )}
        
        <div className="dog-card-badges">
          {health_sterilised && (
            <span className="badge badge-health">✨ Sterilised</span>
          )}
          {health_vaccinated && (
            <span className="badge badge-health">💉 Vaccinated</span>
          )}
          {energy_level && (
            <span className="badge badge-energy">
              {energy_level === 'high' ? '⚡' : energy_level === 'medium' ? '🚶' : '😴'} 
              {energy_level.charAt(0).toUpperCase() + energy_level.slice(1)} Energy
            </span>
          )}
        </div>

        <div className="dog-card-actions">
          <Link to={`/dogs/${id}`} className="dog-card-link">
            View profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
