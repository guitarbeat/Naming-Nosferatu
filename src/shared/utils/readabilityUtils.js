/**
 * @module readabilityUtils
 * @description Utility functions for checking and improving content readability.
 * Helps ensure content meets WCAG 2.1 guidelines and readability standards.
 */

/**
 * Counts words in a text string.
 * @param {string} text - The text to analyze
 * @returns {number} Word count
 */
export function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Counts sentences in a text string.
 * @param {string} text - The text to analyze
 * @returns {number} Sentence count
 */
export function countSentences(text) {
  if (!text || typeof text !== "string") return 0;
  // * Split on sentence-ending punctuation, but handle abbreviations
  const sentences = text
    .trim()
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  return sentences.length || 1; // * At least 1 sentence if text exists
}

/**
 * Calculates average words per sentence.
 * @param {string} text - The text to analyze
 * @returns {number} Average words per sentence
 */
export function averageWordsPerSentence(text) {
  const words = countWords(text);
  const sentences = countSentences(text);
  return sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;
}

/**
 * Checks if a sentence is too long (exceeds maximum word count).
 * @param {string} sentence - The sentence to check
 * @param {number} maxWords - Maximum words allowed (default: 20)
 * @returns {boolean} True if sentence exceeds max words
 */
export function isSentenceTooLong(sentence, maxWords = 20) {
  return countWords(sentence) > maxWords;
}

/**
 * Detects passive voice patterns in text.
 * Simple heuristic-based detection (not 100% accurate).
 * @param {string} text - The text to analyze
 * @returns {boolean} True if passive voice is detected
 */
export function hasPassiveVoice(text) {
  if (!text || typeof text !== "string") return false;

  const passivePatterns = [
    /\bis\s+\w+ed\b/i,
    /\bare\s+\w+ed\b/i,
    /\bwas\s+\w+ed\b/i,
    /\bwere\s+\w+ed\b/i,
    /\bbeen\s+\w+ed\b/i,
    /\bbeing\s+\w+ed\b/i,
    /\bby\s+\w+\s+\w+ed\b/i, // "by [noun] [verb]ed"
  ];

  return passivePatterns.some((pattern) => pattern.test(text));
}

/**
 * Estimates reading level using Flesch-Kincaid Grade Level formula.
 * Simplified version - for accurate results, use dedicated libraries.
 * @param {string} text - The text to analyze
 * @returns {number} Estimated grade level (0-12+)
 */
export function estimateReadingLevel(text) {
  if (!text || typeof text !== "string") return 0;

  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = estimateSyllables(text);

  if (words === 0 || sentences === 0) return 0;

  // * Flesch-Kincaid Grade Level formula (simplified)
  const avgSentenceLength = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  const gradeLevel =
    0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

  return Math.max(0, Math.round(gradeLevel * 10) / 10);
}

/**
 * Estimates syllable count in text (approximation).
 * @param {string} text - The text to analyze
 * @returns {number} Estimated syllable count
 */
function estimateSyllables(text) {
  if (!text) return 0;

  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let syllables = 0;

  words.forEach((word) => {
    // * Simple syllable estimation
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const matches = word.match(/[aeiouy]{1,2}/g);
    syllables += matches ? matches.length : 1;
  });

  return syllables;
}

/**
 * Analyzes text for readability issues.
 * @param {string} text - The text to analyze
 * @param {Object} options - Analysis options
 * @param {number} options.maxSentenceLength - Maximum words per sentence (default: 20)
 * @param {number} options.targetAvgWords - Target average words per sentence (default: 15)
 * @param {number} options.maxReadingLevel - Maximum reading level (default: 9)
 * @returns {Object} Analysis results with issues and suggestions
 */
