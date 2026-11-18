import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { validateEvent } from "../lib/events.js";

const blankEvent = () => ({
  title: "",
  venue: "",
  date: "",
  status: "Draft",
  theme: "orange",
  tickets: [
    { id: "general", name: "General", price: 50000, capacity: 100 },
    { id: "vip", name: "VIP", price: 100000, capacity: 50 },
  ],
});

export default function EventEditor({ event, bookings, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    event ? structuredClone(event) : blankEvent(),
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const change = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const ticketChange = (id, key, value) =>
    setForm((previous) => ({
      ...previous,
      tickets: previous.tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, [key]: Number(value) } : ticket,
      ),
    }));
  async function submit(e) {
    e.preventDefault();
    const validation = validateEvent(form, bookings);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        dialog.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await onSave(form);
    } catch (error) {
      setSaveError(
        error.message || "We couldn’t save your event. Please try again.",
      );
      setSaving(false);
    }
  }
  const fieldProps = (key) => ({
    "aria-labelledby": `${key}-label`,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const error = (key) =>
    errors[key] && (
      <small className="field-error" id={`${key}-error`}>
        {errors[key]}
      </small>
    );
  return (
    <dialog
      ref={dialog}
      className="event-dialog"
      aria-labelledby="editor-title"
      onCancel={(e) => {
        if (saving) e.preventDefault();
        else onClose();
      }}
    >
      <form noValidate onSubmit={submit}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MAKE IT HAPPEN</span>
            <h2 id="editor-title">
              {event ? "Edit your event" : "Create an event"}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close event editor"
          >
            <X size={21} />
          </button>
        </div>
        <p className="muted">Set the details. Bring your people together.</p>
        <label>
          <span id="title-label">Event name</span>
          <input
            autoFocus
            maxLength={80}
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
            placeholder="Give the crowd something to look forward to"
            {...fieldProps("title")}
          />
          {error("title")}
        </label>
        <label>
          <span id="venue-label">Venue</span>
          <input
            maxLength={120}
            value={form.venue}
            onChange={(e) => change("venue", e.target.value)}
            placeholder="Venue and city"
            {...fieldProps("venue")}
          />
          {error("venue")}
        </label>
        <div className="form-grid">
          <label>
            <span id="date-label">Event date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => change("date", e.target.value)}
              {...fieldProps("date")}
            />
            {error("date")}
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => change("status", e.target.value)}
            >
              <option>Draft</option>
              <option>Published</option>
            </select>
          </label>
        </div>
        <h3>Ticket categories</h3>
        <p className="muted small">
          Set your prices in UGX and choose the number of tickets available.
        </p>
        {form.tickets.map((ticket) => (
          <fieldset key={ticket.id}>
            <legend>{ticket.name}</legend>
            <div className="form-grid">
              <label>
                <span id={`${ticket.id}Price-label`}>Price (UGX)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ticket.price || ""}
                  onChange={(e) =>
                    ticketChange(ticket.id, "price", e.target.value)
                  }
                  {...fieldProps(`${ticket.id}Price`)}
                />
                {error(`${ticket.id}Price`)}
              </label>
              <label>
                <span id={`${ticket.id}Capacity-label`}>Capacity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ticket.capacity || ""}
                  onChange={(e) =>
                    ticketChange(ticket.id, "capacity", e.target.value)
                  }
                  {...fieldProps(`${ticket.id}Capacity`)}
                />
                {error(`${ticket.id}Capacity`)}
              </label>
            </div>
          </fieldset>
        ))}
        {saveError && (
          <p className="field-error" role="alert">
            {saveError}
          </p>
        )}
        <div className="dialog-actions">
          <button
            className="button secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? "Saving…" : "Save event"}
            <ArrowUpRight size={18} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
