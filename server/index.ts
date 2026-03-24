import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./gameHandler";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../src/game/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: "*",
      },
    }
  );

  setupSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
