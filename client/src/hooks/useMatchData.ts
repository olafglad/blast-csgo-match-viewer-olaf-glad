import { useState, useEffect } from 'react';
import type { MatchData } from '@shared';

const API_URL = 'http://localhost:3001/api';

export function useMatchData() {
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/match`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch match data');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
