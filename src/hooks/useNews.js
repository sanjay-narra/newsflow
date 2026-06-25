import { useState, useEffect, useCallback } from "react";

const BASE_URL = "/api/news";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

function useNews(activeCategory, searchQuery) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWithRetry = async (url, retries = MAX_RETRIES) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.errors) throw new Error(data.errors[0] || "Failed to fetch news");
      return data;
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, retries - 1);
      }
      throw err;
    }
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let url;

      if (searchQuery) {
        url = `${BASE_URL}?type=search&query=${encodeURIComponent(searchQuery)}`;
      } else if (activeCategory.id === "india") {
        url = `${BASE_URL}?type=india`;
      } else if (activeCategory.id === "world") {
        url = `${BASE_URL}?type=world`;
      } else {
        url = `${BASE_URL}?type=category&category=${activeCategory.id}`;
      }

      const data = await fetchWithRetry(url);
      const valid = (data.articles || []).filter((a) => a.title && a.image);
      setArticles(valid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { articles, loading, error, fetchNews };
}

export default useNews;