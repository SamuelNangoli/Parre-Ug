import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Ticket, Check } from "lucide-react";
import { shop } from "../services/api.js";
import { useAccount } from "../lib/account-context.js";
import { go } from "../lib/navigation.js";
import { eventDate, ugx } from "../lib/events.js";
import PaymentPanel from "../components/PaymentPanel.jsx";

export default function CheckoutPage({ id, query }) {
  const { user } = useAccount();
  const [event, setEvent] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [order, setOrder] = useState(null);
  const requestKey = useRef(crypto.randomUUID());
  const ticketId = query.get("ticket") || "general",
    quantity = Number(query.get("quantity") || 1),
    plan = query.get("plan") === "instalments" ? "instalments" : "full";
  useEffect(() => {
    let active = true;
    shop
      .events()
      .then((result) => {
        if (active) setEvent(result.events.find((item) => item.id === id));
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
  const ticket = event?.tickets.find((item) => item.id === ticketId),
    total = order?.total ?? (ticket?.price || 0) * quantity;
  const dueNow = plan === "full" ? total : Math.ceil(total / 4);
  async function reserve() {
    const result = await shop.book({
      eventId: id,
      ticketId,
      quantity,
      plan,
      requestKey: requestKey.current,
    });
    setOrder(result.order);
    return result.order.id;
  }
  if (loading)
    return (
      <p className="shop-empty" role="status">
        Preparing checkout…
      </p>
    );
  if (
    !event ||
    event.bookingAvailable === false ||
    event.reference ||
    !ticket ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 8
  )
    return (
      <div className="shop-empty">
        <h1>Let’s choose your tickets again.</h1>
        <p>{error || "These ticket details are no longer available."}</p>
        <a className="button primary" href="#/">
          Find an event
        </a>
      </div>
    );
  return (
    <div className="commerce-container">
      <a className="back-link" href={`#/event/${id}`}>
        <ArrowLeft size={17} />
        Back to event
      </a>
      <div className="checkout-heading">
        <span className="eyebrow">YOU’RE ALMOST THERE</span>
        <h1>Make it official.</h1>
        <p>A few details, then you’re one step closer to the good times.</p>
        <ol className="checkout-steps">
          <li>
            <Check size={14} />
            Tickets selected
          </li>
          <li>
            <Check size={14} />
            Signed in
          </li>
          <li className="current">
            3<span>Payment</span>
          </li>
        </ol>
      </div>
      <div className="checkout-grid">
        <div>
          <div className="checkout-account">
            <span className="account-avatar">{user.name.charAt(0)}</span>
            <div>
              <small>Booking as</small>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <span className="badge positive">Signed in</span>
          </div>
          <PaymentPanel
            amount={dueNow}
            beforePayment={reserve}
            orderId={order?.id}
            onOrderChanged={setOrder}
            onPaid={(value) => go(`/booking/${value.id}?paid=1`)}
          />
        </div>
        <aside className="order-summary">
          <div className={`summary-art ${event.theme}`}>
            <Ticket size={38} />
            <span>YOUR NEXT PARRE</span>
            <h2>{event.title}</h2>
          </div>
          <div className="summary-body">
            <p>
              <CalendarDays size={16} />
              {eventDate(event.date)}
            </p>
            <p>
              <MapPin size={16} />
              {event.venue}
            </p>
            <div className="summary-line">
              <span>
                {ticket.name} × {quantity}
              </span>
              <strong>{ugx(total)}</strong>
            </div>
            <div className="summary-line">
              <span>Payment plan</span>
              <strong>
                {plan === "full" ? "Full payment" : "4 instalments"}
              </strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{ugx(total)}</strong>
            </div>
            <div className="summary-due">
              <span>Due today</span>
              <strong>{ugx(dueNow)}</strong>
            </div>
            {plan === "instalments" && (
              <p className="summary-explainer">
                The remaining {ugx(total - dueNow)} can be paid from My tickets.
                Your ticket unlocks after full payment.
              </p>
            )}
            <p className="summary-explainer">
              Unpaid ticket reservations are held for 15 minutes. All amounts
              are in Ugandan shillings.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
