import { useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAccount } from "../lib/account-context.js";
import { go, safeNext } from "../lib/navigation.js";

export default function AuthPage({
  signup = false,
  next = "/my-tickets",
  reason,
}) {
  const auth = useAccount();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const target = safeNext(next);
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (signup && form.password !== form.confirm) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const user = await (signup ? auth.register(form) : auth.login(form));
      go(
        target === "/my-tickets" && user.role !== "customer"
          ? `/${user.role === "admin" ? "admin" : "organiser"}/overview`
          : target,
      );
    } catch (value) {
      setError(value.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={`auth-layout auth-photo-layout ${signup ? "auth-signup" : "auth-signin"}`}>
      <div className="auth-story">
        <span className="eyebrow">YOUR NEXT GOOD TIME STARTS HERE</span>
        <h1>
          Good plans.
          <br />
          Great people.
          <br />
          <em>Your Parre.</em>
        </h1>
        <p>
          One account for every booking, every instalment and every
          unforgettable moment.
        </p>
        <span className="auth-assurance">
          <ShieldCheck size={17} />
          Your tickets, all in one place.
        </span>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form-inner">
        <span className="eyebrow">
          {signup ? "JOIN THE CROWD" : "WELCOME BACK"}
        </span>
        <h2>{signup ? "Make it your Parre." : "Good to see you again."}</h2>
        <p>
          {reason ||
            (signup
              ? "Create an account to book tickets and track your payments."
              : "Sign in to pick up where you left off.")}
        </p>
        <form onSubmit={submit} className="shop-form">
          {signup && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={160}
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span id="account-password-label">Password</span>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                aria-labelledby="account-password-label"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 12 : undefined}
                maxLength={128}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={
                  signup ? "At least 12 characters" : "Your password"
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {signup && (
            <label>
              Confirm password
              <input
                type="password"
                name="confirm"
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Enter your password again"
              />
            </label>
          )}
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create your account" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {signup ? "Already part of the crowd?" : "New to Parre.ug?"}{" "}
          <a
            href={`#/${signup ? "login" : "signup"}?next=${encodeURIComponent(target)}`}
          >
            {signup ? "Sign in" : "Create an account"}
          </a>
        </p>
        </div>
      </div>
    </section>
  );
}
