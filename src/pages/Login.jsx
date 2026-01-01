import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bootstrap alert message
  const [msg, setMsg] = useState({ type: "", text: "" }); // success|danger|warning|info

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMsg({ type: "success", text: "Login successful! Redirecting..." });
      setTimeout(() => navigate("/cars"), 600);
    } catch (err) {
      setMsg({
        type: "danger",
        text: "User not found or invalid credentials. Please register.",
      });
      setTimeout(() => navigate("/register"), 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background:
          "linear-gradient(120deg, rgba(0,0,0,0.85), rgba(0,0,0,0.55)), url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat",
      }}
    >
      <div className="container">
        {/* SAME middle layout feel */}
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4">
                <h3 className="text-center mb-1">Login</h3>
                <p className="text-center text-muted mb-4">
                  Sign in to continue
                </p>

                {/* Bootstrap in-page alert */}
                {msg.text && (
                  <div className={`alert alert-${msg.type} py-2`} role="alert">
                    {msg.text}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <input
                    className="form-control mb-3"
                    type="email"
                    placeholder="Email"
                    value={email}
                    required
                    disabled={submitting}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {/* Password with show/hide */}
                  <div className="input-group mb-3">
                    <input
                      className="form-control"
                      type={showPw ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      required
                      disabled={submitting}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw((v) => !v)}
                      disabled={submitting}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>

                  <button className="btn btn-dark w-100" disabled={submitting}>
                    {submitting ? "Logging in..." : "Login"}
                  </button>
                </form>

                <p className="text-center mt-3 mb-0">
                  New user? <Link to="/register">Register</Link>
                </p>
              </div>
            </div>

            {/* small footer text like real sites */}
            <p className="text-center text-white-50 small mt-3 mb-0">
              LuxeDrive • Premium Car Dealership
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
