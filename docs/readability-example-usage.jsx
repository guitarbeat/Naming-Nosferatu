/**
 * @file Example usage of ReadabilityChecker component
 * @description This file demonstrates how to use the ReadabilityChecker component
 * in your React components. Copy these patterns into your own components.
 *
 * NOTE: ReadabilityChecker only renders in development mode.
 */

import React, { useState } from "react";
import { ReadabilityChecker } from "@/shared/components";

// * Example 1: Checking button text
function ButtonExample() {
  const [buttonText, setButtonText] = useState("Click to Start Tournament");

  return (
    <div>
      <label>
        Button Text:
        <input
          type="text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
        />
      </label>
      <button>{buttonText}</button>
      {/* * Shows warnings if text has issues */}
      <ReadabilityChecker text={buttonText} type="button" />
    </div>
  );
}

// * Example 2: Checking heading text
function HeadingExample() {
  const headingText = "Tournament Results and Rankings Display Page";

  return (
    <>
      <h1>{headingText}</h1>
      {/* * Shows warning: "Heading is too long" */}
      <ReadabilityChecker text={headingText} type="heading" headingLevel={1} />
    </>
  );
}

// * Example 3: Checking body text with details expanded
function BodyTextExample() {
  const welcomeText =
    "A scientifically-driven tournament platform that helps you discover the perfect cat name using the same Elo rating algorithm that ranks chess grandmasters.";

  return (
    <>
      <p>{welcomeText}</p>
      {/* * Shows full analysis with metrics */}
      <ReadabilityChecker text={welcomeText} type="body" showDetails={true} />
    </>
  );
}

// * Example 4: Checking error message
function ErrorMessageExample() {
  const errorMessage =
    "An error occurred while attempting to save your tournament data. Please try the operation again.";

  return (
    <>
      <div className="error">{errorMessage}</div>
      {/* * Shows suggestions for improvement */}
      <ReadabilityChecker text={errorMessage} type="error" />
    </>
  );
}

// * Example 5: Real-world Login component usage
function LoginWithReadabilityCheck() {
  const [welcomeTitle, setWelcomeTitle] = useState("Ready to Judge the Names?");
  const [welcomeText, setWelcomeText] = useState(
    "Now it's your turn! Enter your name to start judging cat names and help find the perfect one."
  );

  return (
    <div className="login-form">
      <div>
        <label>
          Welcome Title:
          <input
            type="text"
            value={welcomeTitle}
            onChange={(e) => setWelcomeTitle(e.target.value)}
          />
        </label>
        <h1>{welcomeTitle}</h1>
        <ReadabilityChecker
          text={welcomeTitle}
          type="heading"
          headingLevel={1}
        />
      </div>

      <div>
        <label>
          Welcome Text:
          <textarea
            value={welcomeText}
            onChange={(e) => setWelcomeText(e.target.value)}
            rows={3}
          />
        </label>
        <p>{welcomeText}</p>
        <ReadabilityChecker text={welcomeText} type="body" />
      </div>
    </div>
  );
}

// * Example 6: Programmatic checking before saving
function ContentEditorExample() {
  const [content, setContent] = useState("");
  const { analyzeReadability } = require("@/shared/utils/readabilityUtils");

  const handleSave = () => {
    const analysis = analyzeReadability(content);

    if (!analysis.isValid) {
      const shouldProceed = confirm(
        `Content has ${analysis.issues.length} readability issue(s). Save anyway?`
      );
      if (!shouldProceed) {
        return;
      }
    }

    // * Save content...
    console.log("Saving content:", content);
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
      />
      <ReadabilityChecker text={content} type="body" showDetails={true} />
      <button onClick={handleSave}>Save Content</button>
    </div>
  );
}

export {
  ButtonExample,
  HeadingExample,
  BodyTextExample,
  ErrorMessageExample,
  LoginWithReadabilityCheck,
  ContentEditorExample,
};
