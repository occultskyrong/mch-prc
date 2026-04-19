import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  deps?: unknown[];
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
  deps = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (page: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await fetchFn(page, pageSize);
      setItems(prev => page === 1 ? result.data : [...prev, ...result.data]);
      setTotal(result.total);
      setHasMore(result.data.length === pageSize && items.length + result.data.length < result.total);
    } catch (e) {
      console.error('Infinite scroll fetch error:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFn, pageSize]);

  useEffect(() => {
    setItems([]);
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      pageRef.current += 1;
      loadPage(pageRef.current);
    }
  }, [hasMore, loadPage]);

  const reset = useCallback(() => {
    setItems([]);
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1);
  }, [loadPage]);

  return { items, loading, hasMore, total, loadMore, reset };
}
