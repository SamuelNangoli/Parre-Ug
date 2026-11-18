import { useEffect, useState } from "react";
import { account } from "../services/api.js";
import { AccountContext } from "../lib/account-context.js";

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    account
      .session()
      .then((result) => {
        if (alive) setUser(result.user);
      })
      .catch((value) => {
        if (alive) setError(value.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const ended = () => setUser(null);
    window.addEventListener("parre:session-ended", ended);
    return () => {
      alive = false;
      window.removeEventListener("parre:session-ended", ended);
    };
  }, []);
  const value = {
    user,
    loading,
    error,
    async login(data) {
      const result = await account.login(data);
      setUser(result.user);
      return result.user;
    },
    async register(data) {
      const result = await account.register(data);
      setUser(result.user);
      return result.user;
    },
    async logout() {
      await account.logout();
      setUser(null);
    },
  };
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}
