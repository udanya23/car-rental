import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const PAGE_SIZE = 10;

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI controls
  const [qText, setQText] = useState("");
  const [status, setStatus] = useState("all"); // all | new | contacted | closed
  const [page, setPage] = useState(1);

  // message
  const [msg, setMsg] = useState({ type: "", text: "" });

  // modal
  const [selected, setSelected] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      // newest first
      const ref = collection(db, "inquiries");
      const qRef = query(ref, orderBy("createdAt", "desc"));
      const snap = await getDocs(qRef);

      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInquiries(list);
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Failed to fetch inquiries." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filtered = useMemo(() => {
    let list = [...inquiries];

    // filter by status
    if (status !== "all") {
      list = list.filter((i) => (i.status || "new") === status);
    }

    // search
    const s = qText.trim().toLowerCase();
    if (s) {
      list = list.filter((i) => {
        const name = (i.name || "").toLowerCase();
        const email = (i.email || "").toLowerCase();
        const phone = (i.phone || "").toLowerCase();

        const brand = (i?.carSummary?.brand || "").toLowerCase();
        const model = (i?.carSummary?.model || "").toLowerCase();

        // allow searching contact/general
        const type = (i.type || "").toLowerCase();

        return (
          name.includes(s) ||
          email.includes(s) ||
          phone.includes(s) ||
          brand.includes(s) ||
          model.includes(s) ||
          type.includes(s)
        );
      });
    }

    return list;
  }, [inquiries, status, qText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const badgeForStatus = (s) => {
    if (s === "contacted") return "primary";
    if (s === "closed") return "secondary";
    return "warning"; // new
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setMsg({ type: "", text: "" });
    try {
      await updateDoc(doc(db, "inquiries", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setMsg({ type: "success", text: "Inquiry status updated." });
      fetchInquiries();
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Failed to update status." });
    }
  };

  const resetFilters = () => {
    setQText("");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0">Admin – Inquiries</h2>
        <button className="btn btn-outline-dark btn-sm" onClick={fetchInquiries}>
          Refresh
        </button>
      </div>

      <p className="text-muted">
        Manage customer inquiries and update status (new → contacted → closed).
      </p>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Search by name / email / phone / car..."
                value={qText}
                onChange={(e) => {
                  setQText(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th>Customer</th>
              <th>Car</th>
              <th>Preferred Date</th>
              <th>Status</th>
              <th style={{ width: 260 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <div className="spinner-border" role="status" aria-label="Loading" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted py-4">
                  No inquiries found.
                </td>
              </tr>
            ) : (
              pageItems.map((i) => {
                const s = i.status || "new";

                const hasCar =
                  Boolean(i?.carId) ||
                  (i?.carSummary && (i.carSummary.brand || i.carSummary.model));

                const carText = hasCar
                  ? `${i?.carSummary?.brand || ""} ${i?.carSummary?.model || ""}`.trim()
                  : "General Inquiry";

                return (
                  <tr key={i.id}>
                    <td>
                      <div className="fw-semibold">{i.name || "—"}</div>
                      <div className="text-muted small">{i.email || "—"}</div>
                      <div className="text-muted small">{i.phone || "—"}</div>
                    </td>

                    <td>
                      <div className="fw-semibold">{carText || "—"}</div>
                      <div className="text-muted small">
                        {hasCar
                          ? `₹ ${Number(i?.carSummary?.price || 0).toLocaleString()} • ${
                              i?.carSummary?.fuel || "—"
                            }`
                          : "—"}
                      </div>
                    </td>

                    <td>{i.preferredDate || "—"}</td>

                    <td>
                      <span className={`badge bg-${badgeForStatus(s)} text-dark`}>
                        {s.toUpperCase()}
                      </span>
                    </td>

                    <td className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-outline-dark btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#inquiryModal"
                        onClick={() => setSelected(i)}
                      >
                        View
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        disabled={s === "contacted"}
                        onClick={() => handleUpdateStatus(i.id, "contacted")}
                      >
                        Mark Contacted
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={s === "closed"}
                        onClick={() => handleUpdateStatus(i.id, "closed")}
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && !loading && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Page {page} of {totalPages} • {filtered.length} inquiries
          </div>

          <div className="btn-group">
            <button
              className="btn btn-outline-dark btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="btn btn-outline-dark btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <div
        className="modal fade"
        id="inquiryModal"
        tabIndex="-1"
        aria-labelledby="inquiryModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="inquiryModalLabel">
                Inquiry Details
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>

            <div className="modal-body">
              {!selected ? (
                <div className="text-muted">No inquiry selected.</div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-5">
                    {selected?.carSummary?.imageUrl ? (
                      <img
                        src={selected.carSummary.imageUrl}
                        alt="Car"
                        className="img-fluid rounded border"
                        style={{ width: "100%", height: 240, objectFit: "cover" }}
                      />
                    ) : (
                      <div className="border rounded p-5 text-center text-muted">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="col-md-7">
                    <div className="mb-2">
                      <div className="text-muted small">Customer</div>
                      <div className="fw-semibold">{selected.name || "—"}</div>
                      <div className="text-muted">{selected.email || "—"}</div>
                      <div className="text-muted">{selected.phone || "—"}</div>
                    </div>

                    <hr />

                    {(() => {
                      const hasCar =
                        Boolean(selected?.carId) ||
                        (selected?.carSummary &&
                          (selected.carSummary.brand || selected.carSummary.model));

                      return (
                        <div className="mb-2">
                          <div className="text-muted small">Car</div>
                          <div className="fw-semibold">
                            {hasCar
                              ? `${selected?.carSummary?.brand || ""} ${selected?.carSummary?.model || ""}`.trim() ||
                                "—"
                              : "General Inquiry"}
                          </div>
                          <div className="text-muted">
                            {hasCar
                              ? `₹ ${Number(selected?.carSummary?.price || 0).toLocaleString()} • ${
                                  selected?.carSummary?.fuel || "—"
                                }`
                              : "—"}
                          </div>
                        </div>
                      );
                    })()}

                    <hr />

                    <div className="mb-2">
                      <div className="text-muted small">Preferred Date</div>
                      <div>{selected.preferredDate || "—"}</div>
                    </div>

                    <div className="mb-2">
                      <div className="text-muted small">Message</div>
                      <div className="border rounded p-2 bg-light">
                        {selected.message || "—"}
                      </div>
                    </div>

                    <div className="mt-3">
                      <span
                        className={`badge bg-${badgeForStatus(selected.status || "new")} text-dark`}
                      >
                        {(selected.status || "new").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
