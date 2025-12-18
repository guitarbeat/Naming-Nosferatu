/**
 * @module Login
 * @description User login component with retro diorama aesthetic.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import { generateFunName } from "../../shared/utils/nameGenerationUtils";
import { validateUsername } from "../../shared/utils/validationUtils";
import { ErrorManager } from "../../shared/services/errorManager";
import styles from "./Login.module.css";

const FALLBACK_CAT_FACT =
  "Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;
const EYE_MOVEMENT_MAX_PX = 4;

/**
 * Hook to fetch and manage cat fact state
 */
function useCatFact() {
  const [catFact, setCatFact] = useState("");

  useEffect(() => {
    const fetchCatFact = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      try {
        const response = await fetch(CAT_FACT_API_URL, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && typeof data.fact === "string") {
          setCatFact(data.fact);
        } else {
          throw new Error("Invalid response format from cat fact API");
        }
      } catch (error: any) {
        if (error.name === "AbortError" || error.name === "TimeoutError") {
          if (process.env.NODE_ENV === "development") {
            console.warn("Cat fact request timed out");
          }
        } else {
          ErrorManager.handleError(error, "Fetch Cat Fact", {
            isRetryable: true,
            affectsUserData: false,
            isCritical: false,
          });
        }
        setCatFact(FALLBACK_CAT_FACT);
      }
    };

    fetchCatFact();
  }, []);

  return catFact;
}

/**
 * Hook to track mouse position and calculate eye position for cat SVG
 */
function useEyeTracking({ catRef, catSvgRef }: { catRef: React.RefObject<HTMLElement | null>; catSvgRef: React.RefObject<HTMLElement | null> }) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = catSvgRef?.current || catRef?.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        const catCenterX = rect.left + rect.width / 2;
        const catCenterY = rect.top + rect.height / 2;
        const deltaX = e.clientX - catCenterX;
        const deltaY = e.clientY - catCenterY;
        const maxDistance = Math.max(rect.width, rect.height) / 2;
        const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
        const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
        setEyePosition({
          x: normalizedX * EYE_MOVEMENT_MAX_PX,
          y: normalizedY * EYE_MOVEMENT_MAX_PX,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [catRef, catSvgRef]);

  return eyePosition;
}

/**
 * Hook to manage login form state and submission
 */
function useLoginForm(onLogin: (name: string) => Promise<void> | void) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (error) {
        setError("");
      }
    },
    [error],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();

      if (isLoading) {
        return;
      }

      const finalName = name.trim() || generateFunName();

      const validation = validateUsername(finalName);
      if (!validation.success) {
        setError(validation.error || "Invalid username");
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        await onLogin(validation.value || finalName);
      } catch (err) {
        const formattedError = ErrorManager.handleError(err, "User Login", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });

        const error = err as Error;
        setError(
          formattedError.userMessage ||
            error.message ||
            "Unable to log in. Please check your connection and try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [name, isLoading, onLogin],
  );

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    name,
    setName,
    isLoading,
    error,
    handleNameChange,
    handleSubmit,
    clearError,
  };
}

function Login({ onLogin }: { onLogin: (name: string) => void }) {
  const catRef = useRef<HTMLDivElement>(null);

  // * Fetch cat fact
  const catFact = useCatFact();

  // * Track eye position
  const eyePosition = useEyeTracking({ catRef, catSvgRef: catRef });

  // * Form state and handlers
  const {
    name,
    setName,
    isLoading,
    error,
    handleNameChange,
    handleSubmit,
    clearError,
  } = useLoginForm(onLogin);

  const handleRandomNameClick = () => {
    if (isLoading) {
      return;
    }
    const funName = generateFunName();
    setName(funName);
    if (error) {
      clearError();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const eyeStyle = {
    transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.scene}>
        <div className={styles.cutOutCat} ref={catRef}>
          <div className={styles.eye} style={eyeStyle} />
          <div
            className={`${styles.eye} ${styles.eyeRight}`}
            style={eyeStyle}
          />
        </div>

        <div className={styles.catFactTape}>
          {catFact ? `FACT: ${catFact}` : "LOADING FELINE DATA..."}
        </div>

        <h1 className={styles.title}>JUDGE REGISTRY</h1>
        <p className={styles.subtitle}>
          DEPOSIT NAME BELOW TO EVALUATE FELINES
        </p>

        <div className={styles.inputTray}>
          <input
            type="text"
            className={styles.loginInput}
            placeholder="--- --- ---"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoFocus
            maxLength={30}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.leverBtn}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "ENGAGING..." : "ENGAGE TOURNAMENT"}
        </button>

        <button
          className={styles.rerollBtn}
          onClick={handleRandomNameClick}
          disabled={isLoading}
        >
          [ RE-ROLL IDENTITY 🎲 ]
        </button>
      </div>
    </div>
  );
}

export default Login;
