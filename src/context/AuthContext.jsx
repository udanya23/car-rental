import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "admin" | "customer"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!isMounted) return;

        if (currentUser) {
          setUser(currentUser);

          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            // ✅ default to customer if role missing
            setRole(snap.data()?.role || "customer");
          } else {
            // ✅ OPTIONAL: auto-create user doc if it doesn't exist
            // (Useful if login happens but register didn't write to Firestore)
            await setDoc(
              userRef,
              {
                email: currentUser.email,
                role: "customer",
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );

            setRole("customer");
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("AuthContext error:", err);
        setUser(null);
        setRole(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
