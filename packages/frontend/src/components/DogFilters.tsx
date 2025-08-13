import { useState } from 'react';
import { DogListQuery, createDefaultQuery } from '../lib/query';

interface DogFiltersProps {
  value: DogListQuery;
  onChange: (query: DogListQuery) => void;
}

export default function DogFilters({ value, onChange }: DogFiltersProps) {
  // Local state for form controls
  const [formData, setFormData] = useState<DogListQuery>(value);

  const handleInputChange = (field: keyof DogListQuery, newValue: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: newValue === false ? undefined : newValue,
    }));
  };

  const handleApply = () => {
    // Reset offset when applying new filters
    onChange({
      ...formData,
      offset: 0,
    });
  };

  const handleClear = () => {
    const defaultQuery = createDefaultQuery();
    setFormData(defaultQuery);
    onChange(defaultQuery);
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar-content">
        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="search-input" className="filter-label">
            Search
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Search by name or area"
            value={formData.q || ''}
            onChange={(e) => handleInputChange('q', e.target.value || undefined)}
            className="filter-input"
          />
        </div>

        {/* Energy Level Select */}
        <div className="filter-group">
          <label htmlFor="energy-select" className="filter-label">
            Energy
          </label>
          <select
            id="energy-select"
            value={formData.energy || ''}
            onChange={(e) => handleInputChange('energy', e.target.value || undefined)}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Status Select */}
        <div className="filter-group">
          <label htmlFor="status-select" className="filter-label">
            Status
          </label>
          <select
            id="status-select"
            value={formData.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value || undefined)}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="adopted">Adopted</option>
          </select>
        </div>

        {/* Compatibility Checkboxes */}
        <div className="filter-group">
          <span className="filter-label">Good with</span>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.compatKids === true}
                onChange={(e) => handleInputChange('compatKids', e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Kids</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.compatDogs === true}
                onChange={(e) => handleInputChange('compatDogs', e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Dogs</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.compatCats === true}
                onChange={(e) => handleInputChange('compatCats', e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Cats</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions">
          <button 
            type="button" 
            onClick={handleApply}
            className="filter-button filter-button-primary"
          >
            Apply
          </button>
          <button 
            type="button" 
            onClick={handleClear}
            className="filter-button filter-button-secondary"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
