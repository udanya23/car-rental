import { useEffect, useMemo, useState } from "react";
import { uploadToCloudinary } from "../../utils/cloudinary";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const PAGE_SIZE = 10;

const AdminCars = () => {
  // Form fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);

  // Existing images (stored in Firestore)
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [existingPublicIds, setExistingPublicIds] = useState([]);

  // New uploads (selected files)
  const [imageFiles, setImageFiles] = useState([]);

  const [cars, setCars] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // success|danger|warning|info

  // Table controls
  const [q, setQ] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [page, setPage] = useState(1);

  const carsRef = useMemo(() => collection(db, "cars"), []);

  const fetchCars = async () => {
    const snapshot = await getDocs(carsRef);
    const carsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCars(carsList);
  };

  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setBrand("");
    setModel("");
    setFuel("");
    setPrice("");
    setInStock(true);
    setFeatured(false);
    setEditingId(null);

    setExistingImageUrls([]);
    setExistingPublicIds([]);
    setImageFiles([]);

    setUploading(false);
  };

  // Filtering + pagination
  const filtered = useMemo(() => {
    let list = [...cars];
    const s = q.trim().toLowerCase();

    if (s) {
      list = list.filter(
        (c) =>
          (c.brand || "").toLowerCase().includes(s) ||
          (c.model || "").toLowerCase().includes(s)
      );
    }
    if (onlyInStock) list = list.filter((c) => c.inStock !== false);
    if (onlyFeatured) list = list.filter((c) => c.featured === true);

    list.sort((a, b) => (b.featured === true) - (a.featured === true));
    return list;
  }, [cars, q, onlyInStock, onlyFeatured]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const resetTableFilters = () => {
    setQ("");
    setOnlyInStock(false);
    setOnlyFeatured(false);
    setPage(1);
  };

  // Remove an existing image (UI only; doesn't delete from Cloudinary yet)
  const removeExistingImage = (idx) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== idx));
    setExistingPublicIds((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!brand || !model || !fuel || !price) {
      setMsg({ type: "warning", text: "Please fill all required fields." });
      return;
    }

    try {
      setUploading(true);

      // Start with existing images (edit mode keeps them)
      let finalImageUrls = Array.isArray(existingImageUrls) ? [...existingImageUrls] : [];
      let finalPublicIds = Array.isArray(existingPublicIds) ? [...existingPublicIds] : [];

      // Upload newly selected images (if any)
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map((file) => uploadToCloudinary(file))
        );

        const newUrls = uploads.map((u) => u.secureUrl);
        const newIds = uploads.map((u) => u.publicId || "");

        finalImageUrls = [...finalImageUrls, ...newUrls];
        finalPublicIds = [...finalPublicIds, ...newIds];
      }

      // Backward compatibility: also store first image as imageUrl
      const firstImage = finalImageUrls[0] || "";

      const payload = {
        brand,
        model,
        fuel,
        price: Number(price),
        inStock: Boolean(inStock),
        featured: Boolean(featured),
        updatedAt: serverTimestamp(),

        // ✅ Multi-image fields
        imageUrls: finalImageUrls,
        imagePublicIds: finalPublicIds,

        // ✅ Keep old field too (used by older UI)
        imageUrl: firstImage,
      };

      if (editingId) {
        await updateDoc(doc(db, "cars", editingId), payload);
        setMsg({ type: "success", text: "Car updated successfully." });
      } else {
        await addDoc(carsRef, { ...payload, createdAt: serverTimestamp() });
        setMsg({ type: "success", text: "Car added successfully." });
      }

      resetForm();
      fetchCars();
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Failed to save car. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setMsg({ type: "", text: "" });
    const ok = window.confirm("Delete this car?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "cars", id));
      setMsg({ type: "success", text: "Car deleted successfully." });
      fetchCars();
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: "Failed to delete car." });
    }
  };

  const handleEdit = (car) => {
    setMsg({ type: "", text: "" });

    setEditingId(car.id);
    setBrand(car.brand || "");
    setModel(car.model || "");
    setFuel(car.fuel || "");
    setPrice(car.price ?? "");
    setInStock(car.inStock !== false);
    setFeatured(car.featured === true);

    // ✅ Load existing images (keep them)
    setExistingImageUrls(Array.isArray(car.imageUrls) ? car.imageUrls : car.imageUrl ? [car.imageUrl] : []);
    setExistingPublicIds(Array.isArray(car.imagePublicIds) ? car.imagePublicIds : []);

    // ✅ Clear newly selected files (don't force re-upload)
    setImageFiles([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Admin – Manage Cars</h2>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="card p-4 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{editingId ? "Edit Car" : "Add New Car"}</h5>

          {editingId && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={resetForm}
              disabled={uploading}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Brand *</label>
            <input
              className="form-control"
              placeholder="BMW / Audi / Mercedes"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              disabled={uploading}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Model *</label>
            <input
              className="form-control"
              placeholder="X5 / A6 / C-Class"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              disabled={uploading}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Fuel Type *</label>
            <input
              className="form-control"
              placeholder="Petrol / Diesel / Electric / Hybrid"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              required
              disabled={uploading}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Price (₹) *</label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 8500000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={uploading}
            />
          </div>

          <div className="col-md-8">
            <label className="form-label">Car Images</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              disabled={uploading}
            />
            <div className="form-text">
              Upload multiple images (front/interior/back). In edit mode, existing images stay unless you remove them.
            </div>

            {/* Existing images preview in edit mode */}
            {editingId && existingImageUrls.length > 0 && (
              <div className="mt-3">
                <div className="small text-muted mb-2">Existing images:</div>
                <div className="d-flex flex-wrap gap-2">
                  {existingImageUrls.map((url, idx) => (
                    <div key={url + idx} className="position-relative">
                      <img
                        src={url}
                        alt={`Existing ${idx + 1}`}
                        className="rounded border"
                        style={{ width: 110, height: 80, objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                        style={{ transform: "translate(35%, -35%)" }}
                        onClick={() => removeExistingImage(idx)}
                        disabled={uploading}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="form-text mt-2">
                  Removing here updates Firestore on save. (We can add Cloudinary delete later.)
                </div>
              </div>
            )}
          </div>

          <div className="col-12 d-flex gap-4 flex-wrap">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                id="inStockCheck"
                disabled={uploading}
              />
              <label className="form-check-label" htmlFor="inStockCheck">
                In Stock
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                id="featuredCheck"
                disabled={uploading}
              />
              <label className="form-check-label" htmlFor="featuredCheck">
                Featured (show on Home)
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`btn w-100 mt-3 ${editingId ? "btn-primary" : "btn-dark"}`}
          disabled={uploading}
        >
          {uploading ? "Uploading Images..." : editingId ? "Update Car" : "Add Car"}
        </button>
      </form>

      {/* TABLE CONTROLS */}
      <div className="card p-3 shadow-sm mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Search brand or model..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="col-md-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => {
                  setOnlyInStock(e.target.checked);
                  setPage(1);
                }}
                id="onlyInStock"
              />
              <label className="form-check-label" htmlFor="onlyInStock">
                In Stock only
              </label>
            </div>
          </div>

          <div className="col-md-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={onlyFeatured}
                onChange={(e) => {
                  setOnlyFeatured(e.target.checked);
                  setPage(1);
                }}
                id="onlyFeatured"
              />
              <label className="form-check-label" htmlFor="onlyFeatured">
                Featured only
              </label>
            </div>
          </div>

          <div className="col-md-2 text-md-end">
            <button className="btn btn-outline-secondary w-100" onClick={resetTableFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Fuel</th>
              <th>Price</th>
              <th>Images</th>
              <th>Stock</th>
              <th>Featured</th>
              <th style={{ width: 180 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No cars found.
                </td>
              </tr>
            ) : (
              pageItems.map((car) => (
                <tr key={car.id}>
                  <td>{car.brand}</td>
                  <td>{car.model}</td>
                  <td>{car.fuel}</td>
                  <td>₹{Number(car.price || 0).toLocaleString()}</td>
                  <td>
                    {Array.isArray(car.imageUrls) ? car.imageUrls.length : car.imageUrl ? 1 : 0}
                  </td>
                  <td>
                    {car.inStock !== false ? (
                      <span className="badge bg-success">In Stock</span>
                    ) : (
                      <span className="badge bg-danger">Out of Stock</span>
                    )}
                  </td>
                  <td>
                    {car.featured === true ? (
                      <span className="badge bg-warning text-dark">Featured</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="d-flex gap-2">
                    <button className="btn btn-warning btn-sm" onClick={() => handleEdit(car)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(car.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Page {page} of {totalPages} • {filtered.length} cars
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
    </div>
  );
};

export default AdminCars;
