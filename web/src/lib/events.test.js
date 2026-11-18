import test from "node:test";
import assert from "node:assert/strict";
import { initialData } from "../data/demo.js";
import { paymentStatus, validateEvent, ugx } from "./events.js";

test("sample events are valid against their existing bookings", () => {
  for (const event of initialData.events)
    assert.deepEqual(validateEvent(event, initialData.bookings), {});
});
test("rejects blank names and invalid calendar dates", () => {
  const event = {
    ...structuredClone(initialData.events[0]),
    title: " ",
    date: "2026-02-30",
  };
  const errors = validateEvent(event);
  assert.ok(errors.title);
  assert.ok(errors.date);
});
test("rejects fractional or non-positive UGX prices and capacities", () => {
  const event = structuredClone(initialData.events[0]);
  event.tickets[0].price = 0;
  event.tickets[1].price = 10.5;
  event.tickets[0].capacity = -1;
  event.tickets[1].capacity = 2.5;
  const errors = validateEvent(event);
  for (const key of [
    "generalPrice",
    "vipPrice",
    "generalCapacity",
    "vipCapacity",
  ])
    assert.ok(errors[key]);
});
test("cannot reduce capacity below tickets already reserved, including unpaid bookings", () => {
  const event = structuredClone(initialData.events[0]);
  event.tickets[0].capacity = 4;
  assert.ok(validateEvent(event, initialData.bookings).generalCapacity);
  event.tickets[0].capacity = 5;
  assert.equal(
    validateEvent(event, initialData.bookings).generalCapacity,
    undefined,
  );
});
test("rejects unexpected publishing states and missing categories", () => {
  const event = {
    ...structuredClone(initialData.events[0]),
    status: "Archived",
    tickets: [],
  };
  assert.ok(validateEvent(event).status);
  assert.ok(validateEvent(event).tickets);
});
test("payment labels distinguish paid, part-paid and unpaid bookings", () => {
  assert.equal(paymentStatus({ paid: 50000, total: 50000 }), "Paid");
  assert.equal(paymentStatus({ paid: 25000, total: 50000 }), "Part paid");
  assert.equal(paymentStatus({ paid: 0, total: 50000 }), "Unpaid");
});
test("currency is displayed in whole Ugandan shillings", () => {
  assert.equal(ugx(50000), "UGX 50,000");
});
