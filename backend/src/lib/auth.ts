import { FastifyRequest, FastifyReply } from "fastify";

export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  // Auth disabled: allow all requests
  return;
}
