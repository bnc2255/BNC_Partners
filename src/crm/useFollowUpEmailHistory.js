import { useCallback, useEffect, useState } from 'react';
import { followUpRequest } from './followUpApi';

export function useFollowUpEmailHistory({ partnerId, offset = 0, refreshKey } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = useCallback(() => setRefreshCount(value => value + 1), []);
  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    const load = async () => {
      const version = ++latestRequest;
      setLoading(true);
      try {
        const result = await followUpRequest({ action: 'history', partnerId, offset });
        if (active && version === latestRequest) { setData(result); setError(''); }
      } catch (err) { if (active && version === latestRequest) setError(err.message); }
      finally { if (active && version === latestRequest) setLoading(false); }
    };
    const timer = setTimeout(load, 0);
    const poll = setInterval(load, 20000);
    return () => { active = false; clearTimeout(timer); clearInterval(poll); };
  }, [partnerId, offset, refreshKey, refreshCount]);
  return { data, error, loading, refresh };
}
