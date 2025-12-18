/**
 * @module Login
 * @description User login component with retro diorama aesthetic.
 */
import React, { useRef } from "react";
import { generateFunName } from "../../shared/utils/nameGenerationUtils";
import { useCatFact } from "./hooks/useCatFact";
import { useEyeTracking } from "./hooks/useEyeTracking";
import { useLoginForm } from "./hooks/useLoginForm";
import styles from "./Login.module.css";

function Login({ onLogin }: { onLogin: (name: string) => void }) {
  const catRef = useRef<HTMLDivElement>(null);

  // * Fetch cat fact
  const catFact = useCatFact();

  // * Track eye position
  // We pass catRef as the target for both since we don't have a separate SVG anymore
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
