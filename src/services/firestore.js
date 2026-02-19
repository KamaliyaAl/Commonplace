import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  GeoPoint,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

// Collections mapped 1:1 to your SQL table names
export const COL = {
  Profile: "Profile",
  Events: "Events",
  Interests_stack: "Interests_stack",
  Users_interest: "Users_interest", // apostrophes/spaces are avoided for collection name
  Locations: "Locations",
  Geopositions: "Geopositions",
  friends_relations: "friends_relations",
  is_favourite_location: "is_favourite_location",
  is_favourite_event: "is_favourite_event",
};

// Helpers: create/read basic entities using SQL-like field names
export async function createProfile({ name, age = null, gender = false, email }) {
  const ref = await addDoc(collection(db, COL.Profile), {
    Name: name,
    Age: age === null || age === undefined || age === '' ? null : Number(age),
    Gender: Boolean(gender), // maps SQL BINARY to boolean
    email: email,
    createdAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  const data = snap.data();
  return { id: ref.id, name: data?.Name, age: data?.Age, gender: data?.Gender, email: data?.email };
}

export async function listProfiles() {
  const q = query(collection(db, COL.Profile), orderBy("Name"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => {
    const data = d.data();
    return { id: d.id, name: data?.Name, age: data?.Age, gender: data?.Gender, email: data?.email };
  });
}

export async function createInterest({ name }) {
  const ref = await addDoc(collection(db, COL.Interests_stack), { interest_name: name });
  const snap = await getDoc(ref);
  const data = snap.data();
  return { id: ref.id, name: data?.interest_name };
}

export async function listInterests() {
  const q = query(collection(db, COL.Interests_stack), orderBy("interest_name"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, name: d.data()?.interest_name }));
}

export async function assignUserInterest({ userId, interestId }) {
  // Deterministic ID to avoid duplicates
  const id = `${userId}_${interestId}`;
  return setDoc(doc(db, COL.Users_interest, id), {
    user: doc(db, COL.Profile, userId),
    interest: doc(db, COL.Interests_stack, interestId),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function listUserInterests(userId) {
  const q = query(
    collection(db, COL.Users_interest),
    where("user", "==", doc(db, COL.Profile, userId))
  );
  const snaps = await getDocs(q);
  // Resolve interest names client-side (simple approach)
  const interests = [];
  for (const d of snaps.docs) {
    const data = d.data();
    if (data?.interest) {
      const interestSnap = await getDoc(data.interest);
      if (interestSnap.exists()) interests.push({ id: interestSnap.id, name: interestSnap.data()?.interest_name });
    }
  }
  return interests;
}

export async function createGeoposition({ lat, lng }) {
  const ref = await addDoc(collection(db, COL.Geopositions), {
    Point: new GeoPoint(lat, lng),
    lat: Number(lat),
    lng: Number(lng),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createEvent({ name, description = "", geopositionId = null, organizerId, timeISO = null }) {
  const payload = {
    Name: name || "",
    Description: description || "",
    Organizer_id: doc(db, COL.Profile, organizerId),
    Time: timeISO ? Timestamp.fromDate(new Date(timeISO)) : null,
    createdAt: serverTimestamp(),
  };
  if (geopositionId) payload.Geoposition_id = doc(db, COL.Geopositions, geopositionId);
  const ref = await addDoc(collection(db, COL.Events), payload);
  const snap = await getDoc(ref);
  const data = snap.data();
  return { id: ref.id, name: data?.Name, description: data?.Description, time: data?.Time };
}

export async function listEvents() {
  const snaps = await getDocs(collection(db, COL.Events));
  // Denormalize for display: resolve organizer name and geoposition
  const out = [];
  for (const d of snaps.docs) {
    const data = d.data();

    // Organizer name
    let organizerName = "";
    if (data?.Organizer_id) {
      const orgSnap = await getDoc(data.Organizer_id);
      const org = orgSnap.data();
      organizerName = orgSnap.exists() ? (org?.Name || org?.email || orgSnap.id) : "";
    }

    // Geoposition lat/lng
    let lat = null;
    let lng = null;
    let geopositionId = null;
    if (data?.Geoposition_id) {
      geopositionId = data.Geoposition_id.id;
      const geoSnap = await getDoc(data.Geoposition_id);
      if (geoSnap.exists()) {
        const g = geoSnap.data();
        if (typeof g?.lat === 'number' && typeof g?.lng === 'number') {
          lat = g.lat;
          lng = g.lng;
        } else if (g?.Point && typeof g.Point.latitude === 'number' && typeof g.Point.longitude === 'number') {
          lat = g.Point.latitude;
          lng = g.Point.longitude;
        }
      }
    }

    out.push({
      id: d.id,
      organizerName,
      name: data?.Name,
      description: data?.Description,
      time: data?.Time,
      lat,
      lng,
      geopositionId,
    });
  }
  return out;
}


