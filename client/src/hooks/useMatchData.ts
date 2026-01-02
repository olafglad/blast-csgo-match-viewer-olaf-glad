import { useState, useEffect } from 'react';
import type { MatchData } from '@shared';

const API_URL = 'http://localhost:3001/api';

export function useMatchData() {
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Try API first (local dev), fall back to static JSON (GitHub Pages)
      try {
        const res = await fetch(`${API_URL}/match`);
        if (!res.ok) throw new Error('API unavailable');
        setData(await res.json());
      } catch {
        try {
          const res = await fetch('/match.json');
          if (!res.ok) throw new Error('Failed to load match data');
          setData(await res.json());
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error };
}
