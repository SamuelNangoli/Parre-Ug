import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  Ticket,
  Wallet,
  Clock3,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Users,
  Headphones,
  LogOut,
} from "lucide-react";
import { organiser } from "./services/organiser.js";
import { eventDate, ugx } from "./lib/events.js";
import EventEditor from "./components/EventEditor.jsx";
import BookingsTable from "./components/BookingsTable.jsx";
import { PeoplePage, SupportPage } from "./pages/ManagementExtras.jsx";
import EventPoster from "./components/EventPoster.jsx";

const baseNavigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "events", label: "My events", icon: CalendarDays },
  { id: "bookings", label: "Bookings & payments", icon: Ticket },
];

function navigationFor(variant) {
  const main = baseNavigation.map((item) =>
    variant === "admin"
      ? {
          ...item,
          label:
            item.id === "events"
              ? "All events"
              : item.id === "bookings"
                ? "Orders & payments"
                : item.label,
        }
      : item,
  );
  return [
    ...main,
    ...(variant === "admin"
      ? [{ id: "people", label: "Accounts & roles", icon: Users }]
      : []),
    { id: "support", label: "Customer support", icon: Headphones },
  ];
}
function readRoute(variant) {
  const route = window.location.hash.split("?")[0].split("/").at(-1);
  return navigationFor(variant).some((item) => item.id === route)
    ? route
    : "overview";
}

