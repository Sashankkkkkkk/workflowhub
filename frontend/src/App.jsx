import { useEffect, useState } from "react";
import { api } from "./api.js";

export const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data =
        mode === "login"
          ? await api.login(form.username, form.password)
          : await api.register(form.username, form.email, form.password);
      onAuthenticated(data.token, data.user.username);
    } catch (err) {
      setError(err.message);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form className="card" onSubmit={submit} aria-label={mode}>
      <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
      <label>
        Username
        <input value={form.username} onChange={set("username")} required />
      </label>
      {mode === "register" && (
        <label>
          Email
          <input type="email" value={form.email} onChange={set("email")} />
        </label>
      )}
      <label>
        Password
        <input type="password" value={form.password} onChange={set("password")} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit">{mode === "login" ? "Log in" : "Register"}</button>
      <button
        type="button"
        className="link"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
      </button>
    </form>
  );
}

function ItemForm({ onSave, initial, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description });
    if (!initial) {
      setTitle("");
      setDescription("");
    }
  };

  return (
    <form className="item-form" onSubmit={submit}>
      <input
        placeholder="Workflow item title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Title"
      />
      <input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        aria-label="Description"
      />
      <button type="submit">{initial ? "Save" : "Add item"}</button>
      {onCancel && (
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}

function Dashboard({ token, username, onLogout }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setItems(await api.list(token));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const guard = (fn) => async (...args) => {
    setError("");
    try {
      await fn(...args);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const add = guard((item) => api.create(token, item));
  const changeStatus = guard((id, status) => api.update(token, id, { status }));
  const saveEdit = guard(async (id, changes) => {
    await api.update(token, id, changes);
    setEditingId(null);
  });
  const remove = guard((id) => api.remove(token, id));

  return (
    <div>
      <header className="bar">
        <span>Signed in as <strong>{username}</strong></span>
        <button onClick={onLogout}>Log out</button>
      </header>
      <ItemForm onSave={add} />
      {error && <p className="error" role="alert">{error}</p>}
      <ul className="items">
        {items.length === 0 && <li className="empty">No workflow items yet.</li>}
        {items.map((item) => (
          <li key={item.id} className={`item ${item.status}`}>
            {editingId === item.id ? (
              <ItemForm
                initial={item}
                onSave={(changes) => saveEdit(item.id, changes)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </div>
                <div className="actions">
                  <select
                    value={item.status}
                    aria-label={`Status of ${item.title}`}
                    onChange={(e) => changeStatus(item.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={() => setEditingId(item.id)}>Edit</button>
                  <button className="danger" onClick={() => remove(item.id)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("workflowhub-session")) || null;
    } catch {
      return null;
    }
  });

  const start = (token, username) => {
    const s = { token, username };
    localStorage.setItem("workflowhub-session", JSON.stringify(s));
    setSession(s);
  };

  const logout = async () => {
    try {
      await api.logout(session.token);
    } catch {
      /* token may already be invalid - still clear the local session */
    }
    localStorage.removeItem("workflowhub-session");
    setSession(null);
  };

  return (
    <main>
      <h1>WorkFlowHub</h1>
      {session ? (
        <Dashboard token={session.token} username={session.username} onLogout={logout} />
      ) : (
        <AuthForm onAuthenticated={start} />
      )}
    </main>
  );
}