export function analyzeReadability(text, options = {}) {
  const {
    maxSentenceLength = 20,
    targetAvgWords = 15,
    maxReadingLevel = 9,
  } = options;

  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      issues: [],
      suggestions: [],
      metrics: {
        wordCount: 0,
        sentenceCount: 0,
        avgWordsPerSentence: 0,
        readingLevel: 0,
      },
    };
  }

  const issues = [];
  const suggestions = [];
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const wordCount = countWords(text);
  const sentenceCount = sentences.length || 1;
  const avgWordsPerSentence = averageWordsPerSentence(text);
  const readingLevel = estimateReadingLevel(text);
  const hasPassive = hasPassiveVoice(text);

  // * Check for long sentences
  sentences.forEach((sentence, index) => {
    const words = countWords(sentence);
    if (words > maxSentenceLength) {
      issues.push({
        type: "long_sentence",
        severity: words > 25 ? "high" : "medium",
        message: `Sentence ${index + 1} has ${words} words (max: ${maxSentenceLength})`,
        sentence,
        suggestion: "Split into shorter sentences or remove unnecessary words",
      });
    }
  });

  // * Check average sentence length
  if (avgWordsPerSentence > targetAvgWords + 3) {
    issues.push({
      type: "high_avg_length",
      severity: "medium",
      message: `Average sentence length is ${avgWordsPerSentence} words (target: ${targetAvgWords})`,
      suggestion: "Reduce sentence length throughout the text",
    });
  }

  // * Check reading level
  if (readingLevel > maxReadingLevel) {
    issues.push({
      type: "high_reading_level",
      severity: "high",
      message: `Reading level is Grade ${readingLevel} (target: Grade ${maxReadingLevel})`,
      suggestion:
        "Simplify vocabulary and sentence structure. Use shorter words and sentences.",
    });
  }

  // * Check for passive voice
  if (hasPassive) {
    issues.push({
      type: "passive_voice",
      severity: "low",
      message: "Passive voice detected",
      suggestion: "Consider rewriting in active voice for clarity",
    });
  }

  // * Generate suggestions
  if (issues.length === 0) {
    suggestions.push("Text meets readability guidelines!");
  } else {
    if (issues.some((i) => i.type === "long_sentence")) {
      suggestions.push("Break long sentences into shorter ones");
    }
    if (issues.some((i) => i.type === "high_reading_level")) {
      suggestions.push("Use simpler words and shorter sentences");
    }
    if (hasPassive) {
      suggestions.push("Rewrite passive voice in active voice");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    metrics: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      readingLevel,
      hasPassiveVoice: hasPassive,
    },
  };
}

/**
 * Validates button/link text for clarity and accessibility.
 * @param {string} text - The button/link text to validate
 * @returns {Object} Validation results
 */
export function validateButtonText(text) {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      issues: ["Button text is empty"],
      suggestions: ["Add descriptive text"],
    };
  }

  const issues = [];
  const suggestions = [];
  const wordCount = countWords(text);

  // * Check minimum length
  if (wordCount < 1) {
    issues.push("Button text is too short");
    suggestions.push("Use at least 1-2 words");
  }

  // * Check for generic text
  const genericTexts = ["click here", "here", "more", "link", "button"];
  if (genericTexts.some((generic) => text.toLowerCase().includes(generic))) {
    issues.push("Button text is too generic");
    suggestions.push("Use specific, descriptive text (e.g., 'Start Tournament' instead of 'Click here')");
  }

  // * Check for "click" in text (not needed)
  if (text.toLowerCase().includes("click")) {
    issues.push("Avoid using 'click' in button text");
    suggestions.push("Button text should describe the action, not how to interact");
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    wordCount,
  };
}

/**
 * Validates heading text for clarity and SEO.
 * @param {string} text - The heading text to validate
 * @param {number} level - Heading level (1-6)
 * @returns {Object} Validation results
 */
export function validateHeadingText(text, level = 2) {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      issues: ["Heading text is empty"],
      suggestions: ["Add descriptive heading text"],
    };
  }

  const issues = [];
  const suggestions = [];
  const wordCount = countWords(text);
  const maxWords = level === 1 ? 10 : level === 2 ? 12 : 15;

  // * Check length
  if (wordCount > maxWords) {
    issues.push(`Heading is too long (${wordCount} words, max: ${maxWords})`);
    suggestions.push("Use shorter, more concise headings");
  }

  // * Check for proper capitalization (title case or sentence case)
  // * This is a style preference, so we'll just note it
  if (text.split(" ").every((word) => word[0] === word[0].toUpperCase())) {
    suggestions.push("Consider using sentence case for better readability");
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    wordCount,
  };
}

/**
 * Provides readability score summary for display.
 * @param {Object} analysis - Result from analyzeReadability()
 * @returns {string} Human-readable summary
 */
export function getReadabilitySummary(analysis) {
  if (!analysis || !analysis.metrics) {
    return "Unable to analyze text";
  }

  const { metrics } = analysis;
  const { readingLevel, avgWordsPerSentence, wordCount } = metrics;

  let summary = `Reading level: Grade ${readingLevel.toFixed(1)}`;
  summary += ` | Average sentence: ${avgWordsPerSentence.toFixed(1)} words`;
  summary += ` | Total words: ${wordCount}`;

  if (analysis.issues.length > 0) {
    summary += ` | Issues: ${analysis.issues.length}`;
  } else {
    summary += " | ✅ Meets guidelines";
  }

  return summary;
}