function EventCard({ event, bookings, onEdit }) {
  const reserved = bookings
    .filter((booking) => booking.eventId === event.id)
    .reduce((sum, booking) => sum + booking.quantity, 0);
  const capacity = event.tickets.reduce(
    (sum, ticket) => sum + ticket.capacity,
    0,
  );
  return (
    <article className="event-card">
      <EventPoster event={event} />
      <div className="event-body">
        <div className="event-meta">
          <span>{eventDate(event.date)}</span>
          <span
            className={`badge ${event.status === "Published" ? "positive" : "neutral"}`}
          >
            {event.status}
          </span>
        </div>
        <h3>{event.title}</h3>
        <p className="venue">
          <MapPin size={14} />
          {event.venue}
        </p>
        <div className="event-sales">
          <span>
            <strong>{reserved}</strong> / {capacity} tickets booked
          </span>
          <span>
            From {ugx(Math.min(...event.tickets.map((ticket) => ticket.price)))}
          </span>
        </div>
        <button className="event-link" onClick={() => onEdit(event)}>
          Manage event
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}

export default function ManagementApp({
  variant = "organiser",
  user,
  onLogout,
}) {
  const navigation = navigationFor(variant);
  const [page, setPage] = useState(() => readRoute(variant));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    const onRouteChange = () => {
      if (!window.location.hash.startsWith("#/")) return;
      setPage(readRoute(variant));
      setQuery("");
      setFilter("All");
      setMenuOpen(false);
    };
    window.addEventListener("hashchange", onRouteChange);
    return () => window.removeEventListener("hashchange", onRouteChange);
  }, []);
  useEffect(() => {
    document.title = `${navigation.find((item) => item.id === page).label} | Parre.ug`;
  }, [page]);
  useEffect(() => {
    let active = true;
    organiser
      .load()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn’t open your workspace. Please reload the app and try again.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  function navigate(next) {
    window.location.hash = `/${variant}/${next}`;
    setPage(next);
    setQuery("");
    setFilter("All");
    setMenuOpen(false);
    setTimeout(() => heading.current?.focus(), 0);
  }
  async function saveEvent(event) {
    const updated = await organiser.saveEvent(event);
    setData(updated);
    setEditor(null);
    setNotice(
      event.id
        ? "Event changes saved."
        : "Your event is ready. Let’s make it happen.",
    );
  }
  async function reset() {
    try {
      setData(await organiser.load());
      setError("");
    } catch {
      setError(
        "Your browser is blocking storage. Enable site storage, then reload this page.",
      );
    }
  }
  const events = data?.events ?? [];
  const bookings = data?.bookings ?? [];
  const collected = bookings.reduce((sum, booking) => sum + booking.paid, 0);
  const balance = bookings.reduce(
    (sum, booking) => sum + booking.total - booking.paid,
    0,
  );
  const tickets = bookings.reduce((sum, booking) => sum + booking.quantity, 0);
  const visibleEvents = events.filter(
    (event) =>
      (filter === "All" || event.status === filter) &&
      `${event.title} ${event.venue}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visibleBookings = bookings.filter((booking) =>
    `${booking.id} ${booking.customer} ${events.find((event) => event.id === booking.eventId)?.title}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const titles = {
    overview: [
      "Your next big thing starts here.",
      "A little planning. A lot of good times.",
    ],
    events: [
      "Good times, in the making.",
      "Create, publish and fine-tune your events.",
    ],
    bookings: [
      "Every booking tells a story.",
      "Keep an eye on ticket bookings and instalment balances.",
    ],
  };
  titles.people = [
    "The people behind the Parre.",
    "Manage customer, organiser and administrator account access.",
  ];
  titles.support = [
    "A little help goes a long way.",
    "Respond to booking questions and follow up with your customers.",
  ];
  if (variant === "admin") {
    titles.overview = [
      "The whole Parre, in one place.",
      "Oversee events, accounts, ticket orders and payment activity.",
    ];
    titles.events = [
      "Every event. One workspace.",
      "Manage ticket details and publication across the platform.",
    ];
    titles.bookings = [
      "Every booking, accounted for.",
      "Review platform-wide orders and test payment balances.",
    ];
  }
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside
        className={`sidebar ${menuOpen ? "open" : ""}`}
        aria-label="Workspace navigation"
      >
        <a
          href={`#/${variant}/overview`}
          className="brand"
          aria-label="Parre.ug overview"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
        >
          <img
            src="/brand/parre-logo.png"
            width="1272"
            height="576"
            alt="Parre.ug"
          />
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">
            <img src="/brand/parre-mark.png" alt="" />
          </span>
          <div>
            <strong>
              {variant === "admin" ? "Admin workspace" : "Organiser workspace"}
            </strong>
            <small>
              {variant === "admin"
                ? "Platform management"
                : "Events & ticketing"}
            </small>
          </div>
        </div>
        <span className="nav-label">YOUR WORKSPACE</span>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={page === id ? "page" : undefined}
              className={page === id ? "nav-item active" : "nav-item"}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {page === id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={22} />
          <strong>Big plans. Easy payments.</strong>
          <p>
            Give your audience more time to pay, and more reasons to show up.
          </p>
        </div>
        <div className="sidebar-bottom">
          <span className="brand-dot" />
          <span>Book now. Pay gradually.</span>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="menu-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <a
              className="mobile-brand"
              href={`#/${variant}/overview`}
              aria-label="Parre.ug overview"
              onClick={(event) => {
                event.preventDefault();
                navigate("overview");
              }}
            >
              <img
                src="/brand/parre-logo.png"
                alt="Parre.ug"
                width="1272"
                height="576"
              />
            </a>
            <div className="breadcrumb-trail">
              <span>Workspace</span>
              <span>/</span>
              <strong>
                {navigation.find((item) => item.id === page).label}
              </strong>
            </div>
          </div>
          <div className="profile">
            <a className="text-button browse-events-link" href="#/">
              Browse events
              <ArrowUpRight size={15} />
            </a>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={onLogout}
            >
              <LogOut size={18} />
            </button>
            <span className="profile-avatar" aria-hidden="true">
              <img src="/brand/parre-mark.png" alt="" />
            </span>
            <span className="profile-name">
              {user.name}
              <small>
                {variant === "admin" ? "Platform admin" : "Event organiser"}
              </small>
            </span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">LET’S MAKE SOME MEMORIES</span>
              <h1 tabIndex="-1" ref={heading}>
                {titles[page][0]}
              </h1>
              <p>{titles[page][1]}</p>
            </div>
            {!["people", "support"].includes(page) && (
              <button
                className="button primary"
                onClick={() => setEditor({ event: null })}
                disabled={!data}
              >
                <Plus size={18} />
                Create event
              </button>
            )}
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {notice}
          </div>
          {notice && (
            <div className="save-notice">
              <span>{notice}</span>
              <button
                className="icon-button"
                aria-label="Dismiss saved message"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error ? (
            <section className="panel error-panel" role="alert">
              <h2>Let’s get you back in.</h2>
              <p>{error}</p>
              <button className="button secondary" onClick={reset}>
                Try again
              </button>
            </section>
          ) : !data ? (
            <div className="panel loading" role="status">
              Loading your workspace…
            </div>
          ) : (
            <>
              {page === "people" && <PeoplePage currentUser={user} />}
              {page === "support" && <SupportPage />}
              {page === "overview" && (
                <>
                  <section className="stats" aria-label="Workspace totals">
                    {[
                      [
                        "Collected payments",
                        ugx(collected),
                        `${bookings.filter((booking) => booking.paid === booking.total).length} fully paid bookings`,
                        Wallet,
                        "orange-tint",
                      ],
                      [
                        "Tickets booked",
                        String(tickets).padStart(2, "0"),
                        `Across ${bookings.length} bookings`,
                        Ticket,
                        "neutral-tint",
                      ],
                      [
                        "Outstanding balance",
                        ugx(balance),
                        "Across unpaid and part-paid bookings",
                        Clock3,
                        "neutral-tint",
                      ],
                      [
                        "Published events",
                        String(
                          events.filter((event) => event.status === "Published")
                            .length,
                        ).padStart(2, "0"),
                        `${events.filter((event) => event.status === "Draft").length} draft event(s) in the making`,
                        CalendarDays,
                        "neutral-tint",
                      ],
                    ].map(([label, value, detail, Icon, tint]) => (
                      <article className="stat" key={label}>
                        <div className="stat-top">
                          <span>{label}</span>
                          <span className={`stat-icon ${tint}`}>
                            <Icon size={18} />
                          </span>
                        </div>
                        <strong className="stat-value">{value}</strong>
                        <span className="stat-detail">{detail}</span>
                      </article>
                    ))}
                  </section>
                  <section className="feature-strip">
                    <div className="feature-icon">
                      <ArrowUpRight size={29} />
                    </div>
                    <div>
                      <span className="eyebrow">BOOK NOW. PAY GRADUALLY.</span>
                      <h2>More flexibility. More people in the crowd.</h2>
                      <p>
                        Track every instalment and keep your next event moving.
                      </p>
                    </div>
                    <button
                      className="button dark"
                      onClick={() => navigate("bookings")}
                    >
                      View payments
                      <ArrowRight size={17} />
                    </button>
                    <span className="strip-orbit" aria-hidden="true" />
                  </section>
                </>
              )}
              {(page === "overview" || page === "events") && (
                <section aria-labelledby="events-heading">
                  <div className="section-heading">
                    <div>
                      <h2 id="events-heading">
                        {page === "overview" ? "Your events" : "All events"}
                        <span className="count">{events.length}</span>
                      </h2>
                      <p>From the first idea to the final encore.</p>
                    </div>
                    {page === "overview" && (
                      <button
                        className="text-button"
                        onClick={() => navigate("events")}
                      >
                        View all events
                        <ArrowUpRight size={17} />
                      </button>
                    )}
                  </div>
                  {page === "events" && (
                    <div className="toolbar">
                      <div
                        className="filters"
                        aria-label="Filter events by status"
                      >
                        {["All", "Published", "Draft"].map((status) => (
                          <button
                            key={status}
                            aria-pressed={filter === status}
                            className={filter === status ? "selected" : ""}
                            onClick={() => setFilter(status)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                      <label className="search">
                        <Search size={17} />
                        <span className="sr-only">Search events</span>
                        <input
                          placeholder="Search events or venue"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  <div className="event-grid">
                    {(page === "overview"
                      ? events.slice(0, 3)
                      : visibleEvents
                    ).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        bookings={bookings}
                        onEdit={(value) => setEditor({ event: value })}
                      />
                    ))}
                  </div>
                  {page === "events" && !visibleEvents.length && (
                    <div className="panel empty">
                      No events found. Try a different search or create your
                      first event.
                    </div>
                  )}
                </section>
              )}
              {(page === "overview" || page === "bookings") && (
                <section
                  className="bookings-section"
                  aria-labelledby="bookings-heading"
                >
                  <div className="section-heading">
                    <div>
                      <h2 id="bookings-heading">
                        {page === "overview"
                          ? "Recent bookings"
                          : "Bookings & payments"}
                      </h2>
                      <p>Every step closer to a great night out.</p>
                    </div>
                    {page === "overview" ? (
                      <button
                        className="text-button"
                        onClick={() => navigate("bookings")}
                      >
                        All bookings
                        <ArrowUpRight size={17} />
                      </button>
                    ) : (
                      <label className="search">
                        <Search size={17} />
                        <span className="sr-only">Search bookings</span>
                        <input
                          placeholder="Search booking, guest or event"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                  <div className="panel">
                    <BookingsTable
                      events={events}
                      bookings={
                        page === "overview"
                          ? bookings.slice(0, 4)
                          : visibleBookings
                      }
                    />
                    <div className="table-foot">
                      <ArrowDownLeft size={15} />
                      {page === "overview"
                        ? "Your latest bookings"
                        : "Booking and payment activity"}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Parre.ug</span>
            <span>Built for the moments that matter.</span>
          </footer>
        </main>
      </div>
      {editor && (
        <EventEditor
          event={editor.event}
          bookings={bookings}
          onClose={() => setEditor(null)}
          onSave={saveEvent}
        />
      )}
    </div>
  );
}
