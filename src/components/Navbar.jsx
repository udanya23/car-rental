import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand fw-bold" to="/">
        LuxeDrive
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarsExample"
        aria-controls="navbarsExample"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarsExample">
        <ul className="navbar-nav ms-auto gap-3 align-items-lg-center mt-3 mt-lg-0">
          
          {/* Cars is visible to everyone */}
          <li className="nav-item">
            <Link className="nav-link" to="/cars">Cars</Link>
          </li>

          {/* Contact: visible ONLY to public + customer (not admin) */}
          {(!user || role === "customer") && (
            <li className="nav-item">
              <Link className="nav-link" to="/contact">Contact</Link>
            </li>
          )}

          {/* Admin links */}
          {user && role === "admin" && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/admin">Manage Cars</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/inquiries">Inquiries</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/reports">Reports</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/purchases">Purchases</Link>
              </li>
            </>
          )}

          {/* Auth links */}
          {!user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Register</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
