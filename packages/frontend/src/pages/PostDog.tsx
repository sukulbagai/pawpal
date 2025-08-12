import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import ImageUploader from '../components/ImageUploader';
import TagMultiSelect from '../components/TagMultiSelect';
import './PostDog.css';

interface DogFormData {
  name: string;
  age_years: string;
  gender: 'male' | 'female' | 'unknown';
  description: string;
  area: string;
  location_lat?: number;
  location_lng?: number;
  health_sterilised: boolean;
  health_vaccinated: boolean;
  health_dewormed: boolean;
  microchip_id: string;
  compatibility_kids?: boolean;
  compatibility_dogs?: boolean;
  compatibility_cats?: boolean;
  energy_level: string;
  temperament: string;
  playfulness: string;
  special_needs: string;
  personality_tag_ids: number[];
  images: string[];
}

const PostDog: React.FC = () => {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<DogFormData>({
    name: '',
    age_years: '',
    gender: 'unknown',
    description: '',
    area: '',
    health_sterilised: false,
    health_vaccinated: false,
    health_dewormed: false,
    microchip_id: '',
    energy_level: '',
    temperament: '',
    playfulness: '',
    special_needs: '',
    personality_tag_ids: [],
    images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Redirect if not logged in
  if (!session) {
    return (
      <div className="post-dog-page">
        <div className="auth-required">
          <h2>🔒 Authentication Required</h2>
          <p>Please log in to post a dog for adoption.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof DogFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude
        }));
        setLocationStatus('success');
        setTimeout(() => setLocationStatus('idle'), 3000);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');
        setTimeout(() => setLocationStatus('idle'), 3000);
        
        let message = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.area.trim()) {
      newErrors.area = 'Area is required';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least 1 image is required';
    }

    if (formData.images.length > 6) {
      newErrors.images = 'Maximum 6 images allowed';
    }

    // Optional field validations
    if (formData.name && formData.name.length > 80) {
      newErrors.name = 'Name must be 80 characters or less';
    }

    if (formData.age_years && (parseInt(formData.age_years) < 0 || parseInt(formData.age_years) > 25)) {
      newErrors.age_years = 'Age must be between 0 and 25 years';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    if (formData.area && formData.area.length > 120) {
      newErrors.area = 'Area must be 120 characters or less';
    }

    if (formData.special_needs && formData.special_needs.length > 200) {
      newErrors.special_needs = 'Special needs must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare data for API
      const submitData = {
        name: formData.name.trim() || undefined,
        age_years: formData.age_years ? parseInt(formData.age_years) : undefined,
        gender: formData.gender,
        description: formData.description.trim() || undefined,
        area: formData.area.trim(),
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        health_sterilised: formData.health_sterilised,
        health_vaccinated: formData.health_vaccinated,
        health_dewormed: formData.health_dewormed,
        microchip_id: formData.microchip_id.trim() || undefined,
        compatibility_kids: formData.compatibility_kids,
        compatibility_dogs: formData.compatibility_dogs,
        compatibility_cats: formData.compatibility_cats,
        energy_level: formData.energy_level.trim() || undefined,
        temperament: formData.temperament.trim() || undefined,
        playfulness: formData.playfulness.trim() || undefined,
        special_needs: formData.special_needs.trim() || undefined,
        personality_tag_ids: formData.personality_tag_ids,
        images: formData.images
      };

      const response = await api.post('/dogs', submitData);
      
      if (response.status === 201) {
        alert('Dog posted successfully! 🎉');
        navigate('/');
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error: any) {
      console.error('Failed to create dog:', error);
      
      let message = 'Failed to post dog. Please try again.';
      if (error.response?.data?.details) {
        message = 'Validation errors: ' + error.response.data.details.map((d: any) => d.message).join(', ');
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-dog-page">
      <div className="post-dog-container">
        <h1>🐕 Post a Dog for Adoption</h1>
        <p>Help a street dog find a loving home by posting their details here.</p>

        <form onSubmit={handleSubmit} className="dog-form">
          {/* Basic Information */}
          <section className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="name">Dog Name (Optional)</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Buddy"
                maxLength={80}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age (Optional)</label>
                <input
                  type="number"
                  id="age"
                  value={formData.age_years}
                  onChange={(e) => handleInputChange('age_years', e.target.value)}
                  placeholder="Years"
                  min="0"
                  max="25"
                  disabled={isSubmitting}
                />
                {errors.age_years && <span className="error">{errors.age_years}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about this dog's personality, behavior, and any other relevant details..."
                rows={4}
                maxLength={1000}
                disabled={isSubmitting}
              />
              <div className="char-count">{formData.description.length}/1000</div>
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
          </section>

          {/* Location */}
          <section className="form-section">
            <h2>Location</h2>
            
            <div className="form-group">
              <label htmlFor="area">Area/Locality *</label>
              <input
                type="text"
                id="area"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="e.g., Connaught Place, Delhi"
                maxLength={120}
                required
                disabled={isSubmitting}
              />
              {errors.area && <span className="error">{errors.area}</span>}
            </div>

            <div className="location-controls">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isSubmitting || locationStatus === 'loading'}
                className={`btn-secondary location-btn ${locationStatus}`}
              >
                {locationStatus === 'loading' && '⏳ Getting location...'}
                {locationStatus === 'success' && '✅ Location saved!'}
                {locationStatus === 'error' && '❌ Location failed'}
                {locationStatus === 'idle' && '📍 Use my location'}
              </button>
              
              {formData.location_lat && formData.location_lng && (
                <span className="location-coords">
                  📍 {formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)}
                </span>
              )}
            </div>
          </section>

          {/* Health Information */}
          <section className="form-section">
            <h2>Health Information</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.health_sterilised}
                  onChange={(e) => handleInputChange('health_sterilised', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                Sterilized/Spayed/Neutered
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.health_vaccinated}
                  onChange={(e) => handleInputChange('health_vaccinated', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                Vaccinated
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.health_dewormed}
                  onChange={(e) => handleInputChange('health_dewormed', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                Dewormed
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="microchip">Microchip ID (Optional)</label>
              <input
                type="text"
                id="microchip"
                value={formData.microchip_id}
                onChange={(e) => handleInputChange('microchip_id', e.target.value)}
                placeholder="e.g., 123456789012345"
                maxLength={80}
                disabled={isSubmitting}
              />
            </div>
          </section>

          {/* Compatibility */}
          <section className="form-section">
            <h2>Compatibility</h2>
            
            <div className="compatibility-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.compatibility_kids === true}
                  onChange={(e) => handleInputChange('compatibility_kids', e.target.checked ? true : undefined)}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                Good with kids
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.compatibility_dogs === true}
                  onChange={(e) => handleInputChange('compatibility_dogs', e.target.checked ? true : undefined)}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                Good with other dogs
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.compatibility_cats === true}
                  onChange={(e) => handleInputChange('compatibility_cats', e.target.checked ? true : undefined)}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                Good with cats
              </label>
            </div>
          </section>

          {/* Personality */}
          <section className="form-section">
            <h2>Personality & Behavior</h2>
            
            <div className="form-group">
              <label htmlFor="energy">Energy Level (Optional)</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="energy_level"
                    value="low"
                    checked={formData.energy_level === 'low'}
                    onChange={(e) => handleInputChange('energy_level', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span className="radio-mark"></span>
                  Low - Calm and relaxed
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="energy_level"
                    value="medium"
                    checked={formData.energy_level === 'medium'}
                    onChange={(e) => handleInputChange('energy_level', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span className="radio-mark"></span>
                  Medium - Moderately active
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="energy_level"
                    value="high"
                    checked={formData.energy_level === 'high'}
                    onChange={(e) => handleInputChange('energy_level', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span className="radio-mark"></span>
                  High - Very energetic and playful
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="temperament">Temperament (Optional)</label>
                <input
                  type="text"
                  id="temperament"
                  value={formData.temperament}
                  onChange={(e) => handleInputChange('temperament', e.target.value)}
                  placeholder="e.g., Friendly, Shy, Protective"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="playfulness">Playfulness (Optional)</label>
                <input
                  type="text"
                  id="playfulness"
                  value={formData.playfulness}
                  onChange={(e) => handleInputChange('playfulness', e.target.value)}
                  placeholder="e.g., Very playful, Prefers quiet time"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="special-needs">Special Needs (Optional)</label>
              <textarea
                id="special-needs"
                value={formData.special_needs}
                onChange={(e) => handleInputChange('special_needs', e.target.value)}
                placeholder="Any medical conditions, dietary requirements, or special care needed..."
                rows={3}
                maxLength={200}
                disabled={isSubmitting}
              />
              <div className="char-count">{formData.special_needs.length}/200</div>
              {errors.special_needs && <span className="error">{errors.special_needs}</span>}
            </div>
          </section>

          {/* Personality Tags */}
          <section className="form-section">
            <h2>Personality Tags</h2>
            <p>Select tags that best describe this dog's personality (optional)</p>
            
            <TagMultiSelect
              value={formData.personality_tag_ids}
              onChange={(tagIds) => handleInputChange('personality_tag_ids', tagIds)}
              disabled={isSubmitting}
            />
          </section>

          {/* Images */}
          <section className="form-section">
            <h2>Photos *</h2>
            <p>Upload 1-6 photos of the dog. Good photos help dogs get adopted faster!</p>
            
            <ImageUploader
              value={formData.images}
              onChange={(urls) => handleInputChange('images', urls)}
              disabled={isSubmitting}
            />
            {errors.images && <span className="error">{errors.images}</span>}
          </section>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || formData.images.length === 0}
            >
              {isSubmitting ? '⏳ Posting Dog...' : '🚀 Post Dog for Adoption'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostDog;
