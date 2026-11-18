import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { shop } from "../services/api.js";
import { eventDate, ugx } from "../lib/events.js";
import { go } from "../lib/navigation.js";
import EventPoster from '../components/EventPoster.jsx';

export default function EventPage({ id }) {
  const [event, setEvent] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("general"),
    [quantity, setQuantity] = useState(1),
    [plan, setPlan] = useState("full");
  useEffect(() => {
    let active = true;
    shop
      .events()
      .then((value) => {
        if (active)
          setEvent(value.events.find((item) => item.id === id) || null);
      })
      .catch((value) => {
        if (active) setError(value.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (loading)
    return (
      <p className="shop-empty" role="status">
        Getting your event ready…
      </p>
    );
  if (!event)
    return (
      <div className="shop-empty">
        <h1>That event isn’t available.</h1>
        <p>{error || "It may be sold out, unpublished or no longer listed."}</p>
        <a className="button primary" href="#/">
          Discover events
        </a>
      </div>
    );
  if (event.feed) return (
    <div className="commerce-container">
      <a className="back-link" href="#/"><ArrowLeft size={17} />Back to events</a>
      <div className="event-detail-grid">
        <div><EventPoster event={event} large /><div className="event-detail-copy"><span className="event-category">{event.category}</span><h1>{event.title}</h1><div className="event-detail-meta"><span><CalendarDays size={19} />{eventDate(event.date)} · {new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit' }).format(new Date(event.startsAt))} EAT</span><span><MapPin size={19} />{event.venue}</span></div><h2>Something to look forward to.</h2><p>Save the date and bring your people. Ticket availability will be confirmed when booking opens.</p></div></div>
        <aside className="ticket-selector source-ticket-panel"><span className="eyebrow">SAVE THE DATE</span><h2>Be ready for your next Parre.</h2><strong className="source-ticket-price">{ugx(event.tickets[0].price)}</strong><p>Booking opens soon. Check back for ticket options and availability.</p><button className="button primary" disabled>Tickets available soon</button><a className="back-link" href="#/">Explore more events<ArrowUpRight size={18} /></a></aside>
      </div>
    </div>
  );
  if (event.reference) return (
    <div className="commerce-container">
      <a className="back-link" href="#/"><ArrowLeft size={17} />Back to events</a>
      <div className="event-detail-grid reference-event-detail">
        <div><EventPoster event={event} large /><div className="event-detail-copy"><span className="event-category">{event.category} · {event.source}</span><h1>{event.title}</h1><div className="event-detail-meta"><span><CalendarDays size={19} />{eventDate(event.date)}</span><span><MapPin size={19} />{event.venue}</span></div><h2>Make a plan for the good times.</h2><p>{event.description}</p><p className="event-source-credit">Artwork and event details from <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">the official {event.source} listing</a>.</p></div></div>
        <aside className="ticket-selector source-ticket-panel"><span className="eyebrow">OFFICIAL EVENT LISTING</span><h2>Find your ticket on {event.source}.</h2><p>View current availability, event conditions and ticket options on the original listing.</p><strong className="source-ticket-price">{event.priceLabel}</strong><p>{event.ticketDetails}</p><a className="button primary" href={event.sourceUrl} target="_blank" rel="noopener noreferrer">View tickets on {event.source}<ArrowUpRight size={18} /></a><span className="selector-account">Prices are shown in South African rand. This listing is linked from {event.source} and is not sold through Parre.ug.</span></aside>
      </div>
    </div>
  );
  const ticket = event.tickets.find((item) => item.id === ticketId),
    total = ticket.price * quantity;
  const validQuantity =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= Math.min(8, ticket.available);
  return (
    <div className="commerce-container">
      <a className="back-link" href="#/">
        <ArrowLeft size={17} />
        Back to events
      </a>
      <div className="event-detail-grid">
        <div>
          <EventPoster event={event} large />
          <div className="event-detail-copy">
            <span className="event-category">{event.category}</span>
            <h1>{event.title}</h1>
            <div className="event-detail-meta">
              <span>
                <CalendarDays size={19} />
                {eventDate(event.date)}
              </span>
              <span>
                <MapPin size={19} />
                {event.venue}
              </span>
            </div>
            <h2>The good times are calling.</h2>
            <p>
              {event.description ||
                "A night for good music, great company and unforgettable moments. Bring your people and make it a Parre."}
            </p>
            <div className="event-detail-note">
              <ShieldCheck size={22} />
              <p>
                Your booking and instalments stay in your account. Your ticket
                becomes available once you’ve paid in full.
              </p>
            </div>
          </div>
        </div>
        <form
          className="ticket-selector"
          onSubmit={(e) => {
            e.preventDefault();
            if (validQuantity)
              go(
                `/checkout/${event.id}?ticket=${ticketId}&quantity=${quantity}&plan=${plan}`,
              );
          }}
        >
          <span className="eyebrow">SAVE YOUR SPOT</span>
          <h2>Your ticket to a good time.</h2>
          <p>Choose how you want to Parre.</p>
          <fieldset className="ticket-options">
            <legend>Ticket category</legend>
            {event.tickets.map((item) => (
              <label
                className={
                  ticketId === item.id
                    ? "ticket-option selected"
                    : "ticket-option"
                }
                key={item.id}
              >
                <input
                  type="radio"
                  name="ticket"
                  value={item.id}
                  checked={ticketId === item.id}
                  onChange={() => {
                    setTicketId(item.id);
                    setQuantity(1);
                  }}
                  disabled={!item.available}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.available > 0
                      ? `${item.available} tickets available`
                      : "Sold out"}
                  </small>
                </span>
                <strong>{ugx(item.price)}</strong>
              </label>
            ))}
          </fieldset>
          <div className="quantity-row">
            <label htmlFor="ticket-quantity">How many tickets?</label>
            <div className="quantity-control">
              <button
                type="button"
                aria-label="Remove one ticket"
                onClick={() => setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <input
                id="ticket-quantity"
                type="number"
                min="1"
                max={Math.min(8, ticket.available)}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
              <button
                type="button"
                aria-label="Add one ticket"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= Math.min(8, ticket.available)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <fieldset className="plan-options">
            <legend>Make it work for you</legend>
            <label className={plan === "full" ? "selected" : ""}>
              <input
                type="radio"
                name="plan"
                checked={plan === "full"}
                onChange={() => setPlan("full")}
              />
              <span>
                <strong>Pay in full</strong>
                <small>One payment. You’re all set.</small>
              </span>
            </label>
            <label className={plan === "instalments" ? "selected" : ""}>
              <input
                type="radio"
                name="plan"
                checked={plan === "instalments"}
                onChange={() => setPlan("instalments")}
              />
              <span>
                <strong>Pay in 4 instalments</strong>
                <small>Start with 25%. Pay the rest from your account.</small>
              </span>
            </label>
          </fieldset>
          <div className="selector-total">
            <span>
              Total for {quantity || 0} ticket{quantity === 1 ? "" : "s"}
            </span>
            <strong>{ugx(total)}</strong>
            {plan === "instalments" && (
              <small>{ugx(Math.ceil(total / 4))} due today</small>
            )}
          </div>
          {!validQuantity && (
            <p className="form-alert" role="alert">
              Choose an available ticket and a valid quantity.
            </p>
          )}
          <button className="button primary" disabled={!validQuantity}>
            Buy tickets
            <ArrowUpRight size={18} />
          </button>
          <span className="selector-account">
            An account is required to complete your booking.
          </span>
        </form>
      </div>
    </div>
  );
}
