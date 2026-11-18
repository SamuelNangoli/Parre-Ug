import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { createApi } from "./app.js";

async function harness(t, dataFile) {
  const server = createApi({ dataFile });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  function client() {
    let cookie = "",
      csrf = "";
    return {
      cookie: () => cookie,
      async call(
        path,
        { method = "GET", data, csrfCheck = true, requestOrigin = origin } = {},
      ) {
        const response = await fetch(origin + path, {
          method,
          headers: {
            ...(cookie ? { Cookie: cookie } : {}),
            ...(csrf && csrfCheck ? { "X-Parre-CSRF": csrf } : {}),
            ...(data
              ? { "Content-Type": "application/json", Origin: requestOrigin }
              : {}),
          },
          ...(data ? { body: JSON.stringify(data) } : {}),
        });
        const value = await response.json();
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) cookie = setCookie.split(";")[0];
        if (value.csrfToken) csrf = value.csrfToken;
        return { status: response.status, value, headers: response.headers };
      },
    };
  }
  return { server, origin, client };
}

test("accounts, role checks, order integrity, payments and after-sales work together", async (t) => {
  const { client } = await harness(t);
  const anonymous = client(),
    customer = client(),
    other = client(),
    organiser = client(),
    admin = client();
  let orderId, firstPaymentKey;
  await t.test(
    "browsing is public and purchases require an account",
    async () => {
      const events = await anonymous.call("/api/events");
      assert.equal(events.status, 200);
      assert.equal(events.value.events.length, 3);
      assert.ok(
        events.value.events.every((event) => event.status === "Published"),
      );
      assert.equal(
        (await anonymous.call("/api/orders", { method: "POST", data: {} }))
          .status,
        401,
      );
      assert.equal((await anonymous.call("/api/manage")).status, 401);
    },
  );
  await t.test(
    "registration creates only a customer and uses an HttpOnly cookie",
    async () => {
      const result = await customer.call("/api/auth/register", {
        method: "POST",
        data: {
          name: "Test Customer",
          email: "customer@example.test",
          password: "FictitiousPassword!2026",
          role: "admin",
        },
      });
      assert.equal(result.status, 201);
      assert.equal(result.value.user.role, "customer");
      assert.match(result.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
      assert.ok(!JSON.stringify(result.value).includes("passwordHash"));
      assert.equal(
        (await customer.call("/api/session")).value.user.name,
        "Test Customer",
      );
      assert.equal((await customer.call("/api/manage")).status, 403);
      assert.equal((await customer.call("/api/admin/users")).status, 403);
      assert.equal(
        (
          await customer.call("/api/manage/events/evt-1", {
            method: "PUT",
            data: {},
          })
        ).status,
        403,
      );
      await other.call("/api/auth/register", {
        method: "POST",
        data: {
          name: "Other Customer",
          email: "other@example.test",
          password: "AnotherFictitious!2026",
        },
      });
    },
  );
  await t.test("CSRF and foreign origins are rejected", async () => {
    const data = {
      eventId: "evt-1",
      ticketId: "general",
      quantity: 1,
      plan: "full",
      requestKey: randomUUID(),
    };
    assert.equal(
      (
        await customer.call("/api/orders", {
          method: "POST",
          data,
          csrfCheck: false,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await customer.call("/api/orders", {
          method: "POST",
          data,
          requestOrigin: "https://foreign.example",
        })
      ).status,
      403,
    );
  });
  await t.test(
    "server prices orders and deduplicates order creation",
    async () => {
      const data = {
        eventId: "evt-1",
        ticketId: "general",
        quantity: 2,
        plan: "instalments",
        total: 1,
        requestKey: randomUUID(),
      };
      const result = await customer.call("/api/orders", {
        method: "POST",
        data,
      });
      assert.equal(result.status, 201);
      assert.equal(result.value.order.total, 100000);
      assert.equal(result.value.order.ticketCode, null);
      orderId = result.value.order.id;
      const repeat = await customer.call("/api/orders", {
        method: "POST",
        data,
      });
      assert.equal(repeat.value.order.id, orderId);
      assert.equal((await customer.call("/api/orders")).value.orders.length, 1);
      assert.equal(
        (
          await customer.call("/api/orders", {
            method: "POST",
            data: { ...data, requestKey: randomUUID(), quantity: -1 },
          })
        ).status,
        422,
      );
      assert.equal((await other.call("/api/orders/" + orderId)).status, 404);
      assert.equal((await other.call("/api/orders")).value.orders.length, 0);
    },
  );
  await t.test(
    "failed payments leave balances and tickets unchanged",
    async () => {
      const result = await customer.call(`/api/orders/${orderId}/pay`, {
        method: "POST",
        data: {
          method: "mobile_money",
          phone: "0770000000",
          outcome: "failed",
          requestKey: randomUUID(),
          amount: 1,
        },
      });
      assert.equal(result.status, 200);
      assert.equal(result.value.order.paid, 0);
      assert.equal(result.value.order.ticketCode, null);
      assert.equal(result.value.payment.status, "Failed");
      assert.equal(result.value.gateway.mode, "local_test");
      assert.equal(
        (
          await customer.call(`/api/orders/${orderId}/pay`, {
            method: "POST",
            data: {
              method: "mobile_money",
              phone: "bad",
              outcome: "success",
              requestKey: randomUUID(),
            },
          })
        ).status,
        422,
      );
    },
  );
  await t.test(
    "instalments use server amounts and retries do not double-charge",
    async () => {
      firstPaymentKey = randomUUID();
      const data = {
        method: "mobile_money",
        phone: "0770000000",
        outcome: "success",
        requestKey: firstPaymentKey,
        amount: 1,
        portion: "next",
      };
      const result = await customer.call(`/api/orders/${orderId}/pay`, {
        method: "POST",
        data,
      });
      assert.equal(result.value.payment.amount, 25000);
      assert.equal(result.value.order.paid, 25000);
      assert.equal(result.value.order.balance, 75000);
      assert.equal(result.value.order.ticketCode, null);
      const repeat = await customer.call(`/api/orders/${orderId}/pay`, {
        method: "POST",
        data,
      });
      assert.equal(repeat.value.order.paid, 25000);
      assert.equal(
        (
          await other.call(`/api/orders/${orderId}/pay`, {
            method: "POST",
            data,
          })
        ).status,
        404,
      );
    },
  );
  await t.test(
    "card details are rejected and full payment unlocks a test ticket",
    async () => {
      assert.equal(
        (
          await customer.call(`/api/orders/${orderId}/pay`, {
            method: "POST",
            data: {
              method: "card",
              cardNumber: "not-a-real-card",
              outcome: "success",
              requestKey: randomUUID(),
            },
          })
        ).status,
        422,
      );
      const result = await customer.call(`/api/orders/${orderId}/pay`, {
        method: "POST",
        data: {
          method: "card",
          outcome: "success",
          portion: "balance",
          requestKey: randomUUID(),
        },
      });
      assert.equal(result.value.order.paid, 100000);
      assert.equal(result.value.order.balance, 0);
      assert.match(result.value.order.ticketCode, /^TEST-/);
    },
  );
  await t.test("full-payment orders charge the complete saved total in one test payment", async () => {
    const booking = await customer.call('/api/orders', {
      method: 'POST',
      data: { eventId: 'evt-2', ticketId: 'vip', quantity: 2, plan: 'full', requestKey: randomUUID() },
    });
    assert.equal(booking.status, 201);
    assert.equal(booking.value.order.total, 160000);
    const payment = await customer.call(`/api/orders/${booking.value.order.id}/pay`, {
      method: 'POST',
      data: { method: 'card', outcome: 'success', portion: 'next', amount: 1, requestKey: randomUUID() },
    });
    assert.equal(payment.value.payment.amount, 160000);
    assert.equal(payment.value.order.balance, 0);
    assert.equal(payment.value.order.status, 'Paid');
    assert.match(payment.value.order.ticketCode, /^TEST-/);
  });
  await t.test("organisers are limited to their own events", async () => {
    await organiser.call("/api/auth/login", {
      method: "POST",
      data: { email: "organiser@parre.test", password: "ParreOrganiser!2026" },
    });
    const result = await organiser.call("/api/manage");
    assert.equal(result.status, 200);
    assert.equal(result.value.events.length, 3);
    assert.ok(!result.value.events.some((event) => event.id === "evt-4"));
    assert.equal(
      (
        await organiser.call("/api/manage/events/evt-4", {
          method: "PUT",
          data: result.value.events[0],
        })
      ).status,
      403,
    );
    assert.equal((await organiser.call("/api/admin/users")).status, 403);
    const existing = result.value.events.find((event) => event.id === "evt-1");
    assert.equal(
      (
        await organiser.call("/api/manage/events/evt-1", {
          method: "PUT",
          data: {
            ...existing,
            tickets: existing.tickets.map((ticket) => ({
              ...ticket,
              capacity: 1,
            })),
          },
        })
      ).status,
      422,
    );
  });
  await t.test(
    "admin sees the platform without password/session hashes",
    async () => {
      await admin.call("/api/auth/login", {
        method: "POST",
        data: { email: "admin@parre.test", password: "ParreAdmin!2026" },
      });
      const result = await admin.call("/api/manage");
      assert.equal(result.value.events.length, 4);
      const users = await admin.call("/api/admin/users");
      assert.equal(users.value.users.length, 6);
      assert.ok(!JSON.stringify(users.value).includes("passwordHash"));
    },
  );
  await t.test("ticket capacity is enforced across accounts", async () => {
    const create = await admin.call("/api/manage/events", {
      method: "POST",
      data: {
        title: "One Ticket Test",
        venue: "Fictitious Grounds",
        date: "2026-12-28",
        status: "Published",
        theme: "orange",
        tickets: [
          { id: "general", name: "General", price: 10000, capacity: 1 },
          { id: "vip", name: "VIP", price: 20000, capacity: 1 },
        ],
      },
    });
    assert.equal(create.status, 201);
    const data = {
      eventId: create.value.event.id,
      ticketId: "general",
      quantity: 1,
      plan: "full",
      requestKey: randomUUID(),
    };
    assert.equal(
      (await customer.call("/api/orders", { method: "POST", data })).status,
      201,
    );
    assert.equal(
      (
        await other.call("/api/orders", {
          method: "POST",
          data: { ...data, requestKey: randomUUID() },
        })
      ).status,
      409,
    );
  });
  await t.test("after-sales requests and staff replies persist", async () => {
    const create = await customer.call(`/api/orders/${orderId}/support`, {
      method: "POST",
      data: {
        message: "Please confirm the entry requirements for this test booking.",
      },
    });
    assert.equal(create.status, 201);
    const requests = await organiser.call("/api/manage/support");
    assert.equal(requests.value.requests.length, 1);
    await organiser.call(
      "/api/manage/support/" + requests.value.requests[0].id,
      {
        method: "PATCH",
        data: {
          reply:
            "Your sample booking is confirmed. Bring your ticket reference.",
        },
      },
    );
    const result = await customer.call("/api/orders/" + orderId);
    assert.equal(result.value.order.support[0].status, "Resolved");
    assert.match(result.value.order.support[0].reply, /confirmed/);
  });
  await t.test("suspension and logout revoke server sessions", async () => {
    const users = await admin.call("/api/admin/users"),
      user = users.value.users.find(
        (item) => item.email === "customer@example.test",
      );
    await admin.call("/api/admin/users/" + user.id, {
      method: "PATCH",
      data: { active: false },
    });
    assert.equal((await customer.call("/api/orders")).status, 401);
    assert.equal(
      (
        await admin.call("/api/admin/users/admin-1", {
          method: "PATCH",
          data: { active: false },
        })
      ).status,
      422,
    );
    await organiser.call("/api/auth/logout", { method: "POST", data: {} });
    assert.equal((await organiser.call("/api/manage")).status, 401);
  });
});

test("credentials are salted hashes and persisted state reopens without raw session tokens", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "parre-api-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "data.json");
  const first = await harness(t, file),
    user = first.client();
  const password = "StorageCheckFictitious!2026";
  await user.call("/api/auth/register", {
    method: "POST",
    data: { name: "Storage Test", email: "storage@example.test", password },
  });
  const stored = readFileSync(file, "utf8");
  assert.ok(!stored.includes(password));
  assert.ok(!stored.includes(user.cookie().split("=")[1]));
  const second = await harness(t, file),
    other = second.client();
  assert.equal(
    (
      await other.call("/api/auth/login", {
        method: "POST",
        data: { email: "storage@example.test", password },
      })
    ).status,
    200,
  );
});
