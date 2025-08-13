import React, { useState, useEffect } from 'react';
import { Tabs } from '../components/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '../components/Tables';
import { Empty } from '../components/Empty';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';

interface Report {
  id: string;
  category: string;
  message: string | null;
  evidence_url: string | null;
  status: 'open' | 'actioned' | 'dismissed';
  created_at: string;
  dog: {
    id: string;
    name: string;
    area: string;
    images: string[];
    status: string;
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

interface Dog {
  id: string;
  name: string;
  area: string;
  images: string[];
  status: 'available' | 'pending' | 'adopted';
  is_hidden?: boolean;
  deleted_at?: string | null;
  created_at: string;
  posted_by: string;
}

interface ActionModalProps {
  type: 'report' | 'dog';
  item: Report | Dog;
  onClose: () => void;
  onAction: (action: string, notes?: string, meta?: any) => Promise<void>;
}

function ActionModal({ type, item, onClose, onAction }: ActionModalProps) {
  const [selectedAction, setSelectedAction] = useState('');
  const [notes, setNotes] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('available');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    setIsSubmitting(true);
    try {
      const meta = selectedAction === 'override-status' ? { status: overrideStatus } : undefined;
      await onAction(selectedAction, notes || undefined, meta);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionOptions = () => {
    if (type === 'report') {
      return [
        { value: 'hide-dog', label: 'Hide Dog' },
        { value: 'unhide-dog', label: 'Unhide Dog' },
        { value: 'soft-delete-dog', label: 'Soft Delete Dog' },
        { value: 'override-status', label: 'Override Status' },
        { value: 'dismiss', label: 'Dismiss Report' },
      ];
    } else {
      const dog = item as Dog;
      const options = [];
      
      if (!dog.is_hidden) {
        options.push({ value: 'hide', label: 'Hide Dog' });
      } else {
        options.push({ value: 'unhide', label: 'Unhide Dog' });
      }
      
      if (!dog.deleted_at) {
        options.push({ value: 'soft-delete', label: 'Soft Delete' });
      }
      
      return options;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Take Action</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Action</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Select an action</option>
              {getActionOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedAction === 'override-status' && (
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="form-input"
                required
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="adopted">Adopted</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Add notes about this action..."
              maxLength={500}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!selectedAction || isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Execute Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusPill({ status, type }: { status: string; type: 'report' | 'dog' }) {
  const getClassName = () => {
    if (type === 'report') {
      switch (status) {
        case 'open': return 'pill pill--open';
        case 'actioned': return 'pill pill--actioned';
        case 'dismissed': return 'pill pill--dismissed';
        default: return 'pill';
      }
    } else {
      switch (status) {
        case 'available': return 'pill pill--actioned';
        case 'pending': return 'pill pill--open';
        case 'adopted': return 'pill pill--dismissed';
        default: return 'pill';
      }
    }
  };

  return <span className={getClassName()}>{status}</span>;
}

function VisibilityPill({ dog }: { dog: Dog }) {
  if (dog.deleted_at) {
    return <span className="pill pill--deleted">Deleted</span>;
  }
  if (dog.is_hidden) {
    return <span className="pill pill--hidden">Hidden</span>;
  }
  return null;
}

export default function Admin() {
  const { userRow } = useAuthStore();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ type: 'report' | 'dog'; item: Report | Dog } | null>(null);

  // Check if user is admin
  if (userRow?.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else {
      fetchDogs();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports?status=open&limit=100');
      setReports(response.data.items || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      console.error('Response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchDogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dogs?includeHidden=1&includeDeleted=1&limit=100');
      setDogs(response.data.items || []);
    } catch (error: any) {
      console.error('Error fetching dogs:', error);
      console.error('Response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: string, notes?: string, meta?: any) => {
    try {
      await api.patch(`/admin/reports/${reportId}`, { action, notes, meta });
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'success', message: 'Action completed successfully' },
      }));
      fetchReports(); // Refresh the list
    } catch (error: any) {
      console.error('Report action error:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'error', message: error.response?.data?.error?.message || 'Failed to execute action' },
      }));
      throw error;
    }
  };

  const handleDogAction = async (dogId: string, action: string) => {
    try {
      let endpoint: string;
      let body: any;

      if (action === 'hide' || action === 'unhide' || action === 'soft-delete') {
        endpoint = `/admin/dogs/${dogId}/visibility`;
        body = { op: action };
      } else {
        // Status override
        endpoint = `/admin/dogs/${dogId}/status`;
        body = { status: action };
      }

      await api.patch(endpoint, body);

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'success', message: 'Action completed successfully' },
      }));
      fetchDogs(); // Refresh the list
    } catch (error: any) {
      console.error('Dog action error:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'error', message: error.response?.data?.error?.message || 'Failed to execute action' },
      }));
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1>Admin Dashboard</h1>
      
