import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApiList from "../api/useApiList";
import { createItem } from "../api/apiClient";
import useSeatLocks from "../api/useSeatLocks";
import { SEAT_TYPE_LABELS } from "../utils/seatPricing";
import { getCurrentPrices } from "../api/ticketPrices";
import { useToast } from "../components/ToastContext";
import { redeemVoucher, vouchersOfCustomer } from "../api/vouchers";
import Modal from "../components/Modal";
import "./table.css";
import "../components/ui.css";
// Tái dùng đúng CSS của sơ đồ ghế bên khách hàng (cb-screen, cb-seat-map,
// cb-seat-row...) để sơ đồ ghế bên quản lý/nhân viên nhìn giống hệt bên
// khách hàng, thay vì lưới nút seat-btn cũ (không có "MÀN HÌNH", không gom
// theo hàng ghế).
import "./customerBooking.css";

const MIN_REDEEM_POINTS = 100;
const REDEEM_POINTS_STEP = 50;
const VOUCHER_VALUE_PER_POINT = 500;

// Khách mua trực tiếp tại quầy không phải lúc nào cũng có tài khoản (không
// cần password/email) — vẫn cần 1 dòng "customers" để gắn booking, nên cho
// nhân viên tạo nhanh khách vãng lai ngay tại đây thay vì bắt buộc phải
// chọn từ danh sách khách đã có sẵn.

