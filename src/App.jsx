import { useEffect, useMemo, useState } from "react";
import {
  createProfile,
  listProfiles,
  createInterest,
  listInterests,
  assignUserInterest,
  listUserInterests,
  createGeoposition,
  createEvent,
  listEvents,
} from "./services/firestore";

function App() {
  // Profiles (SQL: Profile)
  const [profiles, setProfiles] = useState([]);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pAge, setPAge] = useState("");
  const [pGender, setPGender] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  // Interests (SQL: Interests_stack + Users_interest)
  const [interests, setInterests] = useState([]);
  const [newInterestName, setNewInterestName] = useState("");
  const [selectedInterestId, setSelectedInterestId] = useState("");
  const [selectedUserInterests, setSelectedUserInterests] = useState([]);

  // Geoposition and Events (SQL: Geopositions, Events)
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eTime, setETime] = useState(""); // ISO datetime-local
  const [useGeo, setUseGeo] = useState(false);

  const [events, setEvents] = useState([]);

  // Initial loads
  useEffect(() => {
    refreshProfiles();
    refreshInterests();
    refreshEvents();
  }, []);

  // When selected profile changes, load their interests
  useEffect(() => {
    if (!selectedProfileId) {
      setSelectedUserInterests([]);
      return;
    }
    (async () => {
      const list = await listUserInterests(selectedProfileId);
      setSelectedUserInterests(list);
    })();
  }, [selectedProfileId]);

  async function refreshProfiles() {
    const list = await listProfiles();
    setProfiles(list);
    if (list.length && !selectedProfileId) setSelectedProfileId(list[0].id);
  }
  async function refreshInterests() {
    const list = await listInterests();
    setInterests(list);
    if (list.length && !selectedInterestId) setSelectedInterestId(list[0].id);
  }
  async function refreshEvents() {
    const list = await listEvents();
    setEvents(list);
  }

  // Handlers: Profile
  async function handleCreateProfile() {
    if (!pName.trim() || !pEmail.trim()) return;
    await createProfile({ name: pName.trim(), age: pAge === '' ? null : Number(pAge), gender: pGender, email: pEmail.trim() });
    setPName("");
    setPEmail("");
    setPAge("");
    setPGender(false);
    await refreshProfiles();
  }

  // Handlers: Interests
  async function handleCreateInterest() {
    if (!newInterestName.trim()) return;
    await createInterest({ name: newInterestName.trim() });
    setNewInterestName("");
    await refreshInterests();
  }

  async function handleAssignInterest() {
    if (!selectedProfileId || !selectedInterestId) return;
    await assignUserInterest({ userId: selectedProfileId, interestId: selectedInterestId });
    const list = await listUserInterests(selectedProfileId);
    setSelectedUserInterests(list);
  }

  // Handlers: Events & Geoposition
  async function handleCreateEvent() {
    if (!eName.trim() || !selectedProfileId) return;

    let geopositionId = null;
    if (useGeo) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        alert("Укажите корректные координаты");
        return;
      }
      geopositionId = await createGeoposition({ lat: latNum, lng: lngNum });
    }

    await createEvent({
      name: eName.trim(),
      description: eDesc.trim(),
      geopositionId,
      organizerId: selectedProfileId,
      timeISO: eTime ? new Date(eTime).toISOString() : null,
    });

    setEName("");
    setEDesc("");
    setETime("");
    setLat("");
    setLng("");
    setUseGeo(false);

    await refreshEvents();
  }

  const selectedProfile = useMemo(() => profiles.find(p => p.id === selectedProfileId), [profiles, selectedProfileId]);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>
      <h1>Commonplace — демо по схеме хранения</h1>

      {/* Profiles */}
      <section style={{ marginBottom: 24 }}>
        <h2>Профили (таблица: Profile)</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Имя (Name)" style={{ padding: 8 }} />
          <input value={pEmail} onChange={e=>setPEmail(e.target.value)} placeholder="Email" style={{ padding: 8 }} />
          <input value={pAge} onChange={e=>setPAge(e.target.value)} placeholder="Возраст (Age)" type="number" style={{ padding: 8, width: 140 }} />
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={pGender} onChange={e=>setPGender(e.target.checked)} />
            Gender (BINARY)
          </label>
          <button onClick={handleCreateProfile} style={{ padding: "8px 14px" }}>Создать профиль</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {profiles.length === 0 ? (
            <p>Пока нет профилей.</p>
          ) : (
            <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} style={{ background: p.id === selectedProfileId ? "#f2f7ff" : undefined }}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.age ?? "—"}</td>
                    <td>{p.gender ? "1" : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {profiles.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <label>
              Выбранный профиль:
              <select value={selectedProfileId} onChange={e=>setSelectedProfileId(e.target.value)} style={{ marginLeft: 8 }}>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.email || p.id}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      {/* Interests */}
      <section style={{ marginBottom: 24 }}>
        <h2>Интересы (таблица: Interests_stack, связь: Users_interest)</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={newInterestName} onChange={e=>setNewInterestName(e.target.value)} placeholder="Новый интерес (interest_name)" style={{ padding: 8 }} />
          <button onClick={handleCreateInterest} style={{ padding: "8px 14px" }}>Создать интерес</button>
        </div>

        {interests.length > 0 && profiles.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label>
              Интерес:
              <select value={selectedInterestId} onChange={e=>setSelectedInterestId(e.target.value)} style={{ marginLeft: 8 }}>
                {interests.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </label>
            <button onClick={handleAssignInterest} style={{ padding: "8px 14px" }} disabled={!selectedProfileId || !selectedInterestId}>Назначить выбранному профилю</button>
          </div>
        )}

        {selectedProfile && (
          <div style={{ marginTop: 12 }}>
            <strong>Интересы профиля {selectedProfile.name || selectedProfile.email}:</strong>
            {selectedUserInterests.length === 0 ? (
              <div>Нет интересов</div>
            ) : (
              <ul>
                {selectedUserInterests.map(i => (
                  <li key={i.id}>{i.name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Events */}
      <section>
        <h2>События (таблица: Events, гео: Geopositions)</h2>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", alignItems: "center" }}>
          <input value={eName} onChange={e=>setEName(e.target.value)} placeholder="Название события (Name)" style={{ padding: 8 }} />
          <input value={eDesc} onChange={e=>setEDesc(e.target.value)} placeholder="Описание (Description)" style={{ padding: 8 }} />
          <label>
            Дата и время (Time):
            <input type="datetime-local" value={eTime} onChange={e=>setETime(e.target.value)} style={{ padding: 8, display: "block" }} />
          </label>
          <label>
            Организатор (Profile):
            <select value={selectedProfileId} onChange={e=>setSelectedProfileId(e.target.value)} style={{ display: "block" }}>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.email || p.id}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={useGeo} onChange={e=>setUseGeo(e.target.checked)} />
            Указать геопозицию (Geopositions)
          </label>
          {useGeo && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Широта (lat)" style={{ padding: 8 }} />
              <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Долгота (lng)" style={{ padding: 8 }} />
            </div>
          )}
          <div>
            <button onClick={handleCreateEvent} style={{ padding: "8px 14px" }} disabled={!eName.trim() || !selectedProfileId}>Создать событие</button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {events.length === 0 ? (
            <p>Пока нет событий.</p>
          ) : (
            <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Organizer</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Time</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id}>
                    <td>{ev.id}</td>
                    <td>{ev.organizerName}</td>
                    <td>{ev.name}</td>
                    <td>{ev.description}</td>
                    <td>{ev.time ? new Date(ev.time.seconds ? ev.time.seconds * 1000 : ev.time).toLocaleString() : "—"}</td>
                    <td>{typeof ev.lat === 'number' ? ev.lat.toFixed(6) : '—'}</td>
                    <td>{typeof ev.lng === 'number' ? ev.lng.toFixed(6) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />
    </div>
  );
}

export default App;