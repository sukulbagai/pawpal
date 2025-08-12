import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface PersonalityTag {
  id: number;
  tag_name: string;
}

interface TagMultiSelectProps {
  value: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
}

const TagMultiSelect: React.FC<TagMultiSelectProps> = ({ 
  value = [], 
  onChange, 
  disabled = false 
}) => {
  const [tags, setTags] = useState<PersonalityTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await api.get<PersonalityTag[]>('/tags/personality');
        setTags(response.data);
      } catch (err) {
        console.error('Failed to fetch personality tags:', err);
        setError('Failed to load personality tags');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const filteredTags = tags.filter(tag =>
    tag.tag_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTag = (tagId: number) => {
    if (disabled) return;

    if (value.includes(tagId)) {
      onChange(value.filter(id => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const isSelected = (tagId: number) => value.includes(tagId);

  if (loading) {
    return (
      <div className="tag-multiselect loading">
        <div className="spinner" />
        <p>Loading personality tags...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tag-multiselect error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className={`tag-multiselect ${disabled ? 'disabled' : ''}`}>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search personality tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="tag-search"
        />
      </div>

      <div className="selected-count">
        {value.length} tag{value.length !== 1 ? 's' : ''} selected
      </div>

      <div className="tags-grid">
        {filteredTags.length === 0 ? (
          <p className="no-tags">
            {searchTerm ? 'No tags match your search' : 'No tags available'}
          </p>
        ) : (
          filteredTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              className={`tag-option ${isSelected(tag.id) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag.id)}
              disabled={disabled}
            >
              <span className="tag-name">{tag.tag_name}</span>
              {isSelected(tag.id) && (
                <span className="checkmark">✓</span>
              )}
            </button>
          ))
        )}
      </div>

      {value.length > 0 && (
        <div className="selected-tags">
          <h4>Selected tags:</h4>
          <div className="selected-list">
            {value.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <span key={tagId} className="selected-tag">
                  {tag.tag_name}
                  <button
                    type="button"
                    className="remove-tag"
                    onClick={() => toggleTag(tagId)}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagMultiSelect;
