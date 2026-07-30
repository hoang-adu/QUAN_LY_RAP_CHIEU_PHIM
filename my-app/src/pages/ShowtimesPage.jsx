// src/pages/ShowtimesPage.jsx
// Suất chiếu — CRUD đầy đủ. movie_id / room_id chọn qua dropdown lấy từ
// danh sách phim & phòng đang có, tránh gõ tay ID gây sai dữ liệu.
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import { isAdmin } from "../api/auth";
import "./table.css";

// Ngày hôm nay dạng "YYYY-MM-DD" theo giờ máy khách — dùng làm mốc so sánh
// và làm giá trị "min" cho input ngày để không cho chọn ngày đã qua.
function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// So cả ngày lẫn giờ với thời điểm hiện tại (không chỉ so ngày) để phân biệt
// suất đã chiếu xong / đang chiếu / sắp chiếu — vì cùng 1 ngày vẫn có suất đã
// qua giờ chiếu (buổi sáng) và suất chưa tới giờ (buổi tối).
function showtimeStatus(row) {
  if (!row.show_date) return { label: "—", cls: "" };
  const start = new Date(`${row.show_date}T${row.start_time || "00:00:00"}`);
  const end = row.end_time ? new Date(`${row.show_date}T${row.end_time}`) : null;
  const now = new Date();
  if (end && now >= start && now <= end) return { label: "Đang chiếu", cls: "st-status--live" };
  if (now > (end || start)) return { label: "Đã kết thúc", cls: "st-status--ended" };
  return { label: "Sắp chiếu", cls: "st-status--upcoming" };
}

export default function ShowtimesPage() {
  const showtimes = useApiList("showtimes");
  const movies = useApiList("movies");
  const rooms = useApiList("rooms");
  const admin = isAdmin();

  const movieOptions = movies.rows.map((m) => ({ value: m.movie_id, label: m.title }));
  const roomOptions = rooms.rows.map((r) => ({ value: r.room_id, label: r.room_name }));
  const movieNameById = Object.fromEntries(movies.rows.map((m) => [String(m.movie_id), m.title]));
  const roomNameById = Object.fromEntries(rooms.rows.map((r) => [String(r.room_id), r.room_name]));

  // CrudSection tìm kiếm theo giá trị thô của từng field trên row (r[k]),
  // nhưng movie_id/room_id trên row chỉ là số ID chứ không phải tên hiển thị
  // trên bảng -> gắn thêm 2 field "ảo" movie_title/room_name để tìm theo
  // tên phim và tên phòng cũng ra kết quả, không chỉ tìm theo ID số.
  const rowsWithNames = React.useMemo(
    () =>
      showtimes.rows.map((r) => ({
        ...r,
        movie_title: movieNameById[String(r.movie_id)] || "",
        room_name: roomNameById[String(r.room_id)] || "",
      })),
    [showtimes.rows, movieNameById, roomNameById],
  );

  // "sortKey" ghép ngày + giờ thành 1 chuỗi để so sánh sớm/muộn cho đúng —
  // so trực tiếp show_date rồi mới tới start_time nếu trùng ngày.
  const sortKey = (row) => `${row.show_date || ""} ${row.start_time || ""}`;
  const SORT_OPTIONS = [
    {
      value: "date_asc",
      label: "Suất chiếu: Sớm nhất",
      sort: (a, b) => sortKey(a).localeCompare(sortKey(b)),
    },
    {
      value: "date_desc",
      label: "Suất chiếu: Muộn nhất",
      sort: (a, b) => sortKey(b).localeCompare(sortKey(a)),
    },
  ];

  // Lọc theo phim bằng dropdown (chọn tên phim có sẵn) thay vì phải gõ đúng
  // tên/ID phim vào ô tìm kiếm.
  const FILTER_OPTIONS = [
    {
      key: "movie_title",
      label: "phim",
      allLabel: "Tất cả phim",
      getValues: (row) => [row.movie_title].filter(Boolean),
    },
  ];

  const FIELDS = [
    { name: "movie_id", label: "Phim", type: "select", options: movieOptions, required: true },
    { name: "room_id", label: "Phòng chiếu", type: "select", options: roomOptions, required: true },
    {
      name: "show_date",
      label: "Ngày chiếu",
      type: "date",
      required: true,
      // Chỉ chặn ngày quá khứ khi TẠO MỚI; khi sửa 1 suất đã có sẵn ngày cũ
      // thì không ép min, tránh việc ô ngày bị "kẹt" không hiển thị được giá
      // trị cũ khi mở form sửa.
      min: (editingRow) => (editingRow ? undefined : todayStr()),
    },
    { name: "start_time", label: "Giờ bắt đầu", type: "time", required: true },
    { name: "end_time", label: "Giờ kết thúc", type: "time", required: true },
  ];

  return (
    <CrudSection
      title="Suất chiếu"
      apiPath="showtimes"
      idKey="showtime_id"
      rows={rowsWithNames}
      loading={showtimes.loading}
      error={showtimes.error}
      reload={showtimes.reload}
      fields={FIELDS}
      canCreate={admin}
      canEdit={admin}
      canDelete={admin}
      toDto={(v) => ({ ...v, movie_id: Number(v.movie_id), room_id: Number(v.room_id) })}
      searchKeys={["showtime_id", "movie_title", "room_name", "show_date"]}
      sortOptions={SORT_OPTIONS}
      filterOptions={FILTER_OPTIONS}
      columns={[
        { key: "showtime_id", label: "Mã suất" },
        { key: "movie_id", label: "Phim", render: (v) => movieNameById[String(v)] || `#${v}` },
        { key: "room_id", label: "Phòng", render: (v) => roomNameById[String(v)] || `#${v}` },
        { key: "show_date", label: "Ngày chiếu" },
        { key: "start_time", label: "Giờ bắt đầu" },
        { key: "end_time", label: "Giờ kết thúc" },
        {
          key: "status",
          label: "Trạng thái",
          render: (_, row) => {
            const s = showtimeStatus(row);
            return <span className={`st-status ${s.cls}`}>{s.label}</span>;
          },
        },
      ]}
    />
  );
}