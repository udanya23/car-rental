import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-border" role="status" aria-label="Loading" />
    </div>
  );

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Role not ready (should be rare after AuthContext fix)
  if (!role) return <Navigate to="/login" replace />;

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === "admin" ? "/admin" : "/cars"} replace />;
  }

  return children;
};

export default ProtectedRoute;
