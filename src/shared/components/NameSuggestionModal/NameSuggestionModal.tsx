/**
 * @module NameSuggestionModal
 * @description Modal component for suggesting new cat names
 */

import { useState, useCallback, useId, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { catNamesAPI } from "../../services/supabase/api";
import {
  validateCatName,
  validateDescription,
} from "../../utils/validationUtils";
import { ErrorManager } from "../../services/errorManager";
import useAppStore from "../../../core/store/useAppStore";
import LiquidGlass from "../LiquidGlass";
import "./NameSuggestionModal.css";

/**
 * Modal component for suggesting new cat names
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 */
export function NameSuggestionModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const modalGlassId = useId();

  // * Get current user name from store for RLS context
  const userName = useAppStore((state) => state.user.name);

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

  // * Focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // * Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
        setError(nameValidation.error || "Invalid name");
        return;
      }

      const descriptionValidation = validateDescription(trimmedDescription);
      if (!descriptionValidation.success) {
        setError(descriptionValidation.error || "Invalid description");
        return;
      }

      // * Check if user is logged in
      if (!userName || !userName.trim()) {
        setError("Please log in to suggest a name.");
        return;
      }

      try {
        setIsSubmitting(true);
        // * Pass userName to set RLS context before inserting
        const res = await catNamesAPI.addName(
          nameValidation.value || trimmedName,
          descriptionValidation.value || trimmedDescription,
          userName || "",
        );

        // * Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        if (res?.success === false) {
          // * Preserve the actual error message from the API response
          const apiError = res.error || "Failed to add name";
          throw new Error(apiError);
        }
        setSuccess("Thank you for your suggestion!");
        setName("");
        setDescription("");

        // * Clear success message after 3 seconds, then close modal
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setSuccess("");
            onClose();
          }
          successTimeoutRef.current = null;
        }, 3000);
      } catch (err) {
        // * Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        // * Show the actual error message from the API
        const errorObj = err as { message?: string; error?: string } | null;
        const errorMessage =
          errorObj?.message || errorObj?.error || "Failed to add name. Please try again.";
        setError(errorMessage);
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
    [name, description, userName, onClose],
  );

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setName("");
    setDescription("");
    setError("");
    setSuccess("");
    onClose();
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  const isFormValid = name.trim() && description.trim();

  return (
    <>
      <div
        className="name-suggestion-modal-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <LiquidGlass
        id={`modal-glass-${modalGlassId.replace(/:/g, "-")}`}
        width={500}
        height={600}
        radius={20}
        scale={-80}
        saturation={1.05}
        frost={0.08}
        inputBlur={8}
        outputBlur={1.2}
        className="name-suggestion-modal-glass"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 500px)",
          maxHeight: "90vh",
          height: "auto",
          minHeight: "400px",
          maxWidth: "min(90vw, 500px)",
          zIndex: "1051",
        }}
      >
        <div
          className="name-suggestion-modal"
          role="dialog"
          aria-labelledby="suggest-name-title"
          aria-describedby="suggest-name-description"
          aria-modal="true"
        >
          <div className="name-suggestion-modal-header">
            <h2 id="suggest-name-title" className="name-suggestion-modal-title">
              💡 Suggest a Name
            </h2>
            <button
              type="button"
              className="name-suggestion-modal-close"
              onClick={handleClose}
              aria-label="Close modal"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <p
            id="suggest-name-description"
            className="name-suggestion-modal-description"
          >
            Help us expand the list by suggesting new cat names!
          </p>

          <form onSubmit={handleSubmit} className="name-suggestion-modal-form">
            <div className="name-suggestion-form-group">
              <label
                htmlFor="modal-name-input"
                className="name-suggestion-form-label"
              >
                Name
              </label>
              <input
                id="modal-name-input"
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., Whiskers"
                className="name-suggestion-form-input"
                disabled={isSubmitting}
                maxLength={50}
                required
              />
            </div>

            <div className="name-suggestion-form-group">
              <label
                htmlFor="modal-description-input"
                className="name-suggestion-form-label"
              >
                Description
              </label>
              <textarea
                id="modal-description-input"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="A brief description of why this name is special"
                className="name-suggestion-form-textarea"
                disabled={isSubmitting}
                maxLength={500}
                rows={4}
                required
              />
            </div>

            {error && <div className="name-suggestion-form-error">{error}</div>}
            {success && (
              <div className="name-suggestion-form-success">{success}</div>
            )}

            <div className="name-suggestion-modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="name-suggestion-modal-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="name-suggestion-modal-submit"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? "Submitting..." : "Submit Suggestion"}
              </button>
            </div>
          </form>
        </div>
      </LiquidGlass>
    </>
  );
}

NameSuggestionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
