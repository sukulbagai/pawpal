import './DogCard.css';

interface DogCardProps {
  name?: string;
  area?: string;
  cover?: string;
  sterilised?: boolean;
  vaccinated?: boolean;
  status: 'available' | 'pending' | 'adopted';
}

export default function DogCard({
  name,
  area,
  cover,
  sterilised,
  vaccinated,
  status
}: DogCardProps) {
  const displayName = name || 'Unnamed';
  const displayImage = cover || 'https://picsum.photos/seed/pawpal-default/640/480';

  return (
    <div className="dog-card">
      <div className="dog-card-image">
        <img 
          src={displayImage} 
          alt={displayName}
          loading="lazy"
        />
        <div className={`status-pill ${status}`}>
          {status === 'available' ? '🟢' : status === 'pending' ? '🟡' : '🔴'} 
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
      
      <div className="dog-card-content">
        <h3 className="dog-name">{displayName}</h3>
        {area && <p className="dog-area">📍 {area}</p>}
        
        <div className="dog-badges">
          {sterilised && (
            <span className="badge health">✅ Sterilised</span>
          )}
          {vaccinated && (
            <span className="badge health">💉 Vaccinated</span>
          )}
        </div>
      </div>
    </div>
  );
}
