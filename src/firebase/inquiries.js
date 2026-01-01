import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// 🔹 Collection reference
const inquiriesRef = collection(db, "inquiries");

/* ===============================
   CUSTOMER: ADD INQUIRY
================================ */
export const addInquiry = async (inquiryData) => {
  // ✅ normalize/trim strings to avoid blank values saved as "   "
  const cleaned = {
    ...inquiryData,
    name: (inquiryData?.name || "").trim(),
    email: (inquiryData?.email || "").trim(),
    phone: (inquiryData?.phone || "").trim(),
    message: (inquiryData?.message || "").trim(),
  };

  await addDoc(inquiriesRef, {
    ...cleaned,
    status: "new",
    createdAt: serverTimestamp(),
  });
};

/* ===============================
   ADMIN: GET ALL INQUIRIES
================================ */
export const getInquiries = async () => {
  const q = query(inquiriesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

/* ===============================
   ADMIN: UPDATE STATUS
================================ */
export const updateInquiryStatus = async (id, status) => {
  await updateDoc(doc(db, "inquiries", id), {
    status,
    updatedAt: serverTimestamp(),
  });
};

/* ===============================
   ADMIN: CONVERT INQUIRY → PURCHASE
================================ */
export const convertInquiryToPurchase = async (inquiry) => {
  // 1️⃣ Save purchase history
  await addDoc(collection(db, "purchases"), {
    inquiryId: inquiry.id,
    carId: inquiry.carId,
    carSnapshot: inquiry.carSummary,
    customer: {
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email,
    },
    soldAt: serverTimestamp(),
  });

  // 2️⃣ Update inquiry status
  await updateDoc(doc(db, "inquiries", inquiry.id), {
    status: "sold",
    updatedAt: serverTimestamp(),
  });

  // 3️⃣ Mark car as out of stock
  await updateDoc(doc(db, "cars", inquiry.carId), {
    inStock: false,
  });
};
