export const ugx = (value) =>
  `UGX ${new Intl.NumberFormat("en-UG").format(value)}`;
export const eventDate = (value) =>
  new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Kampala",
  }).format(new Date(`${value}T12:00:00+03:00`));
export const paymentStatus = ({ paid, total }) =>
  paid >= total ? "Paid" : paid > 0 ? "Part paid" : "Unpaid";

export function validateEvent(event, bookings = []) {
  const errors = {};
  if (!event.title?.trim() || event.title.trim().length > 80)
    errors.title = "Enter an event name of 1–80 characters.";
  if (!event.venue?.trim() || event.venue.trim().length > 120)
    errors.venue = "Enter a venue of 1–120 characters.";
  const date = new Date(`${event.date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(event.date ?? "") ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== event.date
  )
    errors.date = "Choose a valid event date.";
  if (!["Draft", "Published"].includes(event.status))
    errors.status = "Choose draft or published.";
  if (
    !Array.isArray(event.tickets) ||
    event.tickets.length !== 2 ||
    event.tickets[0]?.id !== "general" ||
    event.tickets[1]?.id !== "vip"
  ) {
    errors.tickets = "This starter requires General and VIP ticket categories.";
    return errors;
  }
  for (const ticket of event.tickets) {
    if (!Number.isSafeInteger(ticket.price) || ticket.price <= 0)
      errors[`${ticket.id}Price`] = "Enter a positive whole UGX amount.";
    const reserved = bookings
      .filter((b) => b.eventId === event.id && b.ticketId === ticket.id)
      .reduce((sum, b) => sum + b.quantity, 0);
    if (
      !Number.isSafeInteger(ticket.capacity) ||
      ticket.capacity < Math.max(1, reserved)
    )
      errors[`${ticket.id}Capacity`] =
        `Enter a whole capacity of at least ${Math.max(1, reserved)}. Existing bookings must fit.`;
  }
  return errors;
}
