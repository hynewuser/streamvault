import { Server as IOServer, Socket } from "socket.io";
import { logger } from "../lib/logger";

export function setupWebsocket(io: IOServer) {
  io.on("connection", (socket: Socket) => {
    logger.info({ id: socket.id }, "WS connected");
    socket.emit("system", { type: "hello", ts: Date.now() });

    socket.on("subscribe", (room: string) => socket.join(room));
    socket.on("unsubscribe", (room: string) => socket.leave(room));

    socket.on("disconnect", () => {
      logger.debug({ id: socket.id }, "WS disconnected");
    });
  });
}
