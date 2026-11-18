import { useEffect, useState } from "react";

export function currentRoute() {
  const [path = "/", query = ""] = (
    window.location.hash.startsWith("#/") ? window.location.hash.slice(1) : "/"
  ).split("?");
  return {
    path: path || "/",
    parts: path.split("/").filter(Boolean),
    query: new URLSearchParams(query),
  };
}
export const go = (path) => {
  window.location.hash = path;
};
export function useRoute() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => {
      if (!window.location.hash.startsWith("#/")) return;
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
export function safeNext(value, fallback = "/my-tickets") {
  return typeof value === "string" &&
    /^\/(?:checkout|booking|my-tickets|admin|organiser)(?:\/|\?|$)/.test(value)
    ? value
    : fallback;
}
