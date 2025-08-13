// Simple time formatting without external dependencies
function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

interface RequestItemProps {
  type: 'incoming' | 'outgoing';
  request: {
    id: string;
    message: string | null;
    status: 'pending' | 'approved' | 'declined' | 'cancelled';
    created_at: string;
    dog: {
      id: string;
      name: string | null;
      area: string;
      images: string[];
      status: 'available' | 'pending' | 'adopted';
    };
    adopter?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
    owner?: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
    caretaker?: {
      name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    contact_visible?: boolean;
  };
  onApprove?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  loading?: boolean;
}

export function RequestItem({ 
  type, 
  request, 
  onApprove, 
  onDecline, 
  loading = false 
}: RequestItemProps) {
  const contact = type === 'incoming' ? request.adopter : request.owner;
  const dogImage = request.dog.images[0] || '/placeholder-dog.jpg';

  return (
    <div className="adoption-request-card">
      {/* Caretaker Contact Card for Approved Outgoing Requests */}
      {type === 'outgoing' && request.status === 'approved' && request.caretaker && (
        <div className="contact-card">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
            🎉 Caretaker Contact
          </h4>
          <div style={{ fontSize: '14px' }}>
            <strong>{request.caretaker.name || 'Caretaker'}</strong>
            {request.caretaker.email && (
              <>
                <br />
                <a href={`mailto:${request.caretaker.email}`}>
                  📧 {request.caretaker.email}
                </a>
              </>
            )}
            {request.caretaker.phone && (
              <>
                <br />
                <a href={`tel:${request.caretaker.phone}`}>
                  📞 {request.caretaker.phone}
                </a>
              </>
            )}
            <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.8 }}>
              Use email/phone to coordinate adoption.
            </div>
          </div>
        </div>
      )}

      <div className="adoption-request-header">
        <div className="adoption-request-info">
          <h3 className="adoption-request-title">
            {request.dog.name || 'Unnamed Dog'} • {request.dog.area}
          </h3>
          <p className="adoption-request-meta">
            {type === 'incoming' ? 'Request from' : 'Request to caretaker'}{' '}
            {contact?.name || 'Unknown User'} •{' '}
            {formatTimeAgo(request.created_at)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={dogImage} 
            alt={request.dog.name || 'Dog'}
            className="list-item-avatar"
          />
          <div className={`status-badge status-badge--${request.status}`}>
            {request.status}
          </div>
        </div>
      </div>

      {request.message && (
        <div className="adoption-request-message">
          "{request.message}"
        </div>
      )}

      {request.contact_visible && contact && (
        <div className="adoption-request-contact">
          <h4 className="adoption-request-contact-title">
            {type === 'outgoing' ? 'Caretaker Contact Information' : 'Adopter Contact Information'}
          </h4>
          <div className="adoption-request-contact-info">
            <strong>{contact.name || (type === 'outgoing' ? 'Caretaker' : 'Adopter')}</strong>
            {contact.email && (
              <>
                <br />
                Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </>
            )}
            {contact.phone && (
              <>
                <br />
                Phone: <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              </>
            )}
          </div>
        </div>
      )}

      {type === 'incoming' && request.status === 'pending' && (
        <div className="adoption-request-actions">
          <button
            className="btn btn--success btn--small"
            onClick={() => onApprove?.(request.id)}
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
          <button
            className="btn btn--danger btn--small"
            onClick={() => onDecline?.(request.id)}
            disabled={loading}
          >
            {loading ? 'Declining...' : 'Decline'}
          </button>
        </div>
      )}

      {request.status === 'approved' && (
        <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
            🎉 {type === 'outgoing' ? 'Adoption request approved! Contact the caretaker to arrange next steps.' : 'Request approved! Contact details are now visible to both parties.'}
          </p>
        </div>
      )}

      {request.status === 'declined' && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
            ❌ Request was declined.
          </p>
        </div>
      )}
    </div>
  );
}
