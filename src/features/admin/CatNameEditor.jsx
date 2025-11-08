/**
 * @module CatNameEditor
 * @description Admin component for editing the cat's chosen name
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Error } from '../../shared/components';
import { Form, Input } from '../../shared/components/Form';
import { siteSettingsAPI } from '../../integrations/supabase/api';
import { validateNameData, formatFullName } from '../../shared/utils/nameFormatter';
import styles from './CatNameEditor.module.css';

const GREETING_SUGGESTIONS = [
  'Hello! My name is',
  'Hi! I\'m',
  'Meow! They call me',
  'Hey there! I\'m'
];

function CatNameEditor({ userName, onUpdate }) {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_names: [],
    last_name: '',
    greeting_text: 'Hello! My name is',
    show_banner: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [middleNameInput, setMiddleNameInput] = useState('');

  useEffect(() => {
    loadCatName();
  }, []);

  const loadCatName = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await siteSettingsAPI.getCatChosenName();
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          middle_names: data.middle_names || [],
          last_name: data.last_name || '',
          greeting_text: data.greeting_text || 'Hello! My name is',
          show_banner: data.show_banner !== false
        });
      }
    } catch (err) {
      setError('Failed to load cat name: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleAddMiddleName = () => {
    const trimmed = middleNameInput.trim();
    if (trimmed && !formData.middle_names.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        middle_names: [...prev.middle_names, trimmed]
      }));
      setMiddleNameInput('');
    }
  };

  const handleRemoveMiddleName = (index) => {
    setFormData(prev => ({
      ...prev,
      middle_names: prev.middle_names.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    const validation = validateNameData(formData);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsSaving(true);
    
    try {
      const result = await siteSettingsAPI.updateCatChosenName(formData, userName);
      
      if (result.success) {
        setSuccess('✅ Cat name saved successfully!');
        if (onUpdate) {
          onUpdate(result.data);
        }
      } else {
        setError(result.error || 'Failed to save cat name');
      }
    } catch (err) {
      setError('Error saving cat name: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const previewName = formatFullName(formData);

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <p>Loading cat name...</p>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>🐱 Cat's Name Tag</h2>
        <p className={styles.subtitle}>
          Set the name that your cat will introduce themselves with
        </p>
      </div>

      {error && <Error message={error} />}
      {success && <div className={styles.success}>{success}</div>}

      <Form className={styles.form}>
        <Input
          label="First Name *"
          value={formData.first_name}
          onChange={(e) => handleInputChange('first_name', e.target.value)}
          placeholder="e.g., Shadow"
          required
        />

        <div className={styles.middleNamesSection}>
          <label className={styles.label}>Middle Names (optional)</label>
          <div className={styles.middleNameInput}>
            <Input
              value={middleNameInput}
              onChange={(e) => setMiddleNameInput(e.target.value)}
              placeholder="e.g., Midnight"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMiddleName();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddMiddleName}
              disabled={!middleNameInput.trim()}
            >
              Add
            </Button>
          </div>
          
          {formData.middle_names.length > 0 && (
            <div className={styles.middleNamesList}>
              {formData.middle_names.map((name, index) => (
                <span key={index} className={styles.middleNameTag}>
                  {name}
                  <button
                    type="button"
                    onClick={() => handleRemoveMiddleName(index)}
                    className={styles.removeButton}
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Last Name (optional)"
          value={formData.last_name}
          onChange={(e) => handleInputChange('last_name', e.target.value)}
          placeholder="e.g., Whiskers"
        />

        <div>
          <label className={styles.label}>Greeting Text</label>
          <Input
            value={formData.greeting_text}
            onChange={(e) => handleInputChange('greeting_text', e.target.value)}
            placeholder="Hello! My name is"
          />
          <div className={styles.suggestions}>
            {GREETING_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.suggestionButton}
                onClick={() => handleInputChange('greeting_text', suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.show_banner}
            onChange={(e) => handleInputChange('show_banner', e.target.checked)}
          />
          Show name tag on home page
        </label>

        {previewName && (
          <div className={styles.preview}>
            <p className={styles.previewLabel}>Preview:</p>
            <div className={styles.previewNameTag}>
              <div className={styles.previewHello}>HELLO</div>
              <div className={styles.previewGreeting}>{formData.greeting_text}</div>
              <div className={styles.previewName}>{previewName}</div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.first_name.trim()}
            variant="primary"
          >
            {isSaving ? 'Saving...' : 'Save Cat Name'}
          </Button>
        </div>
      </Form>
    </Card>
  );
}

CatNameEditor.propTypes = {
  userName: PropTypes.string.isRequired,
  onUpdate: PropTypes.func
};

export default CatNameEditor;
