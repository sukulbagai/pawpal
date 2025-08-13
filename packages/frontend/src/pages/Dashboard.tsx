import { useState, useEffect } from 'react';
import { Tabs } from '../components/Tabs';
import { RequestItem } from '../components/RequestItem';
import { Empty } from '../components/Empty';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';

interface AdoptionRequest {
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
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState<AdoptionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const tabs = [
    { id: 'incoming', label: 'Incoming Requests' },
    { id: 'outgoing', label: 'My Requests' },
  ];

  // Calculate counts for tab chips
  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending').length;
  const pendingOutgoing = outgoingRequests.filter(r => r.status === 'pending').length;
  const counts = {
    incoming: pendingIncoming,
    outgoing: pendingOutgoing,
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      const [incomingResponse, outgoingResponse] = await Promise.all([
        api.get('/adoptions/incoming'),
        api.get('/adoptions/outgoing')
      ]);

      setIncomingRequests(incomingResponse.data.items || []);
      setOutgoingRequests(outgoingResponse.data.items || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      showError('Failed to load adoption requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      
      await api.patch(`/adoptions/${requestId}`, {
        status: 'approved'
      });

      showSuccess('Adoption request approved! 🎉');
      await loadRequests(); // Reload to get updated data
    } catch (error) {
      console.error('Error approving request:', error);
      showError('Failed to approve request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      
      await api.patch(`/adoptions/${requestId}`, {
        status: 'declined'
      });

      showSuccess('Adoption request declined.');
      await loadRequests(); // Reload to get updated data
    } catch (error) {
      console.error('Error declining request:', error);
      showError('Failed to decline request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Manage your adoption requests</p>
        </div>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Manage your adoption requests</p>
      </div>

      <Tabs 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {currentRequests.length === 0 ? (
        <Empty
          icon={activeTab === 'incoming' ? '📨' : '📤'}
          title={activeTab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
          message={
            activeTab === 'incoming'
              ? 'When people request adoption for your dogs, they will appear here.'
              : 'Your adoption requests for other dogs will appear here.'
          }
        />
      ) : (
        <div>
          {currentRequests.map(request => (
            <RequestItem
              key={request.id}
              type={activeTab as 'incoming' | 'outgoing'}
              request={request}
              onApprove={activeTab === 'incoming' ? handleApprove : undefined}
              onDecline={activeTab === 'incoming' ? handleDecline : undefined}
              loading={actionLoading === request.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
