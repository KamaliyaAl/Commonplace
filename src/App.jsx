import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");

  // Шаг A: Читаем всех пользователей из коллекции "users"
  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // При загрузке страницы — читаем данные
  useEffect(() => {
    fetchUsers();
  }, []);

  // Шаг B: Добавляем нового пользователя в коллекцию "users"
  const handleAddUser = async () => {
    if (!name.trim() || !email.trim()) return;

    await addDoc(collection(db, "users"), {
      name: name,
      email: email,
      age: Number(age),
      createdAt: new Date().toISOString(),
    });

    // Очищаем поля
    setName("");
    setEmail("");
    setAge("");

    // Обновляем список
    fetchUsers();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>👤 Пользователи</h1>

      {/* Форма добавления */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          style={{ padding: "0.5rem" }}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ padding: "0.5rem" }}
        />
        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Возраст"
          type="number"
          style={{ padding: "0.5rem" }}
        />
        <button onClick={handleAddUser} style={{ padding: "0.5rem 1rem" }}>
          Добавить
        </button>
      </div>

      {/* Список пользователей */}
      {users.length === 0 ? (
        <p>Пока нет пользователей.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Возраст</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;