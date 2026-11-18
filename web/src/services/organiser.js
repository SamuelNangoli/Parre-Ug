import { request } from "./api.js";

export const organiser = {
  load: () => request("/manage"),
  async saveEvent(event) {
    await request(
      event.id
        ? `/manage/events/${encodeURIComponent(event.id)}`
        : "/manage/events",
      { method: event.id ? "PUT" : "POST", data: event },
    );
    return request("/manage");
  },
};
