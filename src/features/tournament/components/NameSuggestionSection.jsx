/**
 * @module TournamentSetup/NameSuggestionSection
 * @description Component for suggesting new cat names
 */

import { useState } from "react";
import { catNamesAPI } from "../../../integrations/supabase/api";
import { validateCatName, validateDescription } from "../../../shared/utils/validationUtils";
import styles from "../TournamentSetup.module.css";

function NameSuggestionSection() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nameValidation = validateCatName(name.trim());
    if (!nameValidation.success) {
      setError(nameValidation.error);
      return;
    }

    const descriptionValidation = validateDescription(description.trim());
    if (!descriptionValidation.success) {
      setError(descriptionValidation.error);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await catNamesAPI.addName(
        nameValidation.value,
        descriptionValidation.value
      );
      if (res?.success === false) {
        throw new Error(res.error || "Failed to add name");
      }
      setSuccess("Thank you for your suggestion!");
      setName("");
      setDescription("");
    } catch {
      setError("Failed to add name. It might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setDescription(e.target.value)}
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
          disabled={isSubmitting || !name.trim() || !description.trim()}
        >
          {isSubmitting ? "Submitting..." : "Submit Suggestion"}
        </button>
      </form>
    </div>
  );
}

export default NameSuggestionSection;

