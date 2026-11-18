import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Ticket } from "lucide-react";
import { shop } from "../services/api.js";
import { eventDate, ugx } from "../lib/events.js";

export default function MyTicketsPage() {
  const [orders, setOrders] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    shop
      .orders()
      .then((value) => {
        if (active) setOrders(value.orders);
      })
      .catch((value) => {
        if (active) setError(value.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="commerce-container my-tickets">
      <div className="shop-section-heading">
        <div>
          <span className="eyebrow">YOUR GOOD TIMES, ALL TOGETHER</span>
          <h1>My tickets & payments.</h1>
          <p>
            Track your bookings, finish your instalments and find your tickets.
          </p>
        </div>
        <a className="button secondary" href="#/">
          Discover more
          <ArrowUpRight size={16} />
        </a>
      </div>
      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : orders === null ? (
        <p className="shop-empty" role="status">
          Finding your bookings…
        </p>
      ) : !orders.length ? (
        <div className="empty-tickets">
          <Ticket size={45} />
          <h2>Your next good time is waiting.</h2>
          <p>
            You haven’t booked an event yet. Find something you’ll love and make
            a plan.
          </p>
          <a className="button primary" href="#/">
            Explore events
            <ArrowUpRight size={17} />
          </a>
        </div>
      ) : (
        <div className="customer-order-list">
          {orders.map((order) => (
            <article className="customer-order-card" key={order.id}>
              <div className={`order-card-art ${order.event?.theme}`}>
                <Ticket size={34} />
                <span>{order.ticketId === "vip" ? "VIP" : "GENERAL"}</span>
              </div>
              <div className="order-card-content">
                <span className="order-reference">{order.id}</span>
                <h2>{order.event?.title || "Your event"}</h2>
                <p>
                  <CalendarDays size={15} />
                  {order.event ? eventDate(order.event.date) : ""} ·{" "}
                  {order.quantity} ticket{order.quantity === 1 ? "" : "s"}
                </p>
                <span
                  className={`badge ${order.status === "Paid" ? "positive" : "pending"}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-card-payment">
                <small>
                  {order.balance ? "Remaining balance" : "Paid in full"}
                </small>
                <strong>{ugx(order.balance || order.total)}</strong>
                <a className="button secondary" href={`#/booking/${order.id}`}>
                  {order.status === "Paid"
                    ? "View ticket"
                    : order.status === "Expired"
                      ? "View booking"
                      : "Manage payment"}
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
