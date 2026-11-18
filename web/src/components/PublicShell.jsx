import { ArrowUpRight, LogOut, Ticket } from "lucide-react";
import { useAccount } from "../lib/account-context.js";
import { go } from "../lib/navigation.js";

export default function PublicShell({ children }) {
  const { user, logout } = useAccount();
  return (
    <div className="customer-app">
      <a className="skip-link" href="#customer-main">
        Skip to content
      </a>
      <header className="shop-header">
        <a className="shop-logo" href="#/" aria-label="Parre.ug home">
          <img src="/brand/parre-logo.png" alt="Parre.ug" />
        </a>
        <nav aria-label="Customer navigation">
          <a href="#/">Discover events</a>
          <a href="#/my-tickets">
            <Ticket size={17} />
            My tickets
          </a>
        </nav>
        <div className="shop-account">
          {user ? (
            <>
              <span className="shop-greeting">
                Hi, {user.name.split(" ")[0]}
              </span>
              {user.role !== "customer" && (
                <a
                  className="button secondary dashboard-link"
                  href={`#/${user.role === "admin" ? "admin" : "organiser"}/overview`}
                >
                  Dashboard
                  <ArrowUpRight size={15} />
                </a>
              )}
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={async () => {
                  await logout();
                  go("/");
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <a className="login-link" href="#/login">
                Sign in
              </a>
              <a className="button primary" href="#/signup">
                Create account
                <ArrowUpRight size={16} />
              </a>
            </>
          )}
        </div>
      </header>
      <main id="customer-main" className="customer-main">
        {children}
      </main>
      <footer className="shop-footer">
        <div>
          <a href="#/" className="footer-logo">
            <img src="/brand/parre-logo.png" alt="Parre.ug home" />
          </a>
          <p>
            Book now. Pay gradually.
            <br />
            Make room for a good time.
          </p>
        </div>
        <div>
          <strong>Your next experience</strong>
          <a href="#/">Discover events</a>
          <a href="#/my-tickets">My tickets & payments</a>
        </div>
        <div>
          <strong>Behind the good times</strong>
          <a href="#/organiser/overview">Organiser portal</a>
          <a href="#/admin/overview">Platform admin</a>
        </div>
        <span className="shop-copyright">
          © {new Date().getFullYear()} Parre.ug · We wanna parre!
        </span>
      </footer>
    </div>
  );
}
