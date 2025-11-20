/**
 * @module TournamentSetup/NameSuggestionSection
 * @description Component for suggesting new cat names
 */

import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { catNamesAPI } from "../../../integrations/supabase/api";
import {
  validateCatName,
  validateDescription,
} from "../../../shared/utils/validationUtils";
import { ErrorManager } from "../../../shared/services/errorManager";
import styles from "../TournamentSetup.module.css";

const NameSuggestionSection = memo(() => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // * Track mount state and cleanup timeout on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, []);

  const handleNameChange = useCallback(
    (e) => {
      setName(e.target.value);
      if (error) setError("");
    },
    [error],
  );

  const handleDescriptionChange = useCallback(
    (e) => {
      setDescription(e.target.value);
      if (error) setError("");
    },
    [error],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      setError("");
      setSuccess("");

      const trimmedName = name.trim();
      const trimmedDescription = description.trim();

      if (!trimmedName || !trimmedDescription) {
        return;
      }

      const nameValidation = validateCatName(trimmedName);
      if (!nameValidation.success) {
        setError(nameValidation.error);
        return;
      }

      const descriptionValidation = validateDescription(trimmedDescription);
      if (!descriptionValidation.success) {
        setError(descriptionValidation.error);
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await catNamesAPI.addName(
          nameValidation.value,
          descriptionValidation.value,
        );

        // * Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        if (res?.success === false) {
          throw new Error(res.error || "Failed to add name");
        }
        setSuccess("Thank you for your suggestion!");
        setName("");
        setDescription("");

        // * Clear success message after 5 seconds (with mount check)
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setSuccess("");
          }
          successTimeoutRef.current = null;
        }, 5000);
      } catch (err) {
        // * Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        setError("Failed to add name. It might already exist.");
        ErrorManager.handleError(err, "Add Name Suggestion", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });
      } finally {
        // * Only update submitting state if component is still mounted
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [name, description],
  );

  const isFormValid = useMemo(() => {
    return name.trim() && description.trim();
  }, [name, description]);

  return (
    <div className={styles.suggestionSection}>
      <h3 className={styles.suggestionTitle}>Suggest a Name 💡</h3>
      <p className={styles.suggestionDescription}>
        Help us expand the list by suggesting new cat names!
      </p>

      <form onSubmit={handleSubmit} className={styles.suggestionForm}>
        <div className={styles.formGroup}>
          <label htmlFor="name-input" className={styles.formLabel}>
            Name
          </label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g., Whiskers"
            className={styles.formInput}
            disabled={isSubmitting}
            maxLength={50}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description-input" className={styles.formLabel}>
            Description
          </label>
          <textarea
            id="description-input"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="A brief description of why this name is special"
            className={styles.formTextarea}
            disabled={isSubmitting}
            maxLength={500}
            rows={3}
            required
          />
        </div>

        {error && <div className={styles.formError}>{error}</div>}
        {success && <div className={styles.formSuccess}>{success}</div>}

        <button
          type="submit"
          className={styles.suggestionButton}
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? "Submitting..." : "Submit Suggestion"}
        </button>
      </form>
    </div>
  );
});

export default NameSuggestionSection;
