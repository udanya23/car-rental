import { useEffect, useMemo, useState } from "react";
import { getCars } from "../firebase/cars";
import { addInquiry } from "../firebase/inquiries";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    preferredDate: "",

    // Car selection (optional)
    selectedCarId: "",

    // Manual car details (optional)
    carBrand: "",
    carModel: "",
    carFuel: "",
    carPrice: "",
  });

  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadCars = async () => {
      setCarsLoading(true);
      try {
        const list = await getCars();
        // Optional: show in-stock cars first
        const sorted = [...list].sort((a, b) => Number(b.inStock) - Number(a.inStock));
        setCars(sorted);
      } catch (e) {
        console.error(e);
        setCars([]);
      } finally {
        setCarsLoading(false);
      }
    };
    loadCars();
  }, []);

  const selectedCar = useMemo(
    () => cars.find((c) => c.id === form.selectedCarId) || null,
    [cars, form.selectedCarId]
  );

  // If user selects a car, auto-fill manual fields (but still editable)
  useEffect(() => {
    if (!selectedCar) return;

    setForm((prev) => ({
      ...prev,
      carBrand: selectedCar.brand || "",
      carModel: selectedCar.model || "",
      carFuel: selectedCar.fuel || "",
      carPrice: String(selectedCar.price ?? ""),
    }));
  }, [selectedCar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setSubmitting(true);

    try {
      const name = form.name.trim();
      const email = form.email.trim();
      const phone = form.phone.trim();
      const message = form.message.trim();
      const preferredDate = form.preferredDate?.trim() || "";

      const hasManualCar =
        form.carBrand.trim() ||
        form.carModel.trim() ||
        form.carFuel.trim() ||
        String(form.carPrice).trim();

      const carId = form.selectedCarId ? form.selectedCarId : "";

      const carSummary =
        carId && selectedCar
          ? {
              brand: selectedCar.brand || "",
              model: selectedCar.model || "",
              price: Number(selectedCar.price || 0),
              fuel: selectedCar.fuel || "",
              imageUrl: selectedCar.imageUrl || (Array.isArray(selectedCar.imageUrls) ? selectedCar.imageUrls[0] : "") || "",
            }
          : hasManualCar
          ? {
              brand: form.carBrand.trim(),
              model: form.carModel.trim(),
              fuel: form.carFuel.trim(),
              price: Number(form.carPrice || 0),
              imageUrl: "",
            }
          : null;

      await addInquiry({
        type: "contact",

        name,
        email,
        phone,
        message,

        preferredDate,

        carId: carSummary ? carId : "",
        carSummary, // null if not provided
      });

      setMsg({
        type: "success",
        text: "Thanks for contacting us! Our team will reach out shortly.",
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
        preferredDate: "",

        selectedCarId: "",
        carBrand: "",
        carModel: "",
        carFuel: "",
        carPrice: "",
      });
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light">
      {/* Header */}
      <div
        className="py-5"
        style={{ background: "linear-gradient(90deg, #111, #333)" }}
      >
        <div className="container text-white">
          <h1 className="fw-bold mb-2">Contact LuxeDrive</h1>
          <p className="mb-0 text-white-50">
            Have questions about a car or want to schedule a visit? We’re here to help.
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          {/* Contact Form */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h4 className="fw-bold mb-1">Send us a message</h4>
                <p className="text-muted mb-4">
                  Our sales team usually responds within 24 hours.
                </p>

                {msg.text && (
                  <div className={`alert alert-${msg.type} py-2`} role="alert">
                    {msg.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-control"
                        placeholder="Enter your full name"
                        required
                        disabled={submitting}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter proper email address"
                        required
                        disabled={submitting}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        placeholder="Enter your phone number"
                        required
                        disabled={submitting}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Preferred Date (optional)</label>
                      <input
                        type="date"
                        className="form-control"
                        disabled={submitting}
                        value={form.preferredDate}
                        onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                      />
                    </div>

                    {/* NEW: Select car from inventory (optional) */}
                    <div className="col-12">
                      <label className="form-label">Select a Car (optional)</label>
                      <select
                        className="form-select"
                        disabled={submitting || carsLoading}
                        value={form.selectedCarId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            selectedCarId: e.target.value,
                          })
                        }
                      >
                        <option value="">No specific car (General Inquiry)</option>
                        {cars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.brand} {c.model} {c.inStock === false ? "(Out of stock)" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="text-muted small mt-1">
                        If you don’t select a car, it will be saved as a General Inquiry.
                      </div>
                    </div>

                    {/* NEW: Manual car details (optional) */}
                    <div className="col-md-6">
                      <label className="form-label">Car Brand (optional)</label>
                      <input
                        className="form-control"
                        placeholder="e.g., BMW"
                        disabled={submitting}
                        value={form.carBrand}
                        onChange={(e) => setForm({ ...form, carBrand: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Car Model (optional)</label>
                      <input
                        className="form-control"
                        placeholder="e.g., X5"
                        disabled={submitting}
                        value={form.carModel}
                        onChange={(e) => setForm({ ...form, carModel: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Fuel (optional)</label>
                      <input
                        className="form-control"
                        placeholder="e.g., Petrol / Diesel / EV"
                        disabled={submitting}
                        value={form.carFuel}
                        onChange={(e) => setForm({ ...form, carFuel: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Budget / Price (optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 2500000"
                        disabled={submitting}
                        value={form.carPrice}
                        onChange={(e) => setForm({ ...form, carPrice: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Message</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Tell us which car you're interested in or when you'd like to visit..."
                        required
                        disabled={submitting}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <button className="btn btn-dark w-100" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Message"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Info + Trust Section */}
          <div className="col-lg-5">
            {/* Dealership Info */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Dealership Information</h5>

                <div className="mb-3">
                  <div className="text-muted small">Location</div>
                  <div className="fw-semibold">
                    LuxeDrive Premium Cars, City Center
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Phone</div>
                  <div className="fw-semibold">+91 90000 00000</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Email</div>
                  <div className="fw-semibold">sales@luxedrive.com</div>
                </div>

                <div>
                  <div className="text-muted small">Business Hours</div>
                  <div className="fw-semibold">
                    Mon – Sat: 10:00 AM – 7:00 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Why Choose LuxeDrive?</h5>

                <ul className="list-unstyled mb-0">
                  <li className="mb-2">✔ Handpicked premium cars only</li>
                  <li className="mb-2">✔ Transparent pricing & real stock</li>
                  <li className="mb-2">✔ Easy inquiry & test drive booking</li>
                  <li className="mb-2">✔ Trusted by luxury car buyers</li>
                </ul>
              </div>
            </div>
          </div>
          {/* End Right */}
        </div>
      </div>
    </div>
  );
}
