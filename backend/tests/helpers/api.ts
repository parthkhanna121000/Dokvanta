import type { Express } from "express";
import request from "supertest";
import { expect } from "vitest";
import { minimalPdf } from "./pdf-fixtures";

export type Agent = ReturnType<typeof request.agent>;
export const PASSWORD = "correct-horse-battery";

export async function signup(app: Express, email: string): Promise<Agent> {
  const agent = request.agent(app);
  const res = await agent.post("/api/v1/auth/register").send({ email, password: PASSWORD, name: "User" });
  expect(res.status).toBe(201);
  return agent;
}

export async function uploadDocument(agent: Agent, marker = "doc"): Promise<string> {
  const res = await agent
    .post("/api/v1/documents")
    .attach("file", minimalPdf(marker), { filename: "plan.pdf", contentType: "application/pdf" });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}