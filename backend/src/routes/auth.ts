import { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "bad_request" });
    const { username, password } = parsed.data;
    if (username !== config.auth.adminUser || password !== config.auth.adminPass) {
      return reply.status(401).send({ error: "invalid_credentials" });
    }
    const token = app.jwt.sign({ sub: username, role: "admin" }, { expiresIn: "7d" });
    return { token, user: { username, role: "admin" } };
  });

  app.get("/me", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    return { user: req.user };
  });
}
