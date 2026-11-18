import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  MapPin,
  Search,
  Ticket,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { shop } from "../services/api.js";
import { eventDate, ugx } from "../lib/events.js";
import EventPoster from '../components/EventPoster.jsx';

export default function DiscoverPage() {
  const [events, setEvents] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reload, setReload] = useState(0),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All events");
  useEffect(() => {
    let active = true;
    shop
      .events()
      .then((value) => {
        if (active) {
          setEvents(value.events);
          setNotice([value.feedError, value.localError].filter(Boolean).join(' '));
          setError('');
        }
      })
      .catch((value) => {
        if (active) setError(value.message);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const visible = (events || []).filter(
    (event) =>
      (category === "All events" || event.category === category) &&
      `${event.title} ${event.venue}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="discover-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="brand-dot" />
            GOOD TIMES. YOUR TERMS.
          </span>
          <h1>
            The plans you want.
            <br />
            The time <em>to pay.</em>
          </h1>
          <p>
            Find your next concert, social or weekend escape.
            <br />
            Book your spot. Pay at your pace. Show up for the memories.
          </p>
          <a href="#upcoming-events" className="button accent-button">
            Find your next Parre
            <ArrowUpRight size={19} />
          </a>
          <div className="hero-proof">
            <span>
              <Ticket size={15} />
              All your tickets, one place
            </span>
            <span>
              <CalendarDays size={15} />
              Flexible instalments
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-ticket">
            <span>THE GOOD TIMES CLUB</span>
            <strong>
              YOU’RE
              <br />
              ON THE
              <br />
              <em>LIST.</em>
            </strong>
            <div className="ticket-dots" />
            <div className="hero-ticket-bottom">
              <img src="/brand/parre-mark.png" alt="" />
              <span>
                BOOK NOW.
                <br />
                PAY GRADUALLY.
              </span>
              <ArrowUpRight size={29} />
            </div>
          </div>
          <span className="hero-sticker">
            MORE MEMORIES.
            <br />
            LESS WAITING.
          </span>
        </div>
      </section>
      <section className="discover-events" id="upcoming-events">
        <div className="shop-section-heading">
          <div>
            <span className="eyebrow">OUT THERE, WAITING FOR YOU</span>
            <h2>Find your kind of good time.</h2>
          </div>
          <span>{events?.length ?? "…"} upcoming events</span>
        </div>
        <div className="shop-toolbar">
          <div className="filters" aria-label="Event categories">
            {["All events", "Music", "Social"].map((value) => (
              <button
                key={value}
                aria-pressed={value === category}
                className={value === category ? "selected" : ""}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={18} />
            <span className="sr-only">Search events</span>
            <input
              placeholder="Event name or city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {notice && <div className="event-feed-notice" role="status"><span>{notice}</span><button className="text-button" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
        {error ? (
          <div className="form-alert" role="alert">
            {error}
          </div>
        ) : events === null ? (
          <p className="shop-empty" role="status">
            Finding the good times…
          </p>
        ) : (
          <div className="shop-event-grid">
            {visible.map((event) => (
              <article className="shop-event-card" key={event.id}>
                <a
                  href={`#/event/${event.id}`}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <EventPoster event={event} />
                </a>
                <div className="shop-card-body">
                  <span className="event-category">{event.category}</span>
                  <p className="event-date-line">
                    <CalendarDays size={14} />
                    {eventDate(event.date)}
                  </p>
                  <h3>
                    <a href={`#/event/${event.id}`}>{event.title}</a>
                  </h3>
                  <p className="venue">
                    <MapPin size={14} />
                    {event.venue}
                  </p>
                  <div className="shop-card-bottom">
                    <span>
                      <small>{event.reference ? `Listed on ${event.source}` : event.feed ? 'Tickets announced at' : 'Tickets from'}</small>
                      <strong>
                        {event.reference ? event.priceLabel : ugx(
                          Math.min(
                            ...event.tickets.map((ticket) => ticket.price),
                          ),
                        )}
                      </strong>
                    </span>
                    <a
                      className="round-arrow"
                      href={`#/event/${event.id}`}
                      aria-label={`View ${event.title}`}
                    >
                      <ArrowUpRight size={21} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
            {!visible.length && (
              <p className="shop-empty">
                No events match that search. Try another city or category.
              </p>
            )}
          </div>
        )}
      </section>
      <section className="how-it-works">
        <div>
          <span className="eyebrow">LESS FRICTION. MORE FUN.</span>
          <h2>
            Your next Parre,
            <br />
            in three easy steps.
          </h2>
        </div>
        {[
          [
            "01",
            "Find your people.",
            "Discover the events you want to be part of.",
          ],
          [
            "02",
            "Make it yours.",
            "Choose your ticket and pay in full or instalments.",
          ],
          [
            "03",
            "Show up.",
            "Finish your payments and find your ticket in your account.",
          ],
        ].map(([number, title, description]) => (
          <div className="how-step" key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </section>
    </>
  );
}