export default function NewBookingPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const movies = useApiList("movies");
  const rooms = useApiList("rooms");
  const showtimes = useApiList("showtimes");
  const seats = useApiList("seats");
  const tickets = useApiList("tickets");
  const customers = useApiList("customers");
  const products = useApiList("products");

  const [movieId, setMovieId] = useState("");
  const [showtimeId, setShowtimeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerKw, setCustomerKw] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [createPayment, setCreatePayment] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [foodQuantities, setFoodQuantities] = useState({});

  // Giá vé hiện hành lấy TRỰC TIẾP từ API quản lý giá (nguồn sự thật thật
  // sự, có thể đổi bất cứ lúc nào ở trang "Quản lý giá vé") — không dùng
  // hằng số hardcode cũ nữa, để giá hiển thị/gửi lên luôn khớp giá đang
  // áp dụng thật, tránh tạo đơn với giá cũ sau khi admin đổi giá.
  const [currentPrices, setCurrentPrices] = useState({});
  useEffect(() => {
    getCurrentPrices()
      .then(setCurrentPrices)
      .catch(() => setCurrentPrices({}));
  }, []);
  const priceForSeatType = (seatType) =>
    Number(currentPrices[seatType] ?? currentPrices.standard ?? 0);

  // Form tạo nhanh khách vãng lai (mua tại quầy, không cần tài khoản).
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Voucher (đổi từ điểm tích lũy) của khách hàng đang chọn — nhân viên có
  // thể áp dụng ngay vào đơn đang tạo tại quầy.
  const [customerVouchers, setCustomerVouchers] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(String(MIN_REDEEM_POINTS));
  const [redeemError, setRedeemError] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Ghế đang được NGƯỜI KHÁC giữ tạm (seat-lock) cho suất chiếu đang chọn —
  // poll realtime để tránh chọn trùng ghế người khác đang thao tác dở.
  const { lockedByOthers, hold, release } = useSeatLocks(showtimeId || null);

  const filteredShowtimes = useMemo(
    () => showtimes.rows.filter((s) => !movieId || String(s.movie_id) === String(movieId)),
    [showtimes.rows, movieId],
  );

  const currentShowtime = useMemo(
    () => showtimes.rows.find((s) => String(s.showtime_id) === String(showtimeId)),
    [showtimes.rows, showtimeId],
  );

  const seatById = useMemo(
    () => Object.fromEntries(seats.rows.map((s) => [String(s.seat_id), s])),
    [seats.rows],
  );

  const roomSeats = useMemo(() => {
    if (!currentShowtime) return [];
    return seats.rows
      .filter((s) => String(s.room_id) === String(currentShowtime.room_id))
      .sort((a, b) => String(a.seat_number).localeCompare(String(b.seat_number)));
  }, [seats.rows, currentShowtime]);

  // Gom ghế theo hàng (chữ cái đầu của seat_number) để vẽ sơ đồ giống hệt
  // sơ đồ bên khách hàng (xem CustomerBookingPage.jsx#seatRows).
  const seatRows = useMemo(() => {
    const map = new Map();
    for (const s of roomSeats) {
      const row = String(s.seat_number || "").charAt(0) || "?";
      if (!map.has(row)) map.set(row, []);
      map.get(row).push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([row, list]) => ({
        row,
        list: list.sort(
          (a, b) =>
            parseInt(String(a.seat_number).slice(1), 10) -
            parseInt(String(b.seat_number).slice(1), 10),
        ),
      }));
  }, [roomSeats]);

  const takenSeatIds = useMemo(() => {
    if (!showtimeId) return new Set();
    return new Set(
      tickets.rows
        .filter((t) => String(t.showtime_id) === String(showtimeId))
        .map((t) => String(t.seat_id)),
    );
  }, [tickets.rows, showtimeId]);

  const filteredCustomers = useMemo(() => {
    if (!customerKw.trim()) return customers.rows.slice(0, 8);
    const kw = customerKw.trim().toLowerCase();
    return customers.rows
      .filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(kw) ||
          (c.phone || "").includes(kw) ||
          (c.email || "").toLowerCase().includes(kw),
      )
      .slice(0, 8);
  }, [customers.rows, customerKw]);

  const selectedCustomer = customers.rows.find(
    (c) => String(c.customer_id) === String(customerId),
  );

  function loadCustomerVouchers(id) {
    if (!id) {
      setCustomerVouchers([]);
      return;
    }
    vouchersOfCustomer(id)
      .then((rows) => {
        const now = Date.now();
        setCustomerVouchers(
          (rows || []).filter(
            (v) => v.status === "unused" && (!v.expires_at || new Date(v.expires_at).getTime() > now),
          ),
        );
      })
      .catch(() => setCustomerVouchers([]));
  }

  useEffect(() => {
    setVoucherCode("");
    loadCustomerVouchers(customerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const redeemPointsNum = Number(redeemPoints) || 0;
  const redeemPreview = redeemPointsNum * VOUCHER_VALUE_PER_POINT;

  function validateRedeem(points) {
    if (!Number.isInteger(points) || points <= 0) return "Vui lòng nhập số điểm hợp lệ.";
    if (points < MIN_REDEEM_POINTS) return `Số điểm đổi tối thiểu là ${MIN_REDEEM_POINTS} điểm.`;
    if (points % REDEEM_POINTS_STEP !== 0) return `Số điểm đổi phải là bội số của ${REDEEM_POINTS_STEP}.`;
    if (points > Number(selectedCustomer?.points ?? 0)) return "Khách không đủ điểm để đổi voucher này.";
    return "";
  }

  async function handleRedeemForCustomer() {
    const points = redeemPointsNum;
    const error = validateRedeem(points);
    if (error) {
      setRedeemError(error);
      return;
    }
    setRedeeming(true);
    setRedeemError("");
    try {
      const voucher = await redeemVoucher(points, customerId);
      customers.reload();
      loadCustomerVouchers(customerId);
      setVoucherCode(voucher.code);
      setShowRedeemModal(false);
      setRedeemPoints(String(MIN_REDEEM_POINTS));
      toast.success(`Đã đổi ${points} điểm lấy voucher ${voucher.code} và áp dụng cho đơn này.`);
    } catch (err) {
      setRedeemError(err.message || "Không thể đổi điểm, vui lòng thử lại.");
    } finally {
      setRedeeming(false);
    }
  }

  async function toggleSeat(seat) {
    const id = String(seat.seat_id);
    if (takenSeatIds.has(id) || lockedByOthers.has(id)) return;

    if (selectedSeats.includes(id)) {
      setSelectedSeats((cur) => cur.filter((x) => x !== id));
      release(id);
      return;
    }

    try {
      // Giữ ghế trước ở backend — nếu người khác vừa giữ trước 1 nhịp thì
      // API sẽ báo lỗi ngay, tránh cho khách điền hết thông tin rồi mới biết.
      await hold(id);
      setSelectedSeats((cur) => [...cur, id]);
    } catch (err) {
      toast.error(err.message || `Ghế ${seat.seat_number} vừa được người khác giữ.`);
    }
  }

  async function handleCreateWalkInCustomer() {
    if (!newCustomerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng.");
      return;
    }
    setCreatingCustomer(true);
    try {
      // Không gửi email/password — khách vãng lai không cần tài khoản để
      // đăng nhập, chỉ cần 1 hồ sơ để gắn với đơn đặt vé này.
      const created = await createItem("customers", {
        full_name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
      });
      customers.reload();
      setCustomerId(created.customer_id);
      setCustomerKw("");
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      toast.success(`Đã thêm khách hàng "${created.full_name}" và chọn cho đơn này.`);
    } catch (err) {
      toast.error(err.message || "Không thể tạo khách hàng mới.");
    } finally {
      setCreatingCustomer(false);
    }
  }

  function resetForm() {
    setSelectedSeats([]);
    setFoodQuantities({});
    setVoucherCode("");
    // Không cần gọi release() thủ công ở đây: vé tạo thành công thì backend
    // đã tự xoá seat-lock tương ứng (xem TicketsService.create).
  }

  const ticketTotal = selectedSeats.reduce((sum, seatId) => {
    const seat = seatById[seatId];
    return sum + priceForSeatType(seat?.seat_type);
  }, 0);
  const foodTotal = products.rows.reduce(
    (sum, product) => sum + Number(product.price || 0) * Number(foodQuantities[product.product_id] || 0),
    0,
  );
  const total = ticketTotal + foodTotal;
  const foodItems = Object.entries(foodQuantities)
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity: Number(quantity) }));

  // Voucher chỉ áp dụng được khi thu tiền ngay (đúng theo backend) — nếu
  // nhân viên bỏ tick "thanh toán ngay" thì bỏ qua voucher đã chọn.
  const selectedVoucher = createPayment
    ? customerVouchers.find((v) => v.code === voucherCode) || null
    : null;
  const discountAmount = selectedVoucher ? Math.min(Number(selectedVoucher.discount_amount), total) : 0;
  const payableTotal = total - discountAmount;

  async function handleSubmit() {
    if (!showtimeId) return toast.error("Vui lòng chọn suất chiếu.");
    if (!customerId) return toast.error("Vui lòng chọn khách hàng.");
    if (selectedSeats.length === 0) return toast.error("Vui lòng chọn ít nhất 1 ghế.");

    setSubmitting(true);
    try {
      // Gọi 1 API duy nhất (tạo đơn + tạo vé cho từng ghế + thu tiền nếu
      // chọn). Backend tự dọn sạch nếu có ghế bị người khác mua giữa
      // chừng, không còn tình trạng "đơn mồ côi" thiếu vé/thiếu thanh toán.
      const result = await createItem("bookings/checkout", {
        customer_id: Number(customerId),
        showtime_id: Number(showtimeId),
        seats: selectedSeats.map((seatId) => ({
          seat_id: Number(seatId),
          ticket_price: priceForSeatType(seatById[seatId]?.seat_type),
        })),
        food_items: foodItems,
        pay: createPayment,
        payment_method: paymentMethod,
        voucher_code: selectedVoucher ? selectedVoucher.code : undefined,
      });
      const bookingId = result.booking?.booking_id;
      const pointsEarned = Number(result.points_earned || 0);

      toast.success(
        `Đã tạo đơn đặt vé #${bookingId} với ${selectedSeats.length} ghế.` +
          (pointsEarned > 0 ? ` Khách được cộng ${pointsEarned} điểm tích lũy.` : ""),
      );
      customers.reload();
      resetForm();
      navigate("/bookings");
    } catch (err) {
      toast.error(
        err.message ||
          "Không thể tạo đơn đặt vé — có thể một ghế vừa bị người khác đặt, vui lòng thử lại.",
      );
      tickets.reload();
    } finally {
      setSubmitting(false);
    }
  }

  const busy = movies.loading || rooms.loading || showtimes.loading;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Bán vé mới</div>
          <div className="page-sub">
            Chọn suất chiếu, sơ đồ ghế và khách hàng để tạo đơn đặt vé
          </div>
        </div>
      </div>

      {busy ? (
        <div className="et-status">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="ui-form-grid" style={{ marginBottom: 18 }}>
            <div className="ui-field">
              <label>Phim</label>
              <select
                value={movieId}
                onChange={(e) => {
                  setMovieId(e.target.value);
                  setShowtimeId("");
                  setSelectedSeats([]);
                }}
              >
                <option value="">-- Tất cả phim --</option>
                {movies.rows.map((m) => (
                  <option key={m.movie_id} value={m.movie_id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="ui-field">
              <label>Suất chiếu</label>
              <select
                value={showtimeId}
                onChange={(e) => {
                  setShowtimeId(e.target.value);
                  setSelectedSeats([]);
                }}
              >
                <option value="">-- Chọn suất chiếu --</option>
                {filteredShowtimes.map((s) => {
                  const room = rooms.rows.find((r) => String(r.room_id) === String(s.room_id));
                  return (
                    <option key={s.showtime_id} value={s.showtime_id}>
                      {s.show_date} · {s.start_time} · {room?.room_name || `Phòng #${s.room_id}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {showtimeId && (
            <>
              <div className="section-title">Sơ đồ ghế</div>
              <p className="cb-hint">
                Ghế đã chọn sẽ được giữ trong 5 phút — quá thời gian mà chưa tạo đơn, ghế sẽ tự trống lại cho khách khác.
              </p>

              {roomSeats.length === 0 ? (
                <div className="et-status">Phòng chiếu này chưa được khai báo ghế.</div>
              ) : (
                <div className="cb-screen-area">
                  <div className="cb-screen">
                    <div className="cb-screen__curve" />
                    <span>MÀN HÌNH</span>
                  </div>

                  <div className="cb-seat-map">
                    {seatRows.map(({ row, list }) => (
                      <div className="cb-seat-row" key={row}>
                        <span className="cb-seat-row__label">{row}</span>
                        <div className="cb-seat-row__seats">
                          {list.map((seat) => {
                            const seatId = String(seat.seat_id);
                            const taken = takenSeatIds.has(seatId);
                            const held = lockedByOthers.has(seatId);
                            const selected = selectedSeats.includes(seatId);
                            return (
                              <button
                                type="button"
                                key={seat.seat_id}
                                className={
                                  "cb-seat" +
                                  (taken ? " taken" : "") +
                                  (!taken && held ? " held" : "") +
                                  (selected ? " selected" : "") +
                                  (seat.seat_type === "vip" ? " vip" : "") +
                                  (seat.seat_type === "couple" ? " couple" : "")
                                }
                                disabled={taken || (held && !selected)}
                                onClick={() => toggleSeat(seat)}
                                title={
                                  taken
                                    ? "Ghế đã bán"
                                    : held
                                      ? "Ghế đang được người khác giữ, thử lại sau ít phút"
                                      : `${SEAT_TYPE_LABELS[seat.seat_type] || seat.seat_type} — ${priceForSeatType(seat.seat_type).toLocaleString("vi-VN")} đ`
                                }
                              >
                                {String(seat.seat_number).slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cb-legend">
                    <div className="cb-legend__row">
                      <span><i className="cb-dot avail" /> Còn trống</span>
                      <span><i className="cb-dot selected" /> Đang chọn</span>
                      <span><i className="cb-dot held" /> Đang giữ</span>
                      <span><i className="cb-dot taken" /> Đã bán</span>
                    </div>
                    <div className="cb-legend__row cb-legend__row--types">
                      {["standard", "vip", "couple"]
                        .map((t) => ({ type: t, price: priceForSeatType(t) }))
                        .sort((a, b) => a.price - b.price)
                        .map(({ type, price }) => (
                          <span key={type}>
                            <i className={`cb-dot ${type}`} /> {SEAT_TYPE_LABELS[type]} · {price.toLocaleString("vi-VN")}đ
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="section-title">Khách hàng</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                <div className="ui-field" style={{ maxWidth: 380, marginBottom: 0, flex: 1 }}>
                  <input
                    placeholder="🔍 Tìm theo tên, SĐT, email..."
                    value={customerKw}
                    onChange={(e) => setCustomerKw(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="ui-btn ui-btn-ghost ui-btn-sm"
                  onClick={() => setShowNewCustomerForm((v) => !v)}
                >
                  {showNewCustomerForm ? "Hủy" : "+ Khách mới"}
                </button>
              </div>

              {showNewCustomerForm && (
                <div className="et-table-wrap" style={{ padding: 14, marginBottom: 12 }}>
                  <div className="page-sub" style={{ marginBottom: 8 }}>
                    Khách mua tại quầy, không cần tài khoản — chỉ cần tên (và SĐT nếu có).
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div className="ui-field" style={{ marginBottom: 0 }}>
                      <label>Tên khách hàng</label>
                      <input
                        placeholder="Nguyễn Văn A"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="ui-field" style={{ marginBottom: 0 }}>
                      <label>SĐT (tùy chọn)</label>
                      <input
                        placeholder="09xxxxxxxx"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary ui-btn-sm"
                      disabled={creatingCustomer}
                      onClick={handleCreateWalkInCustomer}
                    >
                      {creatingCustomer ? "Đang thêm..." : "Thêm & chọn"}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {filteredCustomers.map((c) => (
                  <button
                    type="button"
                    key={c.customer_id}
                    className={
                      "ui-btn ui-btn-sm " +
                      (String(customerId) === String(c.customer_id) ? "ui-btn-primary" : "ui-btn-ghost")
                    }
                    onClick={() => setCustomerId(c.customer_id)}
                  >
                    {c.full_name} · {c.phone || c.email || "chưa có SĐT"}
                  </button>
                ))}
                {customers.rows.length === 0 && (
                  <span className="page-sub">
                    Chưa có khách hàng nào trong hệ thống — bấm "+ Khách mới" để thêm.
                  </span>
                )}
              </div>

              {selectedCustomer && (
                <div className="et-table-wrap" style={{ padding: 14, marginBottom: 18 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: customerVouchers.length || createPayment ? 10 : 0 }}>
                    <span style={{ fontSize: 13 }}>
                      ⭐ Điểm tích lũy của <b>{selectedCustomer.full_name}</b>: <b>{selectedCustomer.points ?? 0}</b>
                    </span>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost ui-btn-sm"
                      onClick={() => {
                        setRedeemError("");
                        setShowRedeemModal(true);
                      }}
                    >
                      Đổi điểm lấy voucher
                    </button>
                  </div>

                  {!createPayment && (
                    <div className="page-sub" style={{ marginBottom: 0 }}>
                      Chỉ áp dụng được voucher khi tick "Xác nhận thanh toán ngay" bên dưới.
                    </div>
                  )}

                  {createPayment && (
                    <div className="ui-field" style={{ maxWidth: 420, marginBottom: 0 }}>
                      <label>Dùng voucher giảm giá cho đơn này</label>
                      <select value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)}>
                        <option value="">-- Không dùng voucher --</option>
                        {customerVouchers.map((v) => (
                          <option key={v.voucher_id} value={v.code}>
                            {v.code} — giảm {Number(v.discount_amount).toLocaleString("vi-VN")} đ
                          </option>
                        ))}
                      </select>
                      {customerVouchers.length === 0 && (
                        <small>Khách chưa có voucher nào có thể dùng.</small>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="section-title">Đồ ăn và thức uống mua kèm</div>
              <div className="ui-form-grid" style={{ marginBottom: 18 }}>
                {products.rows.map((product) => (
                  <div className="ui-field" key={product.product_id}>
                    <label>{product.product_name} · {Number(product.price || 0).toLocaleString("vi-VN")} đ</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={foodQuantities[product.product_id] ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const stock = Number(product.stock_quantity || 0);
                        const quantity = digits === "" ? "" : Math.min(stock, Number(digits));
                        setFoodQuantities((cur) => ({
                          ...cur,
                          [product.product_id]: quantity,
                        }));
                      }}
                    />
                    <small>Còn {product.stock_quantity || 0} sản phẩm</small>
                  </div>
                ))}
              </div>

              <div className="section-title">Thanh toán</div>
              <div className="ui-field" style={{ maxWidth: 260, marginBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={createPayment}
                    onChange={(e) => setCreatePayment(e.target.checked)}
                  />
                  Xác nhận thanh toán ngay
                </label>
              </div>
              {createPayment && (
                <div className="ui-field" style={{ maxWidth: 220, marginBottom: 18 }}>
                  <label>Phương thức</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Tiền mặt</option>
                    <option value="card">Thẻ</option>
                    <option value="momo">Momo</option>
                  </select>
                </div>
              )}

              <div className="et-table-wrap" style={{ padding: 16, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, flexWrap: "wrap", gap: 6 }}>
                  <span>Số ghế đã chọn: <b>{selectedSeats.length}</b></span>
                  <span>Khách hàng: <b>{selectedCustomer?.full_name || "Chưa chọn"}</b></span>
                  <span>
                    Tiền vé: <b>{ticketTotal.toLocaleString("vi-VN")} đ</b> · Đồ ăn:{" "}
                    <b>{foodTotal.toLocaleString("vi-VN")} đ</b>
                    {discountAmount > 0 && (
                      <>
                        {" "}
                        · Giảm voucher: <b>-{discountAmount.toLocaleString("vi-VN")} đ</b>
                      </>
                    )}
                    {" "}
                    · Khách trả: <b>{payableTotal.toLocaleString("vi-VN")} đ</b>
                  </span>
                </div>
              </div>

              <button
                className="ui-btn ui-btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Đang tạo đơn..." : `Tạo đơn đặt vé · ${payableTotal.toLocaleString("vi-VN")} đ`}
              </button>
            </>
          )}
        </>
      )}

      <Modal
        open={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title={`Đổi điểm lấy voucher cho ${selectedCustomer?.full_name || "khách hàng"}`}
        width={420}
      >
        <div className="ui-field" style={{ marginBottom: 10 }}>
          <div className="page-sub" style={{ marginBottom: 10 }}>
            Khách đang có <b>{selectedCustomer?.points ?? 0}</b> điểm. Đổi tối thiểu{" "}
            {MIN_REDEEM_POINTS} điểm, mỗi lần đổi phải là bội số của {REDEEM_POINTS_STEP} điểm. Cứ
            1 điểm đổi được {VOUCHER_VALUE_PER_POINT.toLocaleString("vi-VN")} đ giảm giá.
          </div>
          <label>Số điểm muốn đổi</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={MIN_REDEEM_POINTS}
              step={REDEEM_POINTS_STEP}
              value={redeemPoints}
              onChange={(e) => {
                setRedeemPoints(e.target.value);
                setRedeemError("");
              }}
              style={{ flex: 1 }}
            />
            <span>điểm</span>
          </div>
        </div>
        <div className="page-sub" style={{ marginBottom: 10 }}>
          Voucher nhận được: <b>{redeemPreview.toLocaleString("vi-VN")} đ</b> giảm giá, hạn dùng 90
          ngày. Voucher sẽ được tự động chọn để áp dụng cho đơn đang tạo.
        </div>
        {redeemError && (
          <div className="page-sub" style={{ color: "#d0463b", marginBottom: 10 }}>
            {redeemError}
          </div>
        )}
        <button
          type="button"
          className="ui-btn ui-btn-primary"
          disabled={redeeming}
          onClick={handleRedeemForCustomer}
        >
          {redeeming ? "Đang xử lý..." : "Xác nhận đổi voucher"}
        </button>
      </Modal>
    </>
  );
}