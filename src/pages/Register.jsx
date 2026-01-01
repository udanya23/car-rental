import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";

const Register = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bootstrap alert message
  const [msg, setMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (password !== confirmPassword) {
      setMsg({ type: "danger", text: "Passwords do not match." });
      return;
    }

    setSubmitting(true);

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCred.user.uid;

      // Save user profile
      await setDoc(doc(db, "users", uid), {
        name,
        phone,
        email,
        role: "customer",
        createdAt: new Date(),
      });

      setMsg({
        type: "success",
        text: "Registration successful! Redirecting to login...",
      });

      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      setMsg({
        type: "danger",
        text:
          error?.code === "auth/email-already-in-use"
            ? "Email already registered. Please login."
            : error?.message || "Registration failed.",
      });
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
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4">
                <h3 className="text-center mb-1">Register</h3>
                <p className="text-center text-muted mb-4">
                  Create your LuxeDrive account
                </p>

                {msg.text && (
                  <div className={`alert alert-${msg.type} py-2`} role="alert">
                    {msg.text}
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  <input
                    className="form-control mb-3"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    required
                    disabled={submitting}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <input
                    className="form-control mb-3"
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    required
                    disabled={submitting}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <input
                    className="form-control mb-3"
                    type="email"
                    placeholder="Email"
                    value={email}
                    required
                    disabled={submitting}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {/* Password */}
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

                  {/* Confirm password */}
                  <input
                    className="form-control mb-3"
                    type={showPw ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    required
                    disabled={submitting}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <button className="btn btn-dark w-100" disabled={submitting}>
                    {submitting ? "Creating account..." : "Register"}
                  </button>
                </form>

                <p className="text-center mt-3 mb-0">
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </div>
            </div>

            <p className="text-center text-white-50 small mt-3 mb-0">
              LuxeDrive • Premium Car Dealership
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