      <Tabs
        tabs={[
          { id: 'reports', label: 'Reports' },
          { id: 'dogs', label: 'Dogs' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{ reports: reports.length, dogs: dogs.length }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'reports' && (
            <div className="admin-section">
              <h2>Content Reports</h2>
              {reports.length === 0 ? (
                <Empty
                  icon="📝"
                  title="No open reports"
                  message="No pending reports to review at this time."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Reported Dog</TH>
                      <TH>Category</TH>
                      <TH>Reporter</TH>
                      <TH>Message</TH>
                      <TH>Date</TH>
                      <TH>Status</TH>
                      <TH>Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {reports.map((report) => (
                      <TR key={report.id}>
                        <TD>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {report.dog.images[0] && (
                              <img
                                src={report.dog.images[0]}
                                alt={report.dog.name || 'Dog'}
                                style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: '500' }}>{report.dog.name || 'Unnamed'}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{report.dog.area}</div>
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <span style={{ textTransform: 'capitalize' }}>{report.category}</span>
                        </TD>
                        <TD>
                          <div>
                            <div style={{ fontWeight: '500' }}>{report.reporter.name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{report.reporter.email}</div>
                          </div>
                        </TD>
                        <TD>{truncateText(report.message, 50)}</TD>
                        <TD>{formatDate(report.created_at)}</TD>
                        <TD>
                          <StatusPill status={report.status} type="report" />
                        </TD>
                        <TD>
                          <div className="actions">
                            <button
                              onClick={() => setActionModal({ type: 'report', item: report })}
                              className="btn-sm btn-primary"
                            >
                              Action
                            </button>
                            {report.evidence_url && (
                              <a
                                href={report.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-sm btn-secondary"
                              >
                                Evidence
                              </a>
                            )}
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          )}

          {activeTab === 'dogs' && (
            <div className="admin-section">
              <h2>All Dogs</h2>
              {dogs.length === 0 ? (
                <Empty
                  icon="🐕"
                  title="No dogs found"
                  message="No dogs in the system at this time."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Dog</TH>
                      <TH>Status</TH>
                      <TH>Visibility</TH>
                      <TH>Posted</TH>
                      <TH>Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {dogs.map((dog) => (
                      <TR key={dog.id}>
                        <TD>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {dog.images[0] && (
                              <img
                                src={dog.images[0]}
                                alt={dog.name || 'Dog'}
                                style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: '500' }}>{dog.name || 'Unnamed'}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{dog.area}</div>
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <StatusPill status={dog.status} type="dog" />
                        </TD>
                        <TD>
                          <VisibilityPill dog={dog} />
                        </TD>
                        <TD>{formatDate(dog.created_at)}</TD>
                        <TD>
                          <div className="actions">
                            <button
                              onClick={() => setActionModal({ type: 'dog', item: dog })}
                              className="btn-sm btn-primary"
                            >
                              Action
                            </button>
                            <a
                              href={`/dogs/${dog.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-sm btn-secondary"
                            >
                              View
                            </a>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          )}
        </>
      )}

      {actionModal && (
        <ActionModal
          type={actionModal.type}
          item={actionModal.item}
          onClose={() => setActionModal(null)}
          onAction={async (action, notes, meta) => {
            if (actionModal.type === 'report') {
              await handleReportAction(actionModal.item.id, action, notes, meta);
            } else {
              await handleDogAction(actionModal.item.id, action);
            }
          }}
        />
      )}
    </div>
  );
}
