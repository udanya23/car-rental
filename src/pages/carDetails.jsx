import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCarById } from "../firebase/cars";
import { addInquiry } from "../firebase/inquiries";
import { useAuth } from "../context/AuthContext";

export default function CarDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: user?.email || "",
    message: "",
    preferredDate: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // success|danger|warning|info

  useEffect(() => {
    const loadCar = async () => {
      try {
        setLoading(true);
        const data = await getCarById(id);
        setCar(data);
      } catch (err) {
        console.error("Failed to load car:", err);
        setCar(null);
      } finally {
        setLoading(false);
      }
    };

    loadCar();
  }, [id]);

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // ✅ Support multiple images:
  // 1) if car.imageUrls (array) exists use it
  // 2) else fallback to single car.imageUrl
  const gallery = useMemo(() => {
    const arr = Array.isArray(car?.imageUrls) ? car.imageUrls.filter(Boolean) : [];
    if (arr.length > 0) return arr;
    if (car?.imageUrl) return [car.imageUrl];
    return [];
  }, [car]);

  const outOfStock = car?.inStock === false;

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!car) return;

    if (outOfStock) {
      setMsg({ type: "warning", text: "This car is out of stock. Inquiry is disabled." });
      return;
    }

    setSubmitting(true);

    try {
      await addInquiry({
        carId: car.id,
        carSummary: {
          brand: car.brand,
          model: car.model,
          price: car.price,
          fuel: car.fuel,
          imageUrl: car.imageUrl || gallery[0] || "",
        },
        customer: { uid: user?.uid || "" },
        ...form,
      });

      setMsg({ type: "success", text: "Inquiry submitted successfully! We’ll contact you soon." });

      setForm({
        name: "",
        phone: "",
        email: user?.email || "",
        message: "",
        preferredDate: "",
      });
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Failed to submit inquiry. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mt-4">
        <h4>Car not found</h4>
        <Link to="/cars" className="btn btn-dark mt-3">
          Back to Cars
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Link to="/cars" className="btn btn-outline-dark mb-3">
        ← Back
      </Link>

      <div className="row g-4">
        {/* LEFT: GALLERY */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              {gallery.length > 0 ? (
                <>
                  <div
                    id="carGalleryCarousel"
                    className="carousel slide"
                    data-bs-ride="carousel"
                  >
                    {/* Indicators (thumbnails style) */}
                    <div className="carousel-indicators" style={{ marginBottom: "-2rem" }}>
                      {gallery.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          data-bs-target="#carGalleryCarousel"
                          data-bs-slide-to={idx}
                          className={idx === 0 ? "active" : ""}
                          aria-current={idx === 0 ? "true" : "false"}
                          aria-label={`Slide ${idx + 1}`}
                          style={{
                            width: 60,
                            height: 40,
                            backgroundImage: `url(${url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            borderRadius: 6,
                            border: "2px solid rgba(255,255,255,0.7)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Slides */}
                    <div className="carousel-inner rounded">
                      {gallery.map((url, idx) => (
                        <div
                          key={idx}
                          className={`carousel-item ${idx === 0 ? "active" : ""}`}
                        >
                          <img
                            src={url}
                            className="d-block w-100 rounded"
                            alt={`${car.brand} ${car.model} ${idx + 1}`}
                            style={{ height: 420, objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Controls */}
                    {gallery.length > 1 && (
                      <>
                        <button
                          className="carousel-control-prev"
                          type="button"
                          data-bs-target="#carGalleryCarousel"
                          data-bs-slide="prev"
                        >
                          <span className="carousel-control-prev-icon" aria-hidden="true" />
                          <span className="visually-hidden">Previous</span>
                        </button>
                        <button
                          className="carousel-control-next"
                          type="button"
                          data-bs-target="#carGalleryCarousel"
                          data-bs-slide="next"
                        >
                          <span className="carousel-control-next-icon" aria-hidden="true" />
                          <span className="visually-hidden">Next</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Stock badge */}
                  <div className="mt-3 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Gallery • {gallery.length} photo{gallery.length > 1 ? "s" : ""}
                    </div>
                    {outOfStock ? (
                      <span className="badge bg-danger">Out of Stock</span>
                    ) : (
                      <span className="badge bg-success">In Stock</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="border rounded p-5 text-center text-muted">
                  No images available
                </div>
              )}
            </div>
          </div>

          {/* Quick Specs like real sites */}
          <div className="row g-3 mt-2">
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="text-muted">Brand</div>
                  <div className="fw-bold">{car.brand}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="text-muted">Fuel</div>
                  <div className="fw-bold">{car.fuel}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="text-muted">Price</div>
                  <div className="fw-bold">₹ {Number(car.price || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h5 className="mb-2">About this car</h5>
            <p className="text-muted mb-0">
              {car.description || "Details will be added soon."}
            </p>
          </div>
        </div>

        {/* RIGHT: DETAILS + INQUIRY */}
        <div className="col-lg-5">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h2 className="mb-1">
                    {car.brand} {car.model}
                  </h2>
                  <div className="text-muted">Premium Listing</div>
                </div>
                {outOfStock ? (
                  <span className="badge bg-danger">Out</span>
                ) : (
                  <span className="badge bg-success">In</span>
                )}
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <div className="text-muted">Fuel</div>
                <div className="fw-bold">{car.fuel}</div>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <div className="text-muted">Price</div>
                <div className="fw-bold">₹ {Number(car.price || 0).toLocaleString()}</div>
              </div>

              <hr />

              {outOfStock ? (
                <div className="alert alert-danger py-2 mb-0">
                  This car is currently out of stock. Inquiry is disabled.
                </div>
              ) : (
                <div className="alert alert-success py-2 mb-0">
                  Available for inquiry / test drive.
                </div>
              )}
            </div>
          </div>

          {msg.text && (
            <div className={`alert alert-${msg.type} py-2`} role="alert">
              {msg.text}
            </div>
          )}

          {/* Inquiry card (premium feel) */}
          <div className="card p-3 shadow-sm">
            <h5 className="mb-3">Inquiry / Book Test Drive</h5>

            <form onSubmit={handleSubmitInquiry}>
              <div className="mb-2">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={outOfStock || submitting}
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={outOfStock || submitting}
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={outOfStock || submitting}
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Preferred Date (optional)</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) =>
                    setForm({ ...form, preferredDate: e.target.value })
                  }
                  disabled={outOfStock || submitting}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="I’m interested in this car..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  disabled={outOfStock || submitting}
                />
              </div>

              <button
                className="btn btn-dark w-100"
                disabled={submitting || outOfStock}
              >
                {outOfStock
                  ? "Out of Stock"
                  : submitting
                  ? "Submitting..."
                  : "Submit Inquiry"}
              </button>

              <div className="text-muted small mt-2">
                We typically respond within 24 hours.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
