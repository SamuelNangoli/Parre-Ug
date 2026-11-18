import { useEffect } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { AccountProvider } from "./components/AccountProvider.jsx";
import { useAccount } from "./lib/account-context.js";
import PublicShell from "./components/PublicShell.jsx";
import ManagementApp from "./ManagementApp.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import EventPage from "./pages/EventPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import { go, useRoute } from "./lib/navigation.js";

function RoutedApp() {
  const route = useRoute(),
    auth = useAccount();
  const [area, id] = route.parts;
  const management = [
    "admin",
    "organiser",
    "overview",
    "events",
    "bookings",
  ].includes(area);
  const variant = area === "admin" ? "admin" : "organiser";
  const fullRoute =
    route.path + (route.query.toString() ? "?" + route.query.toString() : "");
  useEffect(() => {
    document.title = management
      ? `${variant === "admin" ? "Admin workspace" : "Organiser workspace"} | Parre.ug`
      : ({
          event: "Event details",
          checkout: "Checkout",
          login: "Sign in",
          signup: "Create an account",
          "my-tickets": "My tickets",
          booking: "My booking",
        }[area] || "Good times, your terms") + " | Parre.ug";
  }, [area, management, variant]);
  if (auth.loading)
    return (
      <div className="app-starting" role="status">
        <img src="/brand/parre-logo.png" alt="Parre.ug" />
        <span>Getting the good times ready…</span>
      </div>
    );
  if (auth.error)
    return (
      <PublicShell>
        <div className="shop-empty">
          <h1>We’ll be right with you.</h1>
          <p role="alert">{auth.error}</p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </PublicShell>
    );
  if (management) {
    if (!auth.user)
      return (
        <PublicShell>
          <AuthPage
            next={`/${variant}/${["overview", "events", "bookings"].includes(area) ? area : id || "overview"}`}
            reason={`Sign in with your ${variant === "admin" ? "administrator" : "organiser"} account to open this workspace.`}
          />
        </PublicShell>
      );
    if (
      auth.user.role === "customer" ||
      (variant === "admin" && auth.user.role !== "admin")
    )
      return (
        <PublicShell>
          <div className="shop-empty access-denied">
            <ShieldAlert size={42} />
            <h1>
              This area is for{" "}
              {variant === "admin" ? "administrators" : "event organisers"}.
            </h1>
            <p>
              Your account can still discover events, buy tickets and manage
              your own bookings.
            </p>
            <a className="button primary" href="#/">
              Discover events
              <ArrowRight size={16} />
            </a>
          </div>
        </PublicShell>
      );
    return (
      <ManagementApp
        key={variant}
        variant={variant}
        user={auth.user}
        onLogout={async () => {
          await auth.logout();
          go("/login");
        }}
      />
    );
  }
  const requiresAccount = ["checkout", "my-tickets", "booking"].includes(area);
  let page;
  if (requiresAccount && !auth.user)
    page = (
      <AuthPage
        next={fullRoute}
        reason="Sign in or create an account to complete your booking and keep your tickets together."
      />
    );
  else if (area === "event" && id) page = <EventPage key={id} id={id} />;
  else if (area === "checkout" && id)
    page = <CheckoutPage key={fullRoute} id={id} query={route.query} />;
  else if (area === "my-tickets") page = <MyTicketsPage key={auth.user?.id} />;
  else if (area === "booking" && id)
    page = <BookingPage key={id} id={id} query={route.query} />;
  else if (area === "login" || area === "signup")
    page = (
      <AuthPage
        key={area}
        signup={area === "signup"}
        next={route.query.get("next") || "/my-tickets"}
      />
    );
  else if (!area) page = <DiscoverPage />;
  else
    page = (
      <div className="shop-empty">
        <h1>Looks like this isn’t the right spot.</h1>
        <a className="button primary" href="#/">
          Find your next Parre
        </a>
      </div>
    );
  return <PublicShell>{page}</PublicShell>;
}

export default function App() {
  return (
    <AccountProvider>
      <RoutedApp />
    </AccountProvider>
  );
}
