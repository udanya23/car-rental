import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCars } from "../firebase/cars";
import { useAuth } from "../context/AuthContext";

export default function Cars() {
  const { role } = useAuth();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  // Quick view modal
  const [selected, setSelected] = useState(null);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const data = await getCars();
      setCars(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const brands = useMemo(() => {
    return ["all", ...new Set(cars.map((c) => c.brand).filter(Boolean))];
  }, [cars]);

  const filteredCars = useMemo(() => {
    let result = [...cars];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.brand || "").toLowerCase().includes(s) ||
          (c.model || "").toLowerCase().includes(s)
      );
    }

    if (brand !== "all") result = result.filter((c) => c.brand === brand);
    if (maxPrice) result = result.filter((c) => Number(c.price || 0) <= Number(maxPrice));

    // Featured first
    result.sort((a, b) => (b.featured === true) - (a.featured === true));
    return result;
  }, [cars, search, brand, maxPrice]);

  const resetFilters = () => {
    setSearch("");
    setBrand("all");
    setMaxPrice("");
  };

  return (
    <>
      <style>{`
        .car-card { transition: all .18s ease; }
        .car-card:hover { transform: translateY(-3px); box-shadow: 0 .75rem 1.5rem rgba(0,0,0,.12)!important; }

        /* Title clamp: keeps card heights aligned */
        .car-title {
          font-weight: 700;
          font-size: 1.05rem;
          line-height: 1.25rem;
          min-height: 2.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ✅ HERO CAROUSEL — EXACT SAME STYLE AS HOME */}
      <div id="carsHeroCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button
            type="button"
            data-bs-target="#carsHeroCarousel"
            data-bs-slide-to="0"
            className="active"
            aria-current="true"
            aria-label="Slide 1"
          />
          <button
            type="button"
            data-bs-target="#carsHeroCarousel"
            data-bs-slide-to="1"
            aria-label="Slide 2"
          />
          <button
            type="button"
            data-bs-target="#carsHeroCarousel"
            data-bs-slide-to="2"
            aria-label="Slide 3"
          />
        </div>

        <div className="carousel-inner">
          {/* Slide 1 */}
          <div className="carousel-item active">
            <div
              className="d-flex align-items-center"
              style={{
                minHeight: "70vh",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat",
              }}
            >
              <div className="container text-white py-5">
                <h1 className="display-5 fw-bold">Browse Premium Cars</h1>
                <p className="lead mt-3">
                  Filter by brand and budget, then open any car to view full details.
                </p>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item">
            <div
              className="d-flex align-items-center"
              style={{
                minHeight: "70vh",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat",
              }}
            >
              <div className="container text-white py-5">
                <h2 className="display-6 fw-bold">Luxury That Matches Your Style</h2>
                <p className="lead mt-3">
                  Explore verified listings with real-time stock visibility.
                </p>
              </div>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item">
            <div
              className="d-flex align-items-center"
              style={{
                minHeight: "70vh",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat",
              }}
            >
              <div className="container text-white py-5">
                <h2 className="display-6 fw-bold">Book a Test Drive Easily</h2>
                <p className="lead mt-3">
                  Open any listing and submit an inquiry in under a minute.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carsHeroCarousel"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carsHeroCarousel"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      {/* ✅ Rest of page */}
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="mb-1">Cars</h3>
            <div className="text-muted">Search, filter, and view details.</div>
          </div>

          <button
            className="btn btn-outline-dark d-md-none"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#filtersOffcanvas"
            aria-controls="filtersOffcanvas"
          >
            Filters
          </button>
        </div>

        <div className="row g-3">
          {/* Filters sidebar */}
          <div className="col-md-3 d-none d-md-block">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">Filters</h5>

                <label className="form-label">Search</label>
                <input
                  className="form-control mb-3"
                  placeholder="Brand or Model (e.g. BMW X5)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <label className="form-label">Brand</label>
                <select
                  className="form-select mb-3"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b === "all" ? "All Brands" : b}
                    </option>
                  ))}
                </select>

                <label className="form-label">Max Price (₹)</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  placeholder="e.g. 8000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />

                <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
                  Reset Filters
                </button>

                {role === "admin" && (
                  <div className="alert alert-info mt-3 py-2 mb-0">
                    Admin can manage cars and view inquiries from <strong>Admin Dashboard</strong>.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cars grid */}
          <div className="col-md-9">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" role="status" aria-label="Loading" />
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="alert alert-info">
                No cars match your filters. Try resetting filters.
              </div>
            ) : (
              <div className="row g-3">
                {filteredCars.map((car) => {
                  const out = car.inStock === false;
                  const cardImage =
                    (Array.isArray(car.imageUrls) && car.imageUrls[0]) ||
                    car.imageUrl ||
                    "";

                  return (
                    <div className="col-lg-4 col-md-6" key={car.id}>
                      <div className="card h-100 shadow-sm car-card">
                        {cardImage ? (
                          <img
                            src={cardImage}
                            alt={car.model}
                            className="card-img-top"
                            style={{ height: 200, objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light d-flex align-items-center justify-content-center"
                            style={{ height: 200 }}
                          >
                            <span className="text-muted">No image</span>
                          </div>
                        )}

                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="car-title">
                              {car.brand} {car.model}
                            </div>

                            <div className="d-flex gap-1 flex-wrap justify-content-end ms-2">
                              {car.featured === true && (
                                <span className="badge bg-warning text-dark">Featured</span>
                              )}
                              {out ? (
                                <span className="badge bg-danger">Out</span>
                              ) : (
                                <span className="badge bg-success">In</span>
                              )}
                            </div>
                          </div>

                          <div className="text-muted mt-1">Fuel: {car.fuel}</div>
                          <div className="mt-2 fw-bold">
                            ₹ {Number(car.price || 0).toLocaleString()}
                          </div>

                          <div className="d-flex gap-2 mt-auto pt-3">
                            <Link className="btn btn-dark btn-sm w-100" to={`/cars/${car.id}`}>
                              View Details
                            </Link>

                            <button
                              className="btn btn-outline-dark btn-sm w-100"
                              type="button"
                              data-bs-toggle="modal"
                              data-bs-target="#quickViewModal"
                              onClick={() => setSelected(car)}
                            >
                              Quick View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Offcanvas (mobile filters) */}
        <div
          className="offcanvas offcanvas-end"
          tabIndex="-1"
          id="filtersOffcanvas"
          aria-labelledby="filtersOffcanvasLabel"
        >
          <div className="offcanvas-header">
            <h5 id="filtersOffcanvasLabel">Filters</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
          </div>
          <div className="offcanvas-body">
            <label className="form-label">Search</label>
            <input
              className="form-control mb-3"
              placeholder="Brand or Model"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <label className="form-label">Brand</label>
            <select
              className="form-select mb-3"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b === "all" ? "All Brands" : b}
                </option>
              ))}
            </select>

            <label className="form-label">Max Price (₹)</label>
            <input
              type="number"
              className="form-control mb-3"
              placeholder="e.g. 8000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Quick View Modal */}
        <div
          className="modal fade"
          id="quickViewModal"
          tabIndex="-1"
          aria-labelledby="quickViewModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="quickViewModalLabel">
                  {selected ? `${selected.brand} ${selected.model}` : "Quick View"}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>

              <div className="modal-body">
                {!selected ? (
                  <div className="text-muted">Select a car to preview.</div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6">
                      {(() => {
                        const previewImage =
                          (Array.isArray(selected.imageUrls) && selected.imageUrls[0]) ||
                          selected.imageUrl ||
                          "";
                        return previewImage ? (
                          <img
                            src={previewImage}
                            alt={selected.model}
                            className="img-fluid rounded"
                            style={{ height: 280, width: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="border rounded p-5 text-center text-muted">
                            No image
                          </div>
                        );
                      })()}
                    </div>

                    <div className="col-md-6">
                      <div className="text-muted">Fuel: {selected.fuel}</div>
                      <div className="fs-4 fw-bold mt-2">
                        ₹ {Number(selected.price || 0).toLocaleString()}
                      </div>

                      <div className="mt-3 d-flex gap-2">
                        <Link
                          to={`/cars/${selected.id}`}
                          className="btn btn-dark w-100"
                          data-bs-dismiss="modal"
                        >
                          Open Details
                        </Link>
                        <button className="btn btn-outline-secondary w-100" data-bs-dismiss="modal">
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
