import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const getRolePermissions = async (role) => {
  if (!role) return null;
  const snap = await getDoc(doc(db, "roles", role));
  return snap.exists() ? snap.data() : null;
};
