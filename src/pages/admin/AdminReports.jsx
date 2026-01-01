import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

function toStartOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toEndOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

function downloadCSV(filename, rows) {
  const escapeCell = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Date filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Data
  const [cars, setCars] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      // ---- Cars (no date filter, because stock is current) ----
      const carsSnap = await getDocs(collection(db, "cars"));
      const carsList = carsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCars(carsList);

      // ---- Inquiries (date-filtered) ----
      const inquiriesRef = collection(db, "inquiries");

      const start = toStartOfDay(from);
      const end = toEndOfDay(to);

      let qRef;

      if (start && end) {
        qRef = query(
          inquiriesRef,
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<=", Timestamp.fromDate(end)),
          orderBy("createdAt", "desc")
        );
      } else {
        // No date filter: show recent first
        qRef = query(inquiriesRef, orderBy("createdAt", "desc"));
      }

      const inqSnap = await getDocs(qRef);
      const inqList = inqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInquiries(inqList);
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Failed to load reports. Check Firestore indexes & fields." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Metrics ----
  const stockStats = useMemo(() => {
    const total = cars.length;
    const inStock = cars.filter((c) => c.inStock !== false).length;
    const outOfStock = total - inStock;
    const featured = cars.filter((c) => c.featured === true).length;

    const prices = cars.map((c) => Number(c.price || 0)).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const avgPrice = prices.length
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

    return { total, inStock, outOfStock, featured, minPrice, maxPrice, avgPrice };
  }, [cars]);

  const inquiryStats = useMemo(() => {
    const total = inquiries.length;
    const byStatus = { new: 0, contacted: 0, closed: 0 };

    inquiries.forEach((i) => {
      const s = (i.status || "new").toLowerCase();
      if (s === "contacted") byStatus.contacted += 1;
      else if (s === "closed") byStatus.closed += 1;
      else byStatus.new += 1;
    });

    return { total, ...byStatus };
  }, [inquiries]);

  const recentInquiries = useMemo(() => inquiries.slice(0, 10), [inquiries]);

  const handleExportInquiries = () => {
    const header = [
      "CreatedAt",
      "Status",
      "Name",
      "Phone",
      "Email",
      "PreferredDate",
      "CarBrand",
      "CarModel",
      "CarPrice",
      "Fuel",
      "Message",
    ];

    const rows = inquiries.map((i) => {
      const createdAt =
        i.createdAt?.toDate?.() ? i.createdAt.toDate().toISOString() : "";

      return [
        createdAt,
        i.status || "new",
        i.name || "",
        i.phone || "",
        i.email || "",
        i.preferredDate || "",
        i?.carSummary?.brand || "",
        i?.carSummary?.model || "",
        i?.carSummary?.price || "",
        i?.carSummary?.fuel || "",
        i.message || "",
      ];
    });

    downloadCSV(
      `inquiries_${from || "all"}_${to || "all"}.csv`,
      [header, ...rows]
    );
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0">Admin – Reports</h2>
        <button className="btn btn-outline-dark btn-sm" onClick={fetchReports}>
          Refresh
        </button>
      </div>

      <p className="text-muted mb-3">
        View inventory + inquiries summary. Use date range to filter inquiries.
      </p>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <button className="btn btn-dark w-100" onClick={fetchReports} disabled={loading}>
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>

            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                disabled={loading}
              >
                Clear Dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Inventory Summary</h5>

              <div className="row g-2">
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Total Cars</div>
                    <div className="fs-4 fw-bold">{stockStats.total}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">In Stock</div>
                    <div className="fs-4 fw-bold">{stockStats.inStock}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Out of Stock</div>
                    <div className="fs-4 fw-bold">{stockStats.outOfStock}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Featured</div>
                    <div className="fs-4 fw-bold">{stockStats.featured}</div>
                  </div>
                </div>
              </div>

              <hr />

              <h6 className="mb-2">Price Summary</h6>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-dark">
                  Avg: ₹ {Number(stockStats.avgPrice).toLocaleString()}
                </span>
                <span className="badge bg-secondary">
                  Min: ₹ {Number(stockStats.minPrice).toLocaleString()}
                </span>
                <span className="badge bg-secondary">
                  Max: ₹ {Number(stockStats.maxPrice).toLocaleString()}
                </span>
              </div>

              <div className="text-muted small mt-2">
                (Based on car prices currently in stock list)
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Inquiry Summary</h5>

              <div className="row g-2">
                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Total Inquiries</div>
                    <div className="fs-4 fw-bold">{inquiryStats.total}</div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">New</div>
                    <div className="fs-4 fw-bold">{inquiryStats.new}</div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Contacted</div>
                    <div className="fs-4 fw-bold">{inquiryStats.contacted}</div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="border rounded p-2">
                    <div className="text-muted small">Closed</div>
                    <div className="fs-4 fw-bold">{inquiryStats.closed}</div>
                  </div>
                </div>
              </div>

              <hr />

              <button
                className="btn btn-outline-dark w-100"
                onClick={handleExportInquiries}
                disabled={loading || inquiries.length === 0}
              >
                Export Inquiries CSV
              </button>

              <div className="text-muted small mt-2">
                Export uses current date filter (if applied).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent inquiries */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Recent Inquiries</h5>

          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Customer</th>
                  <th>Car</th>
                  <th>Status</th>
                  <th>Preferred Date</th>
                  <th>Message</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <div className="spinner-border" role="status" aria-label="Loading" />
                    </td>
                  </tr>
                ) : recentInquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No inquiries found.
                    </td>
                  </tr>
                ) : (
                  recentInquiries.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <div className="fw-semibold">{i.name || "—"}</div>
                        <div className="text-muted small">{i.email || "—"}</div>
                        <div className="text-muted small">{i.phone || "—"}</div>
                      </td>

                      <td>
                        <div className="fw-semibold">
                          {(i?.carSummary?.brand || "")} {(i?.carSummary?.model || "")}
                        </div>
                        <div className="text-muted small">
                          ₹ {Number(i?.carSummary?.price || 0).toLocaleString()} • {i?.carSummary?.fuel || "—"}
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-secondary">
                          {(i.status || "new").toUpperCase()}
                        </span>
                      </td>

                      <td>{i.preferredDate || "—"}</td>

                      <td style={{ maxWidth: 320 }}>
                        <div className="text-truncate" title={i.message || ""}>
                          {i.message || "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small">
            Showing latest 10 inquiries (within date range if applied).
          </div>
        </div>
      </div>
    </div>
  );
}
