
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import { isAdmin } from "../api/auth";
import "./table.css";

const ROOM_TYPE_OPTIONS = [
  { value: "2D", label: "2D" },
  { value: "3D", label: "3D" },
  { value: "IMAX", label: "IMAX" },
  { value: "Deluxe", label: "Deluxe" },
];

const SEAT_TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "couple", label: "Couple" },
];

const ROOM_FIELDS = [
  { name: "room_name", label: "Tên phòng", required: true },
  { name: "room_type", label: "Loại phòng", type: "select", options: ROOM_TYPE_OPTIONS },
  { name: "seat_count", label: "Số ghế (dự kiến)", type: "number" },
];

export default function RoomsPage() {
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");
  const admin = isAdmin();

  const roomOptions = rooms.rows.map((r) => ({
    value: r.room_id,
    label: `${r.room_name} (${r.room_type || "—"})`,
  }));

  const roomNameById = Object.fromEntries(
    rooms.rows.map((r) => [String(r.room_id), r.room_name]),
  );

  const SEAT_FIELDS = [
    { name: "room_id", label: "Thuộc phòng", type: "select", options: roomOptions, required: true },
    { name: "seat_number", label: "Số ghế", required: true, placeholder: "VD: A1, B2..." },
    { name: "seat_type", label: "Loại ghế", type: "select", options: SEAT_TYPE_OPTIONS },
  ];

  return (
    <>
      <CrudSection
        title="Phòng chiếu"
        subtitle="Dữ liệu thật từ API /rooms"
        apiPath="rooms"
        idKey="room_id"
        rows={rooms.rows}
        loading={rooms.loading}
        error={rooms.error}
        reload={rooms.reload}
        fields={ROOM_FIELDS}
        canCreate={admin}
        canEdit={admin}
        canDelete={admin}
        toDto={(v) => ({
          ...v,
          seat_count: v.seat_count === "" ? null : Number(v.seat_count),
        })}
        columns={[
          { key: "room_id", label: "Mã phòng" },
          { key: "room_name", label: "Tên phòng" },
          { key: "room_type", label: "Loại phòng" },
          { key: "seat_count", label: "Số ghế" },
        ]}
      />

      <div className="section-title">Ghế theo phòng</div>
      <CrudSection
        title="Ghế"
        subtitle=""
        apiPath="seats"
        idKey="seat_id"
        rows={seats.rows}
        loading={seats.loading}
        error={seats.error}
        reload={seats.reload}
        fields={SEAT_FIELDS}
        canCreate={admin}
        canEdit={admin}
        canDelete={admin}
        toDto={(v) => ({ ...v, room_id: Number(v.room_id) })}
        searchKeys={["seat_number", "seat_type"]}
        columns={[
          { key: "seat_id", label: "Mã ghế" },
          {
            key: "room_id",
            label: "Thuộc phòng",
            render: (v) => roomNameById[String(v)] || `#${v}`,
          },
          { key: "seat_number", label: "Số ghế" },
          { key: "seat_type", label: "Loại ghế" },
        ]}
      />
    </>
  );
}
