import { referenceEvents } from '../data/reference-events.js';
import { normaliseBackendEvents } from '../lib/backend-events.js';

let csrfToken = null;

export async function request(path, { method = "GET", data } = {}) {
  let response;
  try {
    response = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "X-Parre-CSRF": csrfToken } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  } catch {
    throw new Error(
      "We couldn’t connect. Please check your connection and try again.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The app service is unavailable. Please try again shortly.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      result.message || "Something went wrong. Please try again.",
    );
    error.status = response.status;
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("parre:session-ended"));
    throw error;
  }
  if ("csrfToken" in result) csrfToken = result.csrfToken;
  return result;
}

export const account = {
  session: () => request("/session"),
  login: (data) => request("/auth/login", { method: "POST", data }),
  register: (data) => request("/auth/register", { method: "POST", data }),
  logout: () => request("/auth/logout", { method: "POST", data: {} }),
};
export const shop = {
  async events() {
    const [feed, local] = await Promise.allSettled([
      request('/events').then(normaliseBackendEvents),
      request('/local-events'),
    ]);
    return {
      events: [
        ...(feed.status === 'fulfilled' ? feed.value : []),
        ...(local.status === 'fulfilled' ? local.value.events : []),
        ...referenceEvents,
      ],
      feedError: feed.status === 'rejected'
        ? 'Some events are temporarily unavailable. Please try again shortly.' : '',
      localError: local.status === 'rejected'
        ? 'Parre bookings are temporarily unavailable. Please try again shortly.' : '',
    };
  },
  orders: () => request("/orders"),
  order: (id) => request("/orders/" + encodeURIComponent(id)),
  book: (data) => request("/orders", { method: "POST", data }),
  pay: (id, data) =>
    request(`/orders/${encodeURIComponent(id)}/pay`, { method: "POST", data }),
  support: (id, message) =>
    request(`/orders/${encodeURIComponent(id)}/support`, {
      method: "POST",
      data: { message },
    }),
};
