/**
 * @module useProfileNames
 * @description Custom hook for managing profile names data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClientSync, resolveSupabaseClient } from '../../../integrations/supabase/client';
import { getNamesWithUserRatings } from '../../../integrations/supabase/api';

/**
 * * Hook for managing profile names
 * @param {string} activeUser - Active user name
 * @returns {Object} Names state and handlers
 */
export function useProfileNames(activeUser) {
  const [allNames, setAllNames] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState(null);
  const [hiddenNames, setHiddenNames] = useState(new Set());
  const [hasSupabaseClient, setHasSupabaseClient] = useState(
    () => !!getSupabaseClientSync()
  );
  const isMountedRef = useRef(true);

  const fetchNames = useCallback(
    async (targetUser = activeUser) => {
      const userToLoad = targetUser ?? activeUser;
      if (!userToLoad) return;

      try {
        setRatingsLoading(true);
        setRatingsError(null);
        const supabaseClient = await resolveSupabaseClient();
        
        if (!isMountedRef.current) return;
        setHasSupabaseClient(!!supabaseClient);

        if (!supabaseClient) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase not configured, using empty data for Profile');
          }
          if (!isMountedRef.current) return;
          setAllNames([]);
          setHiddenNames(new Set());
          return;
        }
        const names = await getNamesWithUserRatings(userToLoad);
        
        if (!isMountedRef.current) return;
        
        const namesWithOwner = (names || []).map((name) => ({
          ...name,
          owner: userToLoad
        }));
        setAllNames(namesWithOwner);

        // Initialize hidden names from the data
        const hiddenIds = new Set(
          namesWithOwner.filter((name) => name.isHidden).map((name) => name.id)
        );
        setHiddenNames(hiddenIds);

        // * Debug logging for hidden names
        if (process.env.NODE_ENV === 'development') {
          const hiddenNamesForUser = namesWithOwner.filter((name) => name.isHidden);
          console.log(
            `🔍 Profile loaded ${namesWithOwner.length} names for user: ${userToLoad}`
          );
          console.log(
            `🔍 Found ${hiddenNamesForUser.length} hidden names:`,
            hiddenNamesForUser.map((n) => ({
              id: n.id,
              name: n.name,
              isHidden: n.isHidden
            }))
          );
          console.log('🔍 Hidden IDs set:', Array.from(hiddenIds));
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching names:', err);
        }
        setRatingsError(err);
      } finally {
        if (isMountedRef.current) {
          setRatingsLoading(false);
        }
      }
    },
    [activeUser]
  );

  useEffect(() => {
    isMountedRef.current = true;

    const ensureClient = async () => {
      const client = await resolveSupabaseClient();
      if (isMountedRef.current) {
        setHasSupabaseClient(!!client);
      }
    };

    void ensureClient();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchNames(activeUser);
    }
  }, [activeUser, fetchNames]);

  return {
    allNames,
    setAllNames,
    ratingsLoading,
    ratingsError,
    hiddenNames,
    setHiddenNames,
    hasSupabaseClient,
    setHasSupabaseClient,
    fetchNames
  };
}

