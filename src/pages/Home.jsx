import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCars } from "../firebase/cars";

export default function Home() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getCars();
      setCars(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  // Featured first; fallback to latest
  const featured = useMemo(() => cars.filter((c) => c.featured === true), [cars]);
  const displayCars = useMemo(() => {
    const list = featured.length > 0 ? featured : cars;
    return list.slice(0, 9); // show up to 9 in carousel
  }, [cars, featured]);

  // Split into groups of 3 for carousel slides
  const slides = useMemo(() => {
    const groups = [];
    for (let i = 0; i < displayCars.length; i += 3) {
      groups.push(displayCars.slice(i, i + 3));
    }
    return groups;
  }, [displayCars]);

  return (
    <div>
      {/* HERO CAROUSEL */}
      <div id="homeHeroCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button
            type="button"
            data-bs-target="#homeHeroCarousel"
            data-bs-slide-to="0"
            className="active"
            aria-current="true"
            aria-label="Slide 1"
          />
          <button
            type="button"
            data-bs-target="#homeHeroCarousel"
            data-bs-slide-to="1"
            aria-label="Slide 2"
          />
          <button
            type="button"
            data-bs-target="#homeHeroCarousel"
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
                  "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat",
              }}
            >
              <div className="container text-white py-5">
                <h1 className="display-5 fw-bold">Drive Luxury. Own Excellence.</h1>
                <p className="lead mt-3">
                  Explore premium BMW, Audi & Mercedes inventory with real-time availability.
                </p>
                <div className="d-flex gap-2 mt-4 flex-wrap">
                  <Link to="/cars" className="btn btn-light btn-lg">
                    Browse Cars
                  </Link>
                  <Link to="/contact" className="btn btn-outline-light btn-lg">
                    Contact Us
                  </Link>
                </div>
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
                  "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat",
              }}
            >
              <div className="container text-white py-5">
                <h2 className="display-6 fw-bold">Handpicked Premium Inventory</h2>
                <p className="lead mt-3">
                  Featured cars updated regularly. Book a test drive in minutes.
                </p>
                <div className="d-flex gap-2 mt-4 flex-wrap">
                  <Link to="/cars" className="btn btn-light btn-lg">
                    View Featured Cars
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg">
                    Admin Login
                  </Link>
                </div>
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
                  "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat",
              }}
            >
              <div className="container text-white py-5">
                <h2 className="display-6 fw-bold">Transparent Pricing • Real Stock</h2>
                <p className="lead mt-3">
                  No paper tracking. No confusion. Just clean browsing and quick inquiries.
                </p>
                <div className="d-flex gap-2 mt-4 flex-wrap">
                  <Link to="/cars" className="btn btn-light btn-lg">
                    Explore Inventory
                  </Link>
                  <Link to="/contact" className="btn btn-outline-light btn-lg">
                    Schedule a Visit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#homeHeroCarousel"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#homeHeroCarousel"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      {/* FEATURED CARS CAROUSEL */}
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="mb-1">Featured Cars</h3>
            <div className="text-muted">
              {featured.length > 0 ? "Handpicked luxury picks." : "Showing latest listings."}
            </div>
          </div>

          <Link to="/cars" className="btn btn-dark">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border" role="status" aria-label="Loading" />
          </div>
        ) : displayCars.length === 0 ? (
          <div className="alert alert-info">No cars available right now.</div>
        ) : (
          <div id="featuredCarsCarousel" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-inner">
              {slides.map((group, idx) => (
                <div key={idx} className={`carousel-item ${idx === 0 ? "active" : ""}`}>
                  <div className="row g-3">
                    {group.map((car) => {
                      const outOfStock = car.inStock === false;

                      return (
                        <div className="col-md-4" key={car.id}>
                          <Link
                            to={`/cars/${car.id}`}
                            className="text-decoration-none text-dark"
                          >
                            <div className="card h-100 shadow-sm">
                              {car.imageUrl ? (
                                <img
                                  src={car.imageUrl}
                                  className="card-img-top"
                                  alt={car.model}
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

                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                  <h5 className="mb-1">
                                    {car.brand} {car.model}
                                  </h5>
                                  {outOfStock ? (
                                    <span className="badge bg-danger">Out</span>
                                  ) : (
                                    <span className="badge bg-success">In</span>
                                  )}
                                </div>

                                <div className="text-muted mb-1">Fuel: {car.fuel}</div>
                                <strong>₹ {Number(car.price || 0).toLocaleString()}</strong>

                                <div className="mt-3">
                                  <span className="btn btn-outline-dark btn-sm w-100">
                                    View Details
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* controls */}
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#featuredCarsCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon" aria-hidden="true" />
              <span className="visually-hidden">Previous</span>
            </button>

            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#featuredCarsCarousel"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon" aria-hidden="true" />
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        )}
      </div>

      {/* CTA STRIP */}
      <div className="bg-light">
        <div className="container py-5 text-center">
          <h3 className="fw-bold">Ready to schedule a test drive?</h3>
          <p className="text-muted mb-4">
            Browse cars and submit an inquiry in under a minute.
          </p>

          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <Link to="/cars" className="btn btn-dark btn-lg">
              Browse Cars
            </Link>
            <Link to="/contact" className="btn btn-outline-dark btn-lg">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
