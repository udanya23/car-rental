import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

export default function AdminPurchases() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, "purchases"),
        orderBy("soldAt", "desc")
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Purchase History</h3>

      {items.length === 0 ? (
        <div className="alert alert-info">No purchases yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Car</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Price</th>
                <th>Sold At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.carSnapshot?.brand} {p.carSnapshot?.model}
                  </td>
                  <td>{p.customer?.name}</td>
                  <td>
                    {p.customer?.phone}<br />
                    {p.customer?.email}
                  </td>
                  <td>₹ {Number(p.carSnapshot?.price || 0).toLocaleString()}</td>
                  <td>
                    {p.soldAt?.toDate().toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
