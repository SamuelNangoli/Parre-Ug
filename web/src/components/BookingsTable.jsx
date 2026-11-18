import { ugx, paymentStatus } from "../lib/events.js";

export default function BookingsTable({ bookings, events }) {
  return (
    <div
      className="table-scroll"
      tabIndex="0"
      role="region"
      aria-label="Bookings table, scroll horizontally on small screens"
    >
      <table>
        <caption className="sr-only">Bookings and payment balances</caption>
        <thead>
          <tr>
            <th scope="col">Booking / guest</th>
            <th scope="col">Event</th>
            <th scope="col">Tickets</th>
            <th scope="col">Payment progress</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <strong>{booking.id}</strong>
                <span className="cell-detail">{booking.customer}</span>
              </td>
              <td>
                {events.find((event) => event.id === booking.eventId)?.title ??
                  "Unknown event"}
                <span className="cell-detail">{booking.method}</span>
              </td>
              <td>
                {booking.quantity} ×{" "}
                {booking.ticketId === "vip" ? "VIP" : "General"}
              </td>
              <td>
                <span className="payment-amount">
                  {ugx(booking.paid)}{" "}
                  <span className="muted">/ {ugx(booking.total)}</span>
                </span>
                <progress
                  value={booking.paid}
                  max={booking.total}
                  aria-label={`${booking.id}: ${ugx(booking.paid)} paid of ${ugx(booking.total)}`}
                />
              </td>
              <td>
                <span
                  className={`badge ${paymentStatus(booking) === "Paid" ? "positive" : paymentStatus(booking) === "Unpaid" ? "neutral" : "pending"}`}
                >
                  {paymentStatus(booking)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!bookings.length && (
        <p className="empty">No bookings match your search.</p>
      )}
    </div>
  );
}
