/**
 * @module Login
 * @description User login component with fun cat-themed interactions.
 */
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { Card, Error } from "../../shared/components";
import { validateUsername } from "../../shared/utils/validationUtils";
import { siteSettingsAPI } from "../../integrations/supabase/api";
import { ErrorManager } from "../../shared/services/errorManager";
import CatNameBanner from "../home/CatNameBanner";
import BongoCat from "../../shared/components/BongoCat/BongoCat";
import styles from "./Login.module.css";

function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [catFact, setCatFact] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [catName, setCatName] = useState(null);
  const [loadingCatName, setLoadingCatName] = useState(true);

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Add login-page class to body and html when component mounts
  useEffect(() => {
    document.body.classList.add("login-page");
    document.documentElement.classList.add("login-page");

    // Remove class when component unmounts
    return () => {
      document.body.classList.remove("login-page");
      document.documentElement.classList.remove("login-page");
    };
  }, []);

  // Load cat's chosen name
  useEffect(() => {
    loadCatName();
  }, []);

  const loadCatName = async () => {
    try {
      const data = await siteSettingsAPI.getCatChosenName();
      setCatName(data);
    } catch (error) {
      // * Use ErrorManager for consistent error handling
      ErrorManager.handleError(error, "Load Cat Name", {
        isRetryable: true,
        affectsUserData: false,
        isCritical: false,
      });
      // * Silently fail - cat name banner is optional
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to load cat name (non-critical):", error);
      }
    } finally {
      setLoadingCatName(false);
    }
  };

  const funnyPrefixes = [
    "Captain",
    "Dr.",
    "Professor",
    "Lord",
    "Lady",
    "Sir",
    "Duchess",
    "Count",
    "Princess",
    "Chief",
    "Master",
    "Agent",
    "Detective",
    "Admiral",
  ];

  const funnyAdjectives = [
    "Whiskers",
    "Purrington",
    "Meowington",
    "Pawsome",
    "Fluffles",
    "Scratchy",
    "Naptastic",
    "Furball",
    "Cattastic",
    "Pawdorable",
    "Whiskertron",
    "Purrfect",
  ];

  const sanitizeGeneratedName = (value) =>
    value
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const generateFunName = () => {
    let attempts = 0;
    let generatedName = "";

    while (!generatedName && attempts < 3) {
      const prefix =
        funnyPrefixes[Math.floor(Math.random() * funnyPrefixes.length)];
      const adjective =
        funnyAdjectives[Math.floor(Math.random() * funnyAdjectives.length)];

      generatedName = sanitizeGeneratedName(`${prefix} ${adjective}`);
      attempts += 1;
    }

    return generatedName || "Cat Judge";
  };

  const handleRandomNameClick = () => {
    if (isLoading) {
      return;
    }
    const funName = generateFunName();
    setName(funName);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (error) {
      setError("");
    }
  };

  const handleRandomNameKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRandomNameClick();
    }
  };

  const resetTypingTimer = () => {
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  // Fetch cat fact on component mount
  useEffect(() => {
    const fetchCatFact = async () => {
      // * Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch("https://catfact.ninja/fact", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // * Validate response structure
        if (data && typeof data.fact === "string") {
          setCatFact(data.fact);
        } else {
          throw new Error("Invalid response format from cat fact API");
        }
      } catch (error) {
        // * Handle abort/timeout gracefully
        if (error.name === "AbortError" || error.name === "TimeoutError") {
          if (process.env.NODE_ENV === "development") {
            console.warn("Cat fact request timed out");
          }
        } else {
          // * Use ErrorManager for consistent error handling
          ErrorManager.handleError(error, "Fetch Cat Fact", {
            isRetryable: true,
            affectsUserData: false,
            isCritical: false,
          });
        }

        // * Set fallback message
        setCatFact("Cats are amazing creatures with unique personalities!");
      }
    };

    fetchCatFact();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    resetTypingTimer();
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // * Prevent duplicate submissions
    if (isLoading) {
      return;
    }

    const finalName = name.trim() || generateFunName();

    // Validate the username
    const validation = validateUsername(finalName);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    try {
      setIsLoading(true);
      setError(""); // Clear any previous errors
      await onLogin(validation.value);
    } catch (err) {
      // * Use ErrorManager for consistent error handling
      const formattedError = ErrorManager.handleError(err, "User Login", {
        isRetryable: true,
        affectsUserData: false,
        isCritical: false,
      });

      // * Set user-friendly error message
      setError(
        formattedError.userMessage ||
          err.message ||
          "Unable to log in. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      {/* Background with overlay */}
      <div className={styles.backgroundContainer}>
        <picture>
          <source type="image/avif" srcSet="/assets/images/IMG_5071.avif" />
          <source type="image/webp" srcSet="/assets/images/IMG_5071.webp" />
          <img
            src="/assets/images/IMG_5071.JPG"
            alt="Cat background"
            className={styles.backgroundImage}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </picture>
        <div className={styles.overlay} />
      </div>

      {/* Centered Hero Container with Generous Spacing */}
      <div className={styles.heroContainer} ref={containerRef}>
        {/* Premium Hero Section - Tournament Info */}
        <div className={styles.heroContent}>
          <div style={{ marginBottom: "clamp(1rem, 4vw, 2rem)" }}>
            {/* Cat Name Banner */}
            {!loadingCatName && catName && (
              <CatNameBanner catName={catName} isAdmin={false} />
            )}
          </div>

          <h1 className={styles.welcomeTitle}>Ready to Judge the Names?</h1>
          <p className={styles.welcomeText}>
            Now it&apos;s your turn! Enter your name to start judging cat names
            and help find the perfect one.
          </p>
        </div>

        {/* Premium Form Card - Call to Action */}
        <Card
          className={styles.formCard}
          variant="outlined"
          background="transparent"
          shadow="xl"
          padding="xl"
        >
          <div
            id="loginInteraction"
            className={styles.expandedContent}
            aria-live="polite"
          >
            <p className={styles.catFact}>
              <span className={styles.catFactIcon} aria-hidden="true">
                🐱
              </span>
              <span>
                {catFact ? (
                  <>{catFact}</>
                ) : (
                  <span className={styles.loadingFact}>
                    <span className={styles.loadingDots}>
                      Loading a fun cat fact
                    </span>
                    <span className={styles.loadingDots}>...</span>
                  </span>
                )}
              </span>
            </p>
            {isTyping ? (
              <div className={styles.typingIndicator}>
                <span className={styles.typingText}>
                  The cat is watching you type!
                </span>
                <span className={styles.typingDots}>
                  <span className={styles.dot}>.</span>
                  <span className={styles.dot}>.</span>
                  <span className={styles.dot}>.</span>
                </span>
              </div>
            ) : null}

            {/* Bongo Cat - Interactive cat that responds to typing */}
            <BongoCat size={0.5} color="#ff6b9d" containerRef={containerRef} />

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className={styles.loginForm}
              role="form"
              aria-label="Login form"
              autoComplete="off"
            >
              <div className={styles.inputWrapper}>
                <div className={styles.inputContainer}>
                  <input
                    id="loginName"
                    name="judgeName"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Enter your name"
                    className={`${styles.loginInput} ${error ? styles.error : ""}`}
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={isLoading}
                    aria-label="Your name"
                    aria-describedby={error ? "loginError" : "loginHelp"}
                    aria-required="false"
                    maxLength={30}
                  />
                  {!name.trim() && (
                    <div
                      className={styles.randomNameIndicator}
                      title="Generate a random name"
                      role="button"
                      tabIndex={isLoading ? -1 : 0}
                      aria-label="Generate a random name"
                      aria-disabled={isLoading}
                      onClick={handleRandomNameClick}
                      onKeyDown={handleRandomNameKeyDown}
                    >
                      <span aria-hidden="true" className={styles.diceIcon}>
                        🎲
                      </span>
                    </div>
                  )}
                </div>
                {error && (
                  <Error
                    variant="inline"
                    error={error}
                    context="form"
                    position="below"
                    onDismiss={() => setError("")}
                    showRetry={false}
                    showDismiss={true}
                    size="medium"
                    className={styles.loginError}
                  />
                )}
                <p id="loginHelp" className={styles.explainerText}>
                  We&apos;ll create an account automatically if it&apos;s your
                  first time.
                </p>
                {name.trim() && (
                  <div className={styles.characterCounter}>
                    <span className={styles.counterText}>
                      {name.length}/30 characters
                    </span>
                    <div className={styles.counterBar}>
                      <div
                        className={styles.counterProgress}
                        style={{ width: `${(name.length / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitButton}
                aria-label={
                  name.trim()
                    ? "Continue to tournament"
                    : "Get random name and start tournament"
                }
              >
                {isLoading && (
                  <span className={styles.buttonSpinner} aria-hidden="true">
                    <svg
                      className={styles.spinnerIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className={styles.spinnerCircle}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="32"
                        strokeDashoffset="32"
                      >
                        <animate
                          attributeName="stroke-dasharray"
                          dur="2s"
                          values="0 32;16 16;0 32;0 32"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-dashoffset"
                          dur="2s"
                          values="0;-16;-32;-32"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  </span>
                )}
                <span className={styles.buttonText}>
                  {name.trim() ? "Continue" : "Get Random Name & Start"}
                </span>
                {!name.trim() && !isLoading && (
                  <span className={styles.buttonIcon} aria-hidden="true">
                    🏆
                  </span>
                )}
              </button>
            </form>

            {name && (
              <div className={styles.namePreview}>
                <p className={styles.helperText}>
                  Logging in as{" "}
                  <span className={styles.nameHighlight}>
                    &quot;{name}&quot;
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

Login.displayName = "Login";

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

// * Wrap Login with error boundary
function LoginWithErrorBoundary(props) {
  return (
    <Error variant="boundary">
      <Login {...props} />
    </Error>
  );
}

export default LoginWithErrorBoundary;
