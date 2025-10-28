/**
 * @module TournamentSetup/hooks/useCategoryFilters
 * @description Custom hook for managing category filters and derived data
 */
import { useState, useEffect } from "react";
import { extractCategories } from "../utils";

/**
 * Custom hook for managing category filters
 * @param {Array} availableNames - Available names to extract categories from
 * @returns {Object} Category state and derived data
 */
export function useCategoryFilters(availableNames) {
  const [categories, setCategories] = useState([]);

  // * Derive categories from available names to avoid schema coupling
  useEffect(() => {
    setCategories(extractCategories(availableNames));
  }, [availableNames]);

  return categories;
}

