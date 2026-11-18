import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Ticket,
  LockKeyhole,
  MessageCircle,
} from "lucide-react";
import { shop } from "../services/api.js";
import { eventDate, ugx } from "../lib/events.js";
import PaymentPanel from "../components/PaymentPanel.jsx";

export default function BookingPage({ id, query }) {
  const [order, setOrder] = useState(null),
    [error, setError] = useState(""),
    [showPayment, setShowPayment] = useState(false),
    [portion, setPortion] = useState("next"),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false),
    [supportNotice, setSupportNotice] = useState("");
  useEffect(() => {
    let active = true;
    shop
      .order(id)
      .then((value) => {
        if (active) setOrder(value.order);
      })
      .catch((value) => {
        if (active) setError(value.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function support(event) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const value = await shop.support(id, message);
      setOrder(value.order);
      setMessage("");
      setSupportNotice("Your request has been sent to the event team.");
    } catch (value) {
      setError(value.message);
    } finally {
      setSending(false);
    }
  }
  if (!order)
    return (
      <div className="shop-empty">
        {error ? (
          <>
            <h1>Booking unavailable.</h1>
            <p>{error}</p>
            <a className="button primary" href="#/my-tickets">
              My tickets
            </a>
          </>
        ) : (
          <p role="status">Opening your booking…</p>
        )}
      </div>
    );
  const nextAmount =
    order.plan === "instalments" && portion === "next"
      ? Math.min(Math.ceil(order.total / 4), order.balance)
      : order.balance;
  return (
    <div className="commerce-container booking-page">
      <a className="back-link" href="#/my-tickets">
        <ArrowLeft size={17} />
        Back to my tickets
      </a>
      {query.get("paid") && (
        <div className="payment-confirmation" role="status">
          <CheckCircle2 size={25} />
          <div>
            <strong>Test payment recorded.</strong>
            <span>
              {order.status === "Paid"
                ? "Your sample ticket is ready below."
                : "You’re one step closer. Track the remaining balance below."}
            </span>
          </div>
        </div>
      )}
      <div className="booking-heading">
        <div>
          <span className="eyebrow">YOUR BOOKING · {order.id}</span>
          <h1>{order.event?.title || "Your event"}</h1>
          <p>
            {order.event && (
              <>
                <CalendarDays size={16} />
                {eventDate(order.event.date)}
                <MapPin size={16} />
                {order.event.venue}
              </>
            )}
          </p>
        </div>
        <span
          className={`badge ${order.status === "Paid" ? "positive" : "pending"}`}
        >
          {order.status}
        </span>
      </div>
      <div className="booking-grid">
        <div>
          <section className="booking-balance">
            <div>
              <span>Paid so far</span>
              <strong>{ugx(order.paid)}</strong>
            </div>
            <div>
              <span>Remaining balance</span>
              <strong>{ugx(order.balance)}</strong>
            </div>
            <progress
              max={order.total}
              value={order.paid}
              aria-label={`${ugx(order.paid)} paid of ${ugx(order.total)}`}
            />
            <p>
              {order.quantity} × {order.ticketId === "vip" ? "VIP" : "General"}{" "}
              · Total {ugx(order.total)}
            </p>
            {order.balance > 0 && order.status !== "Expired" && (
              <>
                <div className="balance-options">
                  <label>
                    <input
                      type="radio"
                      name="portion"
                      checked={portion === "next"}
                      onChange={() => setPortion("next")}
                    />
                    {order.plan === "instalments"
                      ? "Next instalment"
                      : "Full balance"}
                  </label>
                  {order.plan === "instalments" && (
                    <label>
                      <input
                        type="radio"
                        name="portion"
                        checked={portion === "balance"}
                        onChange={() => setPortion("balance")}
                      />
                      Pay remaining balance
                    </label>
                  )}
                </div>
                <button
                  className="button primary"
                  onClick={() => setShowPayment(!showPayment)}
                >
                  {showPayment
                    ? "Close payment options"
                    : `Pay ${ugx(nextAmount)}`}
                </button>
              </>
            )}
            {order.status === "Expired" && (
              <p className="form-alert">
                This unpaid reservation has expired.{" "}
                <a href={`#/event/${order.eventId}`}>Book tickets again</a>.
              </p>
            )}
          </section>
          {showPayment && order.balance > 0 && (
            <PaymentPanel
              key={portion}
              amount={nextAmount}
              orderId={order.id}
              portion={portion}
              onOrderChanged={setOrder}
              onPaid={(value) => {
                setOrder(value);
                setShowPayment(false);
              }}
            />
          )}
          <section className="payment-history">
            <h2>Payment history</h2>
            {order.payments.length ? (
              order.payments.map((payment) => (
                <div key={payment.id}>
                  <span>
                    {payment.method === "card"
                      ? "Visa / Mastercard"
                      : "Mobile Money"}
                    <small>
                      {new Date(payment.createdAt).toLocaleString("en-UG", {
                        timeZone: "Africa/Kampala",
                      })}{" "}
                      · Test payment
                    </small>
                  </span>
                  <strong>{ugx(payment.amount)}</strong>
                  <span
                    className={`badge ${payment.status === "Succeeded" ? "positive" : "neutral"}`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))
            ) : (
              <p>No payments recorded yet.</p>
            )}
          </section>
        </div>
        <aside className="your-ticket">
          <span className="eyebrow">YOUR TICKET</span>
          {order.ticketCode ? (
            <>
              <Ticket size={38} />
              <h2>You’re on the list.</h2>
              <p>
                {order.quantity} ×{" "}
                {order.ticketId === "vip" ? "VIP" : "General"}
              </p>
              <div className="ticket-perforation" />
              <span className="test-mode-label">
                TEST TICKET · NOT VALID FOR ENTRY
              </span>
              <strong className="ticket-code">{order.ticketCode}</strong>
              <small>
                Your ticket reference is stored in your account. Real ticket
                issuance will follow confirmed gateway payments.
              </small>
            </>
          ) : (
            <>
              <LockKeyhole size={35} />
              <h2>The good times are worth it.</h2>
              <p>Your ticket unlocks once you’ve paid in full.</p>
              <span className="badge neutral">
                {ugx(order.balance)} remaining
              </span>
            </>
          )}
        </aside>
      </div>
      <section className="booking-support">
        <div>
          <MessageCircle size={25} />
          <h2>Need a hand?</h2>
          <p>Send a question about this booking to the event team.</p>
        </div>
        <form className="shop-form" onSubmit={support}>
          <label>
            Message
            <textarea
              required
              minLength={10}
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="How can the team help with your booking?"
            />
          </label>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          {supportNotice && (
            <p className="support-success" role="status">
              {supportNotice}
            </p>
          )}
          <button className="button secondary" disabled={sending}>
            {sending ? "Sending…" : "Send request"}
          </button>
        </form>
        {order.support.length > 0 && (
          <div className="support-thread">
            {order.support.map((request) => (
              <article key={request.id}>
                <span className="badge neutral">{request.status}</span>
                <p>{request.message}</p>
                {request.reply && (
                  <blockquote>
                    <strong>Event team</strong>
                    {request.reply}
                  </blockquote>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
