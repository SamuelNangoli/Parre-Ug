import { useEffect, useState } from "react";
import { request } from "../services/api.js";

export function PeoplePage({ currentUser }) {
  const [users, setUsers] = useState(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState("");
  useEffect(() => {
    request("/admin/users")
      .then((value) => setUsers(value.users))
      .catch((value) => setError(value.message));
  }, []);
  async function toggle(user) {
    setPending(user.id);
    setError("");
    try {
      const value = await request("/admin/users/" + user.id, {
        method: "PATCH",
        data: { active: !user.active },
      });
      setUsers(value.users);
    } catch (value) {
      setError(value.message);
    } finally {
      setPending("");
    }
  }
  return (
    <section className="panel people-panel">
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Platform accounts and role access
          </caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Account access</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span
                    className={`badge ${user.active ? "positive" : "neutral"}`}
                  >
                    {user.active ? "Active" : "Suspended"}
                  </span>
                </td>
                <td>
                  {user.id === currentUser.id ? (
                    <span className="muted">Your account</span>
                  ) : (
                    <button
                      className="button secondary"
                      disabled={pending === user.id}
                      onClick={() => toggle(user)}
                    >
                      {pending === user.id
                        ? "Saving…"
                        : user.active
                          ? "Suspend account"
                          : "Restore access"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users && !error && (
        <p className="empty" role="status">
          Loading accounts…
        </p>
      )}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export function SupportPage() {
  const [requests, setRequests] = useState(null),
    [replies, setReplies] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const load = () =>
    request("/manage/support")
      .then((value) => setRequests(value.requests))
      .catch((value) => setError(value.message));
  useEffect(() => {
    load();
  }, []);
  async function submit(event, id) {
    event.preventDefault();
    setBusy(id);
    setError("");
    try {
      await request("/manage/support/" + id, {
        method: "PATCH",
        data: { reply: replies[id] },
      });
      await load();
    } catch (value) {
      setError(value.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="management-support">
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      {requests === null ? (
        <p className="empty" role="status">
          Loading support requests…
        </p>
      ) : !requests.length ? (
        <div className="panel empty">
          <h2>You’re all caught up.</h2>
          <p>Customer booking questions will appear here.</p>
        </div>
      ) : (
        requests.map((item) => (
          <article className="panel support-item" key={item.id}>
            <span className="badge neutral">{item.status}</span>
            <h2>{item.eventTitle}</h2>
            <small>
              {item.orderId} · {item.customer}
            </small>
            <p>{item.message}</p>
            {item.reply ? (
              <blockquote>
                <strong>Your response</strong>
                {item.reply}
              </blockquote>
            ) : (
              <form
                className="shop-form"
                onSubmit={(event) => submit(event, item.id)}
              >
                <label>
                  Reply to {item.customer}
                  <textarea
                    required
                    minLength={5}
                    maxLength={1000}
                    value={replies[item.id] || ""}
                    onChange={(event) =>
                      setReplies({ ...replies, [item.id]: event.target.value })
                    }
                  />
                </label>
                <button className="button primary" disabled={busy === item.id}>
                  {busy === item.id ? "Sending…" : "Send reply & resolve"}
                </button>
              </form>
            )}
          </article>
        ))
      )}
    </section>
  );
}
