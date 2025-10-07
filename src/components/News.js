// src/components/News.js
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../config";

const News = ({ city }) => {
  const [articles, setArticles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4); // ✅ show 4 initially
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError("");
      setVisibleCount(4); // reset on city change

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/news?country=in&city=${encodeURIComponent(
            city || "India"
          )}`
        );
        const data = await res.json();

        if (data.status === "ok" && Array.isArray(data.articles)) {
          setArticles(data.articles);
        } else {
          setError("No news available right now.");
        }
      } catch (err) {
        console.error("News fetch error:", err);
        setError("Unable to fetch news.");
      }

      setLoading(false);
    };

    fetchNews();
  }, [city]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4); // ✅ load next 4
  };

  if (loading) {
    return (
      <div className="p-4 text-gray-500 text-center animate-pulse">
        📰 Fetching the latest news...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-center">
        ⚠️ {error}
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
        <AnimatePresence>
          {articles.slice(0, visibleCount).map((a, idx) => (
            <motion.a
              key={(a.url || a.title) + "-" + idx}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="bg-gray-50 hover:bg-blue-50 transition-all rounded-xl shadow-md hover:shadow-xl p-4 flex flex-col h-full"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={a.urlToImage || "https://via.placeholder.com/100"}
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
                    {a.source?.name || "Unknown"} •{" "}
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
        </AnimatePresence>
      </div>

      {/* ✅ Load More button with animation */}
      {visibleCount < articles.length && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={handleLoadMore}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Load More
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default News;
