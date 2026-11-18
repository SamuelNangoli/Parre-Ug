import { useEffect, useRef, useState } from "react";
import {
  Smartphone,
  CreditCard,
  ArrowRight,
  LockKeyhole,
  X,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { shop } from "../services/api.js";
import { ugx } from "../lib/events.js";

function PaymentTest({ method, amount, busy, onResult, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      className="payment-dialog"
      ref={dialog}
      aria-labelledby="payment-test-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <button
        type="button"
        className="icon-button dialog-close"
        aria-label="Close payment test"
        onClick={onClose}
        disabled={busy}
      >
        <X size={20} />
      </button>
      <span className="test-mode-label">TEST MODE · NO MONEY MOVES</span>
      <div className="payment-method-icon">
        {method === "card" ? (
          <CreditCard size={30} />
        ) : (
          <Smartphone size={30} />
        )}
      </div>
      <h2 id="payment-test-title">
        {method === "card" ? "Visa payment preview" : "Mobile Money preview"}
      </h2>
      <strong className="payment-test-amount">{ugx(amount)}</strong>
      <p>
        Thewton Pay isn’t connected yet. This test records a payment against
        your sample booking. It won’t charge a card or send a phone prompt.
      </p>
      {method === "card" && (
        <div className="hosted-card-preview">
          <span className="visa-wordmark">VISA</span>
          <span>
            Card details will be entered in
            <br />
            the gateway’s secure payment form.
          </span>
          <LockKeyhole size={20} />
        </div>
      )}
      <button
        className="button primary"
        disabled={busy}
        onClick={() => onResult("success")}
      >
        {busy ? "Recording…" : "Complete test payment"}
        <CheckCircle2 size={17} />
      </button>
      <button
        className="text-button"
        disabled={busy}
        onClick={() => onResult("failed")}
      >
        Simulate a failed payment
      </button>
    </dialog>
  );
}

export default function PaymentPanel({
  amount,
  beforePayment,
  orderId,
  onPaid,
  onOrderChanged,
  portion = "next",
}) {
  const [method, setMethod] = useState("mobile_money"),
    [phone, setPhone] = useState(""),
    [network, setNetwork] = useState("MTN MoMo");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false),
    [activeId, setActiveId] = useState(orderId);
  const requestKey = useRef("");
  async function start(event) {
    event.preventDefault();
    setError("");
    if (
      method === "mobile_money" &&
      !/^(?:0|\+?256)7\d{8}$/.test(phone.replace(/[\s()-]/g, ""))
    ) {
      setError("Enter a valid Ugandan Mobile Money number.");
      return;
    }
    setBusy(true);
    try {
      const id = activeId || (await beforePayment());
      setActiveId(id);
      requestKey.current = crypto.randomUUID();
      setPreview(true);
    } catch (value) {
      setError(value.message);
    } finally {
      setBusy(false);
    }
  }
  async function finish(outcome) {
    setBusy(true);
    setError("");
    try {
      const result = await shop.pay(activeId, {
        method,
        phone: method === "mobile_money" ? phone : undefined,
        network,
        portion,
        outcome,
        requestKey: requestKey.current,
      });
      onOrderChanged?.(result.order);
      setPreview(false);
      if (result.payment.status === "Succeeded") onPaid(result.order);
      else
        setError(
          "The test payment failed. Your balance has not changed. You can try again.",
        );
    } catch (value) {
      setError(value.message);
      setPreview(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="payment-panel">
      <h2>How would you like to pay?</h2>
      <p>Choose Mobile Money or a Visa / Mastercard.</p>
      <div className="payment-methods" aria-label="Payment method">
        <button
          type="button"
          aria-pressed={method === "mobile_money"}
          className={method === "mobile_money" ? "selected" : ""}
          onClick={() => {
            setMethod("mobile_money");
            setError("");
          }}
        >
          <Smartphone size={21} />
          <strong>Mobile Money</strong>
          <span>MTN MoMo · Airtel Money</span>
        </button>
        <button
          type="button"
          aria-pressed={method === "card"}
          className={method === "card" ? "selected" : ""}
          onClick={() => {
            setMethod("card");
            setError("");
          }}
        >
          <CreditCard size={21} />
          <strong>Visa / Mastercard</strong>
          <span>Secure card checkout</span>
        </button>
      </div>
      <form className="shop-form" onSubmit={start}>
        {method === "mobile_money" ? (
          <>
            <label>
              Mobile Money network
              <select
                value={network}
                onChange={(event) => setNetwork(event.target.value)}
              >
                <option>MTN MoMo</option>
                <option>Airtel Money</option>
              </select>
            </label>
            <label>
              Mobile Money number
              <input
                type="tel"
                inputMode="tel"
                autoComplete="off"
                maxLength={20}
                placeholder="0770 000 000"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                aria-describedby="phone-help"
              />
            </label>
            <p className="payment-help" id="phone-help">
              Use a fictitious number while payments are in test mode. Once
              connected, the gateway will prompt this number to approve payment.
            </p>
          </>
        ) : (
          <div className="card-handoff">
            <span className="visa-wordmark">VISA</span>
            <LockKeyhole size={22} />
            <h3>Your card details stay with the payment provider.</h3>
            <p>
              When Thewton Pay is connected, you’ll continue to its secure card
              form. Card numbers and CVVs are never entered or stored in this
              app.
            </p>
          </div>
        )}
        <div className="payment-test-notice">
          <CircleAlert size={18} />
          <span>
            <strong>Payments are in test mode.</strong> Gateway setup is
            pending. No real payment will be made.
          </span>
        </div>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Preparing your booking…" : `Continue · ${ugx(amount)}`}
          <ArrowRight size={18} />
        </button>
        <span className="payment-provider">
          Payment gateway: Thewton Pay · Connection pending
        </span>
      </form>
      {preview && (
        <PaymentTest
          method={method}
          amount={amount}
          busy={busy}
          onResult={finish}
          onClose={() => setPreview(false)}
        />
      )}
    </section>
  );
}
