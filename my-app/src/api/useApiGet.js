// src/api/useApiGet.js
import { useEffect, useState } from "react";
import { getList } from "./apiClient";

// Giống useApiList, nhưng dùng cho endpoint trả về MỘT object tổng hợp
// (vd. /stats/overview) thay vì một mảng danh sách — useApiList sẽ âm
// thầm biến mọi response không phải mảng thành [], không dùng được ở đây.
export default function useApiGet(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getList(path)
      .then((res) => mounted && setData(res))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [path, reloadFlag]);

  const reload = () => setReloadFlag((f) => f + 1);
  return { data, loading, error, reload };
}
