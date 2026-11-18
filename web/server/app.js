import http from "node:http";
import {
  randomBytes,
  randomUUID,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { dirname } from "node:path";
import { initialData } from "../src/data/demo.js";
import { validateEvent } from "../src/lib/events.js";

// A local-only development API. The team's production backend replaces this module.
const sessionLifetime = 8 * 60 * 60 * 1000;
const cookieName = "parre_session";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const passwordHash = (password, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
const checkPassword = (password, stored) => {
  const [salt, expected] = stored.split(":");
  const actual = passwordHash(password, salt).split(":")[1];
  return timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(expected, "hex"),
  );
};
const publicUser = ({ id, name, email, role, active }) => ({
  id,
  name,
  email,
  role,
  active,
});
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
const text = (value) => (typeof value === "string" ? value.trim() : "");
const emailAddress = (value) => text(value).toLowerCase();
const orderStatus = (order) =>
  order.status === "Expired"
    ? "Expired"
    : order.paid >= order.total
      ? "Paid"
      : order.paid > 0
        ? "Part paid"
        : "Awaiting payment";
const gateway = {
  name: "Thewton Pay",
  mode: "local_test",
  connected: false,
  message:
    "Gateway activation and API credentials are pending. Test payments do not move money.",
};

function seedData() {
  const data = structuredClone(initialData);
  data.events = data.events.map((event) => ({
    ...event,
    organiserId: "organiser-1",
    description:
      "A night for good music, great company and unforgettable moments. Choose your ticket, bring your people and make it a Parre.",
    category: event.id === "evt-2" ? "Social" : "Music",
  }));
  data.events.push({
    id: "evt-4",
    title: "Riverside Sessions",
    venue: "Riverside Park, Jinja",
    date: "2026-12-27",
    status: "Published",
    organiserId: "organiser-2",
    category: "Music",
    theme: "purple",
    description:
      "Slow afternoons, live sessions and a crowd that feels like home. Join us by the river for the perfect December escape.",
    tickets: [
      { id: "general", name: "General", price: 35000, capacity: 200 },
      { id: "vip", name: "VIP", price: 85000, capacity: 40 },
    ],
  });
  data.users = [
    {
      id: "admin-1",
      name: "Parre Team",
      email: "admin@parre.test",
      role: "admin",
      passwordHash: passwordHash("ParreAdmin!2026"),
      active: true,
    },
    {
      id: "organiser-1",
      name: "Kampala Events",
      email: "organiser@parre.test",
      role: "organiser",
      passwordHash: passwordHash("ParreOrganiser!2026"),
      active: true,
    },
    {
      id: "organiser-2",
      name: "Riverside Collective",
      email: "riverside@parre.test",
      role: "organiser",
      passwordHash: passwordHash("ParreRiverside!2026"),
      active: true,
    },
    {
      id: "customer-1",
      name: "Alex",
      email: "alex@parre.test",
      role: "customer",
      passwordHash: passwordHash("ParreCustomer!2026"),
      active: true,
    },
  ];
  data.bookings = data.bookings.map((booking, index) => ({
    ...booking,
    userId: "seed-guest-" + index,
    status: orderStatus(booking),
    createdAt: "2026-11-17T12:00:00Z",
    expiresAt: null,
    payments: [],
    support: [],
  }));
  data.sessions = [];
  return data;
}

export function createApi({ dataFile } = {}) {
  let state =
    dataFile && existsSync(dataFile)
      ? JSON.parse(readFileSync(dataFile, "utf8"))
      : seedData();
  const persist = (value) => {
    if (!dataFile) return;
    mkdirSync(dirname(dataFile), { recursive: true, mode: 0o700 });
    const temporary = dataFile + ".tmp";
    writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
    renameSync(temporary, dataFile);
  };
  const transaction = (mutate) => {
    const next = structuredClone(state);
    const result = mutate(next);
    persist(next);
    state = next;
    return result;
  };
  persist(state);
  const rateLimits = new Map();
  const limit = (key) => {
    const now = Date.now();
    for (const [entry, value] of rateLimits)
      if (value.until < now) rateLimits.delete(entry);
    const entry = rateLimits.get(key) ?? {
      count: 0,
      until: now + 5 * 60 * 1000,
    };
    entry.count++;
    rateLimits.set(key, entry);
    if (entry.count > 25)
      fail(429, "Too many attempts. Please wait a few minutes.");
  };
  const sessionFor = (req) => {
    const token = (req.headers.cookie ?? "")
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1);
    const session =
      token &&
      state.sessions.find(
        (item) => item.hash === digest(token) && item.expiresAt > Date.now(),
      );
    const user =
      session &&
      state.users.find((item) => item.id === session.userId && item.active);
    return user ? { session, user } : { session: null, user: null };
  };
  const requireUser = (auth, roles) => {
    if (!auth.user) fail(401, "Sign in to continue.");
    if (roles && !roles.includes(auth.user.role))
      fail(403, "Your account does not have access to this area.");
    return auth.user;
  };
  const reservationActive = (order) =>
    order.status !== "Expired" &&
    (!order.expiresAt || order.expiresAt > Date.now());
  const publicEvent = (event) => ({
    ...event,
    tickets: event.tickets.map((ticket) => ({
      ...ticket,
      available: Math.max(
        0,
        ticket.capacity -
          state.bookings
            .filter(
              (order) =>
                order.eventId === event.id &&
                order.ticketId === ticket.id &&
                reservationActive(order),
            )
            .reduce((sum, order) => sum + order.quantity, 0),
      ),
    })),
  });
  const ownerActive = (event) =>
    state.users.some((user) => user.id === event.organiserId && user.active);
  const customerOrder = (order) => ({
    ...order,
    status:
      order.expiresAt && order.expiresAt < Date.now() && !order.paid
        ? "Expired"
        : orderStatus(order),
    event: state.events.find((event) => event.id === order.eventId),
    balance: order.total - order.paid,
    ticketCode: order.paid >= order.total ? order.ticketCode : null,
  });
  const sessionResponse = (user, res) => {
    const token = randomBytes(32).toString("hex");
    const session = {
      userId: user.id,
      hash: digest(token),
      csrf: randomBytes(24).toString("hex"),
      expiresAt: Date.now() + sessionLifetime,
    };
    transaction((data) => {
      data.sessions = data.sessions.filter(
        (item) => item.expiresAt > Date.now(),
      );
      data.sessions.push(session);
    });
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionLifetime / 1000}`,
    );
    return { user: publicUser(user), csrfToken: session.csrf, gateway };
  };
  const body = async (req) => {
    if (
      !String(req.headers["content-type"] ?? "").startsWith("application/json")
    )
      fail(415, "Send a JSON request.");
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 24000) fail(413, "This request is too large.");
      chunks.push(chunk);
    }
    try {
      const value = JSON.parse(Buffer.concat(chunks).toString());
      if (!value || typeof value !== "object" || Array.isArray(value))
        fail(400, "Invalid request.");
      return value;
    } catch {
      fail(400, "Invalid JSON request.");
    }
  };

  return http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const respond = (value, status = 200) => {
      res.statusCode = status;
      res.end(JSON.stringify(value));
    };
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      const method = req.method;
      const auth = sessionFor(req);
      if (!["GET", "HEAD"].includes(method)) {
        const origin = req.headers.origin;
        if (
          (origin && new URL(origin).host !== req.headers.host) ||
          req.headers["sec-fetch-site"] === "cross-site"
        )
          fail(403, "This request origin is not allowed.");
        if (
          auth.user &&
          !["/api/auth/login", "/api/auth/register"].includes(path) &&
          req.headers["x-parre-csrf"] !== auth.session.csrf
        )
          fail(403, "Your session needs refreshing. Reload and try again.");
      }
      if (path === "/api/health" && method === "GET")
        return respond({ ok: true, mode: "local_development" });
      if (path === "/api/session" && method === "GET")
        return respond({
          user: auth.user ? publicUser(auth.user) : null,
          csrfToken: auth.session?.csrf ?? null,
          gateway,
        });
      if (path === "/api/auth/register" && method === "POST") {
        limit("register:" + req.socket.remoteAddress);
        const input = await body(req);
        const name = text(input.name),
          email = emailAddress(input.email),
          password = input.password;
        if (
          name.length < 2 ||
          name.length > 80 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          email.length > 160
        )
          fail(422, "Enter your name and a valid email address.");
        if (
          typeof password !== "string" ||
          password.length < 12 ||
          password.length > 128
        )
          fail(422, "Use a password of 12–128 characters.");
        if (state.users.some((user) => user.email === email))
          fail(409, "An account already uses this email. Please sign in.");
        const user = {
          id: randomUUID(),
          name,
          email,
          passwordHash: passwordHash(password),
          role: "customer",
          active: true,
        };
        transaction((data) => data.users.push(user));
        return respond(sessionResponse(user, res), 201);
      }
      if (path === "/api/auth/login" && method === "POST") {
        limit("login:" + req.socket.remoteAddress);
        const input = await body(req);
        const user = state.users.find(
          (item) => item.email === emailAddress(input.email),
        );
        if (typeof input.password !== "string" || input.password.length > 128)
          fail(401, "Email or password is incorrect.");
        const dummyHash = state.users[0].passwordHash;
        const valid = checkPassword(
          input.password,
          user?.passwordHash ?? dummyHash,
        );
        if (!user || !valid || !user.active)
          fail(401, "Email or password is incorrect.");
        return respond(sessionResponse(user, res));
      }
      if (path === "/api/auth/logout" && method === "POST") {
        if (auth.session)
          transaction((data) => {
            data.sessions = data.sessions.filter(
              (item) => item.hash !== auth.session.hash,
            );
          });
        res.setHeader(
          "Set-Cookie",
          `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
        );
        return respond({ ok: true });
      }
      if (["/api/events", "/api/local-events"].includes(path) && method === "GET")
        return respond({
          events: state.events
            .filter(
              (event) => event.status === "Published" && ownerActive(event),
            )
            .map(publicEvent),
        });
      if (path === "/api/manage" && method === "GET") {
        const user = requireUser(auth, ["admin", "organiser"]);
        const events = state.events.filter(
          (event) => user.role === "admin" || event.organiserId === user.id,
        );
        const eventIds = new Set(events.map((event) => event.id));
        return respond({
          events,
          bookings: state.bookings
            .filter(
              (order) =>
                eventIds.has(order.eventId) && reservationActive(order),
            )
            .map(customerOrder),
          gateway,
        });
      }
      if (
        path.startsWith("/api/manage/events") &&
        ["POST", "PUT"].includes(method)
      ) {
        const user = requireUser(auth, ["admin", "organiser"]);
        const input = await body(req);
        const id = method === "PUT" ? path.split("/").at(-1) : randomUUID();
        const existing = state.events.find((event) => event.id === id);
        if (method === "PUT" && !existing) fail(404, "Event not found.");
        if (
          existing &&
          user.role !== "admin" &&
          existing.organiserId !== user.id
        )
          fail(403, "You can only manage your own events.");
        const organiserId =
          existing?.organiserId ??
          (user.role === "organiser" ? user.id : "organiser-1");
        const event = {
          id,
          title: text(input.title),
          venue: text(input.venue),
          date: text(input.date),
          status: input.status,
          tickets: input.tickets,
          theme: ["orange", "green", "purple"].includes(input.theme)
            ? input.theme
            : "orange",
          organiserId,
          description: text(input.description ?? existing?.description).slice(
            0,
            1500,
          ),
          category: text(input.category ?? existing?.category) || "Music",
        };
        const errors = validateEvent(
          event,
          state.bookings.filter(reservationActive),
        );
        if (Object.keys(errors).length) fail(422, Object.values(errors)[0]);
        transaction((data) => {
          if (existing)
            data.events = data.events.map((item) =>
              item.id === id ? event : item,
            );
          else data.events.push(event);
        });
        return respond({ event }, existing ? 200 : 201);
      }
      if (path === "/api/admin/users" && method === "GET") {
        requireUser(auth, ["admin"]);
        return respond({ users: state.users.map(publicUser) });
      }
      if (path.startsWith("/api/admin/users/") && method === "PATCH") {
        const user = requireUser(auth, ["admin"]);
        const input = await body(req),
          id = path.split("/").at(-1);
        if (id === user.id)
          fail(422, "You cannot suspend your own admin account.");
        if (
          !state.users.some((item) => item.id === id) ||
          typeof input.active !== "boolean"
        )
          fail(422, "Choose a valid account status.");
        transaction((data) => {
          data.users = data.users.map((item) =>
            item.id === id ? { ...item, active: input.active } : item,
          );
          if (!input.active)
            data.sessions = data.sessions.filter((item) => item.userId !== id);
        });
        return respond({ users: state.users.map(publicUser) });
      }
      if (path === "/api/orders" && method === "GET") {
        const user = requireUser(auth);
        return respond({
          orders: state.bookings
            .filter((order) => order.userId === user.id)
            .map(customerOrder),
        });
      }
      if (path === "/api/orders" && method === "POST") {
        const user = requireUser(auth),
          input = await body(req);
        const event = state.events.find(
          (item) =>
            item.id === input.eventId &&
            item.status === "Published" &&
            ownerActive(item),
        );
        const ticket = event?.tickets.find(
          (item) => item.id === input.ticketId,
        );
        if (!event || !ticket) fail(404, "This ticket is no longer available.");
        if (
          !Number.isInteger(input.quantity) ||
          input.quantity < 1 ||
          input.quantity > 8
        )
          fail(422, "Choose between 1 and 8 tickets.");
        if (!["full", "instalments"].includes(input.plan))
          fail(422, "Choose a valid payment plan.");
        if (
          typeof input.requestKey !== "string" ||
          !/^[\w-]{16,80}$/.test(input.requestKey)
        )
          fail(422, "Refresh checkout and try again.");
        const previous = state.bookings.find(
          (order) =>
            order.userId === user.id && order.requestKey === input.requestKey,
        );
        if (previous) {
          if (
            previous.eventId !== event.id ||
            previous.quantity !== input.quantity ||
            previous.ticketId !== input.ticketId ||
            previous.plan !== input.plan
          )
            fail(409, "This checkout was already used. Start a new booking.");
          return respond({ order: customerOrder(previous) });
        }
        const available = publicEvent(event).tickets.find(
          (item) => item.id === ticket.id,
        ).available;
        if (input.quantity > available)
          fail(
            409,
            "There are not enough tickets left. Choose a smaller quantity.",
          );
        const total = ticket.price * input.quantity;
        if (!Number.isSafeInteger(total))
          fail(422, "This ticket total is too large. Please contact the event team.");
        const order = {
          id: "PAR-" + randomBytes(4).toString("hex").toUpperCase(),
          eventId: event.id,
          userId: user.id,
          customer: user.name,
          ticketId: ticket.id,
          quantity: input.quantity,
          unitPrice: ticket.price,
          total,
          paid: 0,
          plan: input.plan,
          method: input.plan === "full" ? "Full payment" : "Instalments",
          status: "Awaiting payment",
          requestKey: input.requestKey,
          createdAt: new Date().toISOString(),
          expiresAt: Date.now() + 15 * 60 * 1000,
          payments: [],
          support: [],
        };
        transaction((data) => data.bookings.unshift(order));
        return respond({ order: customerOrder(order) }, 201);
      }
      const orderMatch = path.match(
        /^\/api\/orders\/([^/]+)(?:\/(pay|support))?$/,
      );
      if (orderMatch) {
        const user = requireUser(auth),
          order = state.bookings.find(
            (item) => item.id === orderMatch[1] && item.userId === user.id,
          );
        if (!order) fail(404, "Booking not found.");
        if (!orderMatch[2] && method === "GET")
          return respond({ order: customerOrder(order) });
        if (orderMatch[2] === "pay" && method === "POST") {
          const input = await body(req);
          if (
            !["mobile_money", "card"].includes(input.method) ||
            !["success", "failed"].includes(input.outcome)
          )
            fail(422, "Choose a valid test payment.");
          if (
            typeof input.requestKey !== "string" ||
            !/^[\w-]{16,80}$/.test(input.requestKey)
          )
            fail(422, "Refresh checkout and try again.");
          const previous = order.payments.find(
            (payment) => payment.requestKey === input.requestKey,
          );
          if (previous)
            return respond({
              order: customerOrder(order),
              payment: previous,
              gateway,
            });
          if (!reservationActive(order))
            fail(
              409,
              "Your ticket reservation has expired. Please book again.",
            );
          if (order.paid >= order.total)
            fail(409, "This booking is already fully paid.");
          const phone = text(input.phone).replace(/[\s()-]/g, "");
          if (
            input.method === "mobile_money" &&
            !/^(?:0|\+?256)7\d{8}$/.test(phone)
          )
            fail(422, "Enter a valid Ugandan Mobile Money number.");
          if (
            input.method === "card" &&
            ["cardNumber", "cvv", "expiry"].some((key) => key in input)
          )
            fail(
              422,
              "Card details belong in the payment provider’s secure form.",
            );
          const balance = order.total - order.paid;
          const amount =
            order.plan === "instalments" && input.portion !== "balance"
              ? Math.min(Math.ceil(order.total / 4), balance)
              : balance;
          const payment = {
            id: randomUUID(),
            requestKey: input.requestKey,
            amount,
            method: input.method,
            phoneLast4:
              input.method === "mobile_money" ? phone.slice(-4) : undefined,
            status: input.outcome === "success" ? "Succeeded" : "Failed",
            createdAt: new Date().toISOString(),
            mode: "local_test",
          };
          const updated = transaction((data) => {
            const current = data.bookings.find((item) => item.id === order.id);
            current.payments.push(payment);
            if (payment.status === "Succeeded") {
              current.paid += amount;
              current.expiresAt = null;
              if (current.paid >= current.total)
                current.ticketCode =
                  "TEST-" + randomBytes(12).toString("hex").toUpperCase();
            }
            current.status = orderStatus(current);
            return current;
          });
          return respond({ order: customerOrder(updated), payment, gateway });
        }
        if (orderMatch[2] === "support" && method === "POST") {
          const input = await body(req),
            message = text(input.message);
          if (message.length < 10 || message.length > 1000)
            fail(422, "Write a message of 10–1,000 characters.");
          const updated = transaction((data) => {
            const current = data.bookings.find((item) => item.id === order.id);
            current.support.push({
              id: randomUUID(),
              message,
              reply: "",
              status: "Open",
              createdAt: new Date().toISOString(),
            });
            return current;
          });
          return respond({ order: customerOrder(updated) }, 201);
        }
      }
      if (path === "/api/manage/support" && method === "GET") {
        const user = requireUser(auth, ["admin", "organiser"]);
        const eventIds = new Set(
          state.events
            .filter(
              (event) => user.role === "admin" || event.organiserId === user.id,
            )
            .map((event) => event.id),
        );
        return respond({
          requests: state.bookings
            .filter((order) => eventIds.has(order.eventId))
            .flatMap((order) =>
              order.support.map((request) => ({
                ...request,
                orderId: order.id,
                customer: order.customer,
                eventTitle: state.events.find(
                  (event) => event.id === order.eventId,
                )?.title,
              })),
            ),
        });
      }
      if (path.startsWith("/api/manage/support/") && method === "PATCH") {
        const user = requireUser(auth, ["admin", "organiser"]),
          id = path.split("/").at(-1),
          input = await body(req);
        const order = state.bookings.find((item) =>
          item.support.some((request) => request.id === id),
        );
        const event =
          order && state.events.find((item) => item.id === order.eventId);
        if (!order || (user.role !== "admin" && event?.organiserId !== user.id))
          fail(404, "Support request not found.");
        const reply = text(input.reply);
        if (reply.length < 5 || reply.length > 1000)
          fail(422, "Write a reply of 5–1,000 characters.");
        transaction((data) => {
          const request = data.bookings
            .find((item) => item.id === order.id)
            .support.find((item) => item.id === id);
          request.reply = reply;
          request.status = "Resolved";
        });
        return respond({ ok: true });
      }
      fail(404, "This page or action was not found.");
    } catch (error) {
      if (!res.writableEnded)
        respond(
          {
            message: error.status
              ? error.message
              : "We could not complete this request. Please try again.",
          },
          error.status ?? 500,
        );
    }
  });
}
