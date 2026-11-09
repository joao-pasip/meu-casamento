import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
export function useWeddingData() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const result = await api('public'); setData(result); setError(''); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    refresh();
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    const element = document.getElementById('presentes'); if (element) observer.observe(element);
    const timer = setInterval(() => { if (visible && !document.hidden) refresh(); }, 60000);
    const focus = () => { if (!document.hidden) refresh(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    return () => { clearInterval(timer); observer.disconnect(); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [refresh]);
  return { data, setData, error, loading, refresh };
}
