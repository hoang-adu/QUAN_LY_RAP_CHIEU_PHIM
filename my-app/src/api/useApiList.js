// src/api/useApiList.js
import { useEffect, useState } from "react";
import { getList } from "./apiClient";

// Hook dùng chung: fetch danh sách từ 1 API path thật, trả về {rows, loading, error, reload}
export default function useApiList(path) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getList(path)
      .then((data) => mounted && setRows(Array.isArray(data) ? data : []))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [path, reloadFlag]);

  const reload = () => setReloadFlag((f) => f + 1);
  return { rows, loading, error, reload };
}
