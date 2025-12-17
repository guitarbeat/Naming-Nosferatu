/**
 * @module metricDefinitions
 * @description Centralized definitions and explanations for all metrics used in the analysis dashboard.
 * Provides consistent terminology and help text across the app.
 */

/**
 * Metric definitions with descriptions, ranges, and interpretation guidance
 */
export const METRICS = {
  rating: {
    label: "Rating",
    shortLabel: "Rating",
    description:
      "Elo-based rating system (similar to chess ratings). Higher is better.",
    fullDescription:
      "An Elo-based rating that reflects how strong or popular this name is compared to others. Ratings start at 1500 and adjust based on matchups with other names.",
    range: "1000–3000",
    examples: [
      { value: 1200, text: "Novice name - just starting" },
      { value: 1500, text: "Average name - typical baseline" },
      { value: 1700, text: "Strong name - consistently wins" },
      { value: 2000, text: "Excellent name - top tier" },
    ],
    helpText:
      "A rating of 1700 means this name would be expected to beat ~75% of other names in a 1v1 matchup.",
  },

  times_selected: {
    label: "Times Selected",
    shortLabel: "Selected",
    description: "How many times this name has been chosen in tournaments.",
    fullDescription:
      "The total number of times users have selected this name during tournament rounds. Higher numbers indicate more popular or appealing names.",
    range: "0–∞",
    examples: [
      { value: 0, text: "Never chosen" },
      { value: 10, text: "Moderately popular" },
      { value: 50, text: "Very popular" },
      { value: 100, text: "Extremely popular" },
    ],
    helpText:
      "More selections = more data about how this name compares to others.",
  },

  total_wins: {
    label: "Wins",
    shortLabel: "Wins",
    description: "Number of times this name won in direct comparisons.",
    fullDescription:
      "The count of tournament rounds where this name was selected over its opponent. Works together with losses to calculate win rate.",
    range: "0–∞",
    examples: [
      { value: 0, text: "Never won (new name)" },
      { value: 5, text: "5 victories" },
      { value: 20, text: "20 victories (strong record)" },
    ],
    helpText: "More wins contribute to a higher rating.",
  },

  total_losses: {
    label: "Losses",
    shortLabel: "Losses",
    description: "Number of times this name lost in direct comparisons.",
    fullDescription:
      "The count of tournament rounds where this name was not selected (lost to its opponent). Works with wins to determine overall performance.",
    range: "0–∞",
    examples: [
      { value: 0, text: "Undefeated (no losses)" },
      { value: 5, text: "5 defeats" },
      { value: 20, text: "20 defeats" },
    ],
    helpText:
      "Losses help balance the rating system—experienced names have both wins and losses.",
  },

  win_rate: {
    label: "Win Rate",
    shortLabel: "Win %",
    description: "Percentage of matchups this name won.",
    fullDescription:
      "Calculated as: Wins ÷ (Wins + Losses) × 100%. Shows the proportion of favorable outcomes.",
    range: "0–100%",
    examples: [
      { value: 50, text: "50% - balanced record" },
      { value: 60, text: "60% - winning record" },
      { value: 75, text: "75% - strong record" },
      { value: 100, text: "100% - undefeated" },
    ],
    helpText:
      "A 70% win rate is very good. Note: newer names with fewer matchups may have extreme win rates.",
  },

  popularity_score: {
    label: "Popularity Score",
    shortLabel: "Popularity",
    description: "Weighted score combining selections, wins, and rating.",
    fullDescription:
      "A composite metric that weighs multiple factors: selections (2x), wins (1.5x), and rating advantage. Useful for spotting overall strong performers.",
    range: "Variable",
    examples: [
      { value: 50, text: "Low popularity" },
      { value: 200, text: "Moderate popularity" },
      { value: 500, text: "High popularity" },
    ],
    helpText:
      "This score combines multiple metrics into one number. Useful for quick comparisons.",
  },

  unique_selectors: {
    label: "Unique Selectors",
    shortLabel: "Users",
    description: "Number of different users who have selected this name.",
    fullDescription:
      "How many unique users have chosen this name in tournaments. Indicates broad vs. narrow appeal.",
    range: "0–∞",
    examples: [
      { value: 1, text: "Only one user likes it" },
      { value: 5, text: "5 users have selected it" },
      { value: 20, text: "20 users have selected it (broad appeal)" },
    ],
    helpText:
      "A name with high selections but few selectors may be a personal favorite of one user.",
  },

  users_rated: {
    label: "Users Rated",
    shortLabel: "Rated By",
    description: "Number of different users who have rated this name.",
    fullDescription:
      "How many unique users participated in matchups involving this name.",
    range: "0–∞",
    examples: [
      { value: 1, text: "Rated by 1 user" },
      { value: 10, text: "Rated by 10 users" },
    ],
    helpText: "Names rated by more users have more reliable statistics.",
  },

  created_at: {
    label: "Created",
    shortLabel: "Created",
    description: "When this name was added to the system.",
    fullDescription:
      "The date this name entry was created. Newer names may have less history.",
    range: "Date",
    examples: [
      { value: "new", text: "Created today - no history yet" },
      { value: "recent", text: "Created recently - limited data" },
      { value: "old", text: "Created long ago - lots of data" },
    ],
    helpText:
      "Consider the age when interpreting metrics. New names need more time to build a track record.",
  },

  percentile: {
    label: "Percentile",
    shortLabel: "Percentile",
    description: "Position in ranking compared to all other names.",
    fullDescription:
      "Shows where this name ranks relative to others. 90th percentile = better than 90% of other names.",
    range: "0–100%",
    examples: [
      { value: 10, text: "10th percentile - below average" },
      { value: 50, text: "50th percentile - average" },
      { value: 90, text: "90th percentile - top 10%" },
    ],
    helpText: "Use percentile for quick comparisons. Higher is better.",
  },
};

/**
 * Get metric definition by name
 * @param {string} metricName - The metric key (e.g., 'rating', 'times_selected')
 * @returns {Object|null} Metric definition or null if not found
 */
export function getMetricDefinition(metricName) {
  return METRICS[metricName] || null;
}

/**
 * Get the help text for a specific metric
 * @param {string} metricName - The metric key
 * @returns {string} Help text or empty string
 */
export function getMetricHelpText(metricName) {
  const definition = getMetricDefinition(metricName);
  return definition?.helpText || "";
}

/**
 * Get the description for a metric
 * @param {string} metricName - The metric key
 * @returns {string} Description or empty string
 */
export function getMetricDescription(metricName) {
  const definition = getMetricDefinition(metricName);
  return definition?.description || "";
}

/**
 * Get the full detailed description for a metric
 * @param {string} metricName - The metric key
 * @returns {string} Full description or empty string
 */
export function getMetricFullDescription(metricName) {
  const definition = getMetricDefinition(metricName);
  return definition?.fullDescription || "";
}

/**
 * Get label for a metric
 * @param {string} metricName - The metric key
 * @returns {string} Label or the metricName itself
 */
export function getMetricLabel(metricName) {
  const definition = getMetricDefinition(metricName);
  return definition?.label || metricName;
}

/**
 * Insight categories for badges and highlights
 */
export const INSIGHT_CATEGORIES = {
  top_rated: {
    label: "Top Rated",
    description: "In the top 10% by rating",
    icon: "⭐",
    color: "var(--color-gold, #f59e0b)",
  },

  trending_up: {
    label: "Trending Up",
    description: "Gaining popularity",
    icon: "📈",
    color: "var(--color-success, #22c55e)",
  },

  trending_down: {
    label: "Trending Down",
    description: "Losing popularity",
    icon: "📉",
    color: "var(--color-danger, #ef4444)",
  },

  most_selected: {
    label: "Most Selected",
    description: "One of the top selections",
    icon: "👍",
    color: "var(--color-info, #3b82f6)",
  },

  underrated: {
    label: "Underrated",
    description: "Good rating but low selections",
    icon: "💎",
    color: "var(--color-purple, #a855f7)",
  },

  new: {
    label: "New",
    description: "Recently added",
    icon: "✨",
    color: "var(--color-cyan, #06b6d4)",
  },

  undefeated: {
    label: "Undefeated",
    description: "No losses yet",
    icon: "🏆",
    color: "var(--color-gold, #f59e0b)",
  },

  undiscovered: {
    label: "Undiscovered",
    description: "Never selected yet",
    icon: "🔍",
    color: "var(--color-subtle, #6b7280)",
  },
};

/**
 * Get insight category definition
 * @param {string} categoryKey - The category key
 * @returns {Object|null} Category definition or null
 */
export function getInsightCategory(categoryKey) {
  return INSIGHT_CATEGORIES[categoryKey] || null;
}

/**
 * Standard rating ranges and their labels (for interpretation)
 */
export const RATING_RANGES = [
  { min: 0, max: 1200, label: "Novice", color: "var(--color-subtle, #6b7280)" },
  {
    min: 1200,
    max: 1400,
    label: "Developing",
    color: "var(--color-info, #3b82f6)",
  },
  {
    min: 1400,
    max: 1600,
    label: "Solid",
    color: "var(--color-warning, #f59e0b)",
  },
  {
    min: 1600,
    max: 1800,
    label: "Strong",
    color: "var(--color-success, #22c55e)",
  },
  {
    min: 1800,
    max: 2000,
    label: "Excellent",
    color: "var(--color-gold, #f59e0b)",
  },
  {
    min: 2000,
    max: Infinity,
    label: "Elite",
    color: "var(--color-purple, #a855f7)",
  },
];

/**
 * Get the rating range label for a given rating
 * @param {number} rating - The rating value
 * @returns {string} Range label
 */
export function getRatingRangeLabel(rating) {
  const range = RATING_RANGES.find((r) => rating >= r.min && rating < r.max);
  return range?.label || "Unknown";
}

/**
 * Get the color for a rating range
 * @param {number} rating - The rating value
 * @returns {string} Color CSS variable or hex
 */
export function getRatingRangeColor(rating) {
  const range = RATING_RANGES.find((r) => rating >= r.min && rating < r.max);
  return range?.color || "var(--color-subtle, #6b7280)";
}
