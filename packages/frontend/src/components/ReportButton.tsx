import React, { useState } from 'react';
import { api } from '../lib/api';

interface ReportButtonProps {
  dogId: string;
  caretakerUserId: string;
  currentUserId?: string;
}

interface ReportFormData {
  category: 'abuse' | 'spam' | 'wrong-info' | 'duplicate' | 'other';
  message: string;
  evidenceUrl: string;
}

const CATEGORIES = [
  { value: 'abuse', label: 'Abuse or harassment' },
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'wrong-info', label: 'Wrong information' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
] as const;

export function ReportButton({ dogId, caretakerUserId, currentUserId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    category: 'other',
    message: '',
    evidenceUrl: '',
  });

  // Don't show report button if user is the caretaker or not signed in
  if (!currentUserId || currentUserId === caretakerUserId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/reports', {
        target_type: 'dog',
        target_id: dogId,
        category: formData.category,
        message: formData.message || undefined,
        evidence_url: formData.evidenceUrl || undefined,
      });

      if (response.data.ok) {
        // Show success message
        alert('Report submitted successfully. Thank you for helping keep our community safe.');
        
        // Reset form and close
        setFormData({ category: 'other', message: '', evidenceUrl: '' });
        setIsOpen(false);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error: any) {
      console.error('Report submission error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to submit report. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{ 
          background: 'none',
          border: 'none',
          color: '#6b7280',
          fontSize: '13px',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: '4px 0',
          opacity: 0.8,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        title="Report inappropriate content"
      >
        ⚠️ Report
      </button>
    );
  }

  return (
    <div className="report-form">
      <div className="report-form__header">
        <h4>Report this listing</h4>
        <button
          onClick={() => setIsOpen(false)}
          className="report-form__close"
        >
          ×
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="report-form__form">
        <div className="field">
          <label className="label" htmlFor="report-category">
            What's the issue?
          </label>
          <select
            id="report-category"
            className="select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ReportFormData['category'] })}
            required
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="report-message">
            Details (optional)
          </label>
          <textarea
            id="report-message"
            className="textarea"
            placeholder="Provide additional details about the issue..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="report-evidence">
            Evidence URL (optional)
          </label>
          <input
            id="report-evidence"
            type="url"
            className="input"
            placeholder="Link to supporting evidence..."
            value={formData.evidenceUrl}
            onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
          />
        </div>

        <div className="report-form__actions">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn btn--ghost btn--small"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--danger btn--small"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
