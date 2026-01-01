import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "./firebaseConfig";

// Reference to cars collection
const carsCollection = collection(db, "cars");

// Add a new car (Admin only)
export const addCar = async (carData) => {
  await addDoc(carsCollection, carData);
};

// Get all cars (Admin & Customer)
export const getCars = async () => {
  const snapshot = await getDocs(carsCollection);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
};

// ✅ Get one car by ID (for Car Details page)
export const getCarById = async (id) => {
  const snap = await getDoc(doc(db, "cars", id));
  if (!snap.exists()) throw new Error("Car not found");
  return { id: snap.id, ...snap.data() };
};

// Delete car (Admin only)
export const deleteCar = async (id) => {
  await deleteDoc(doc(db, "cars", id));
};
