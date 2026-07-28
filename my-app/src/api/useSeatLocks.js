// src/api/useSeatLocks.js
// Hook dùng chung cho các trang chọn ghế (NewBookingPage, CustomerBookingPage):
//  - Poll định kỳ danh sách ghế đang bị NGƯỜI KHÁC giữ -> tô màu sơ đồ ghế
//    gần-như-realtime (không cần WebSocket, đủ dùng cho quy mô đồ án).
//  - Khi người dùng chọn ghế -> gọi hold(); bỏ chọn / đổi suất chiếu / rời
//    trang -> tự động release() để nhả chỗ cho người khác.
//  - Heartbeat định kỳ gia hạn các ghế đang giữ để không hết hạn giữa chừng
//    khi khách vẫn đang thao tác (TTL ở backend là 5 phút).
import { useCallback, useEffect, useRef, useState } from "react";
import { holdSeat, releaseSeat, listSeatLocks } from "./seatLocks";

const POLL_MS = 4000;
const HEARTBEAT_MS = 60 * 1000; // gia hạn mỗi 1 phút, TTL backend 5 phút

export default function useSeatLocks(showtimeId) {
  const [lockedByOthers, setLockedByOthers] = useState(new Set());
  const heldSeatsRef = useRef(new Set());

  const refreshLocks = useCallback(async () => {
    if (!showtimeId) return;
    try {
      const list = await listSeatLocks(showtimeId);
      setLockedByOthers(
        new Set(list.filter((l) => !l.mine).map((l) => String(l.seat_id))),
      );
    } catch {
      // Poll lỗi (mất mạng tạm thời...) thì bỏ qua, thử lại ở vòng sau.
    }
  }, [showtimeId]);

  // Poll danh sách ghế bị giữ.
  useEffect(() => {
    if (!showtimeId) return undefined;
    refreshLocks();
    const timer = setInterval(refreshLocks, POLL_MS);
    return () => clearInterval(timer);
  }, [showtimeId, refreshLocks]);

  // Heartbeat gia hạn các ghế mình đang giữ.
  useEffect(() => {
    if (!showtimeId) return undefined;
    const timer = setInterval(() => {
      heldSeatsRef.current.forEach((seatId) => {
        holdSeat(showtimeId, seatId).catch(() => {});
      });
    }, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [showtimeId]);

  // Nhả toàn bộ ghế đang giữ khi đổi suất chiếu hoặc rời trang.
  useEffect(() => {
    return () => {
      heldSeatsRef.current.forEach((seatId) => {
        releaseSeat(showtimeId, seatId, { keepalive: true }).catch(() => {});
      });
      heldSeatsRef.current = new Set();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId]);

  const hold = useCallback(
    async (seatId) => {
      await holdSeat(showtimeId, seatId);
      heldSeatsRef.current.add(String(seatId));
      refreshLocks();
    },
    [showtimeId, refreshLocks],
  );

  const release = useCallback(
    async (seatId) => {
      heldSeatsRef.current.delete(String(seatId));
      try {
        await releaseSeat(showtimeId, seatId);
      } catch {
        // Ghế có thể đã hết hạn/đã bán trước đó — bỏ qua lỗi khi nhả.
      }
      refreshLocks();
    },
    [showtimeId, refreshLocks],
  );

  return { lockedByOthers, hold, release, refreshLocks };
}
