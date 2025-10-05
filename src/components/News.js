// src/components/News.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
// Keep your config as key arrays. If you only have single strings, this still works.
import { NEWS_API_KEYS, NEWS_DATA_API_KEYS } from "../config";

const PAGE_SIZE = 6;

// --- helpers -------------------------------------------------
const toDateKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
};

const isToday = (dateStr) => toDateKey(dateStr) === toDateKey(new Date());

const normalizeFromNewsData = (item) => ({
  title: item.title || "",
  description: item.description || "",
  url: item.link || "",
  image: item.image_url || "",
  source: item.source_id || (item.source && item.source.name) || "Unknown",
  publishedAt: item.pubDate || item.date || item.pubDate_tz || "",
});

const normalizeFromNewsAPI = (item) => ({
  title: item.title || "",
  description: item.description || "",
  url: item.url || "",
  image: item.urlToImage || "",
  source: (item.source && item.source.name) || "Unknown",
  publishedAt: item.publishedAt || "",
});

const dedupeByUrl = (arr) => {
  const map = new Map();
  for (const a of arr) {
    const key = a.url || a.title; // fallback to title if url missing
    if (key && !map.has(key)) map.set(key, a);
  }
  return Array.from(map.values());
};

// --- component -----------------------------------------------
const News = ({ city }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Provider tracking
  const [provider, setProvider] = useState("newsdata"); // "newsdata" | "newsapi"
  const [ndNext, setNdNext] = useState(null); // nextPage token for NewsData
  const [naPage, setNaPage] = useState(1); // numeric page for NewsAPI
  const [hasMore, setHasMore] = useState(true);

  // key rotation (if quota exceeded)
  const [ndKeyIndex, setNdKeyIndex] = useState(0);
  const [naKeyIndex, setNaKeyIndex] = useState(0);

  // normalize config whether arrays or single strings
  const ndKeys = useMemo(
    () => (Array.isArray(NEWS_DATA_API_KEYS) ? NEWS_DATA_API_KEYS : [NEWS_DATA_API_KEYS]),
    []
  );
  const naKeys = useMemo(
    () => (Array.isArray(NEWS_API_KEYS) ? NEWS_API_KEYS : [NEWS_API_KEYS]),
    []
  );

  const query = useMemo(() => (city ? city.toLowerCase() : "india"), [city]);

  const fetchFromNewsData = useCallback(
    async (loadMore = false) => {
      if (!ndKeys[ndKeyIndex]) return false;

      // For first call, omit &page to get page 1; for "Load More", pass the returned token.
      let url =
        `https://newsdata.io/api/1/news?apikey=${ndKeys[ndKeyIndex]}` +
        `&q=${encodeURIComponent(query)}` +
        `&language=en`;
      if (loadMore && ndNext) {
        url += `&page=${encodeURIComponent(ndNext)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "success" && Array.isArray(data.results)) {
        let list = data.results.map(normalizeFromNewsData);

        // On first page only, prefer today's items if available
        if (!loadMore) {
          const todays = list.filter((a) => a.publishedAt && isToday(a.publishedAt));
          if (todays.length > 0) list = todays;
        }

        setArticles((prev) => dedupeByUrl(loadMore ? [...prev, ...list] : list));
        setNdNext(data.nextPage || null);
        setHasMore(Boolean(data.nextPage));
        setProvider("newsdata");
        return list.length > 0 || Boolean(data.nextPage);
      }

      // If quota or error -> rotate key or signal failure
      const msg = (data && (data.message || data.results || data.status)) || "";
      const looksLikeQuota =
        typeof msg === "string" && /quota|limit|usage|exceed/i.test(msg);
      if (looksLikeQuota && ndKeyIndex + 1 < ndKeys.length) {
        setNdKeyIndex((i) => i + 1);
        return fetchFromNewsData(loadMore);
      }

      return false;
    },
    [ndKeys, ndKeyIndex, query, ndNext]
  );

  const fetchFromNewsAPI = useCallback(
    async (pageToUse = 1, loadMore = false) => {
      if (!naKeys[naKeyIndex]) return false;

      const url =
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}` +
        `&sortBy=publishedAt&pageSize=${PAGE_SIZE}&page=${pageToUse}&apiKey=${naKeys[naKeyIndex]}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "ok" && Array.isArray(data.articles)) {
        let list = data.articles.map(normalizeFromNewsAPI);

        // On first page only, prefer today's items if available
        if (!loadMore) {
          const todays = list.filter((a) => a.publishedAt && isToday(a.publishedAt));
          if (todays.length > 0) list = todays;
        }

        setArticles((prev) => dedupeByUrl(loadMore ? [...prev, ...list] : list));
        setHasMore(list.length === PAGE_SIZE); // heuristic
        setProvider("newsapi");
        setNaPage(pageToUse);
        return list.length > 0;
      }

      // Rotate key if quota
      const msg = (data && (data.message || data.code || data.status)) || "";
      const looksLikeQuota =
        typeof msg === "string" && /rateLimited|quota|maximum|exceed|rate/i.test(msg);
      if (looksLikeQuota && naKeyIndex + 1 < naKeys.length) {
        setNaKeyIndex((i) => i + 1);
        return fetchFromNewsAPI(pageToUse, loadMore);
      }

      return false;
    },
    [naKeys, naKeyIndex, query]
  );

  const initialFetch = useCallback(async () => {
    setLoading(true);
    setArticles([]);
    setHasMore(true);
    setProvider("newsdata");
    setNdNext(null);
    setNaPage(1);
    setNdKeyIndex(0);
    setNaKeyIndex(0);

    // Try NewsData first; if nothing useful, fall back to NewsAPI page 1
    const ok = await fetchFromNewsData(false);
    if (!ok) {
      await fetchFromNewsAPI(1, false);
    }
    setLoading(false);
  }, [fetchFromNewsData, fetchFromNewsAPI]);

  useEffect(() => {
    initialFetch();
  }, [city, initialFetch]);

  const handleLoadMore = async () => {
    if (loading) return;

    setLoading(true);

    if (provider === "newsdata") {
      if (ndNext) {
        const ok = await fetchFromNewsData(true);
        if (ok) {
          setLoading(false);
          return;
        }
      }
      // If NewsData has no next page or failed, try NewsAPI from page 1 (or next)
      const ok2 = await fetchFromNewsAPI(naPage + 1, true);
      if (ok2) {
        setProvider("newsapi");
        setLoading(false);
        return;
      }
      setHasMore(false);
      setLoading(false);
      return;
    }

    // provider === "newsapi"
    const ok = await fetchFromNewsAPI(naPage + 1, true);
    if (!ok) setHasMore(false);
    setLoading(false);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center animate-pulse">
        📰 Fetching the latest news...
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl shadow-xl bg-white max-w-4xl mx-auto space-y-6">
      <motion.h2
        className="text-2xl font-extrabold text-blue-800 border-b pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        🗞 Top Headlines in {city || "India"}
      </motion.h2>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {articles.map((a, idx) => (
          <motion.a
            key={(a.url || a.title) + "-" + idx}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            className="bg-gray-50 hover:bg-blue-50 transition-all rounded-xl shadow-md hover:shadow-xl p-4 flex flex-col h-full"
          >
            <div className="flex items-start space-x-4">
              <img
                src={a.image || "https://via.placeholder.com/100"}
                alt="news"
                className="w-24 h-24 object-cover rounded-lg shadow-sm"
              />
              <div className="flex-1 flex flex-col">
                <h3 className="text-md font-semibold text-gray-800 group-hover:text-blue-700 line-clamp-2">
                  {a.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                  {a.description || "No description available."}
                </p>
                <div className="text-xs text-gray-400 mt-2">
                  {a.source} •{" "}
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Load More
          </button>
        </div>
      )}

      {loading && articles.length > 0 && (
        <div className="text-center text-gray-500">Loading more…</div>
      )}
    </div>
  );
};

export default News;
