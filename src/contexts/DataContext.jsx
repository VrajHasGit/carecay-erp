import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAll, subscribeCollection } from '../services/db';

const DataContext = createContext(null);

const COLLECTIONS = [
  'pur_inq', 'val', 'pfu', 'pcl', 'ob',
  'sal_inq', 'sfu', 'scl', 'sob', 'stk',
  'ws', 'pay', 'del', 'doc', 'cust',
  'dn', 'gp', 'sp', 'td', 'fin', 'sale_doc',
  'exp_rec', 'gst_inv', 'targets', 'feedback', 'tasks', 'users'
];

export function DataProvider({ children }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (colName) => {
    // With real-time listeners, manual refresh is mostly a no-op or fallback
    try {
      const records = await getAll(colName);
      setData(prev => ({ ...prev, [colName]: records }));
    } catch (e) {
      console.error(`refresh(${colName}):`, e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    // Used mainly for manual forcing if needed
    setLoading(true);
    try {
      const results = await Promise.all(
        COLLECTIONS.map(col => getAll(col).then(records => [col, records]))
      );
      const dataMap = Object.fromEntries(results);
      setData(dataMap);
    } catch (e) {
      console.error('refreshAll:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let loadedCount = 0;
    const unsubs = COLLECTIONS.map(col => {
      return subscribeCollection(col, (records) => {
        setData(prev => ({ ...prev, [col]: records }));
        loadedCount++;
        // If all collections have returned at least their first snapshot, stop loading
        if (loadedCount >= COLLECTIONS.length && loading) {
          setLoading(false);
        }
      });
    });

    // Fallback if some collections take too long
    const fallbackTimer = setTimeout(() => setLoading(false), 3000);

    return () => {
      clearTimeout(fallbackTimer);
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  const value = { data, loading, refresh, refreshAll };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
