import { fileURLToPath } from "node:url";
import { createApi } from "./app.js";

if (process.env.NODE_ENV === "production")
  throw new Error(
    "This local development API must be replaced by the team backend before production deployment.",
  );
const dataFile =
  process.env.PARRE_DATA_FILE ||
  fileURLToPath(new URL("../.data/parre.json", import.meta.url));
const port = Number(process.env.PARRE_API_PORT || 4174);
const server = createApi({ dataFile });
server.listen(port, "127.0.0.1", () =>
  console.log(`Parre local API: http://127.0.0.1:${port} (test payments only)`),
);
