import { useEffect, useState } from "react";
import { addCar, getCars, deleteCar } from "../../firebase/cars";

export default function AdminDashboard() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({
    brand: "",
    model: "",
    price: "",
    fuel: "",
    imageUrl: ""
  });

  const fetchCars = async () => {
    const data = await getCars();
    setCars(data);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await addCar({
      ...form,
      price: Number(form.price),
      createdAt: new Date()
    });

    setForm({ brand: "", model: "", price: "", fuel: "", imageUrl: "" });
    fetchCars();
  };

  const handleDelete = async (id) => {
    await deleteCar(id);
    fetchCars();
  };

  return (
    <div className="container mt-4">
      <h3>Admin – Manage Cars</h3>

      {/* ADD CAR FORM */}
      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <input className="form-control" placeholder="Brand"
            value={form.brand}
            onChange={e => setForm({ ...form, brand: e.target.value })}
            required />
        </div>

        <div className="col-md-4">
          <input className="form-control" placeholder="Model"
            value={form.model}
            onChange={e => setForm({ ...form, model: e.target.value })}
            required />
        </div>

        <div className="col-md-4">
          <input className="form-control" placeholder="Fuel Type"
            value={form.fuel}
            onChange={e => setForm({ ...form, fuel: e.target.value })}
            required />
        </div>

        <div className="col-md-4">
          <input className="form-control" type="number" placeholder="Price"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            required />
        </div>

        <div className="col-md-8">
          <input className="form-control" placeholder="Image URL"
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>

        <div className="col-12">
          <button className="btn btn-dark w-100">Add Car</button>
        </div>
      </form>

      {/* CAR LIST */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Model</th>
            <th>Fuel</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cars.map(car => (
            <tr key={car.id}>
              <td>{car.brand}</td>
              <td>{car.model}</td>
              <td>{car.fuel}</td>
              <td>₹{car.price}</td>
              <td>
                <button className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(car.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
