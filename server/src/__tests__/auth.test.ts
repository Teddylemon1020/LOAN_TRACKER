import request from "supertest";
import bcrypt from "bcryptjs";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import app from "../app";
import { prisma } from "../lib/prisma";

jest.mock("../lib/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => mockReset(prismaMock));

const baseUser = {
  id: "user-1",
  username: "john",
  email: "john@example.com",
  password: "",
  role: "USER",
  createdAt: new Date(),
};

describe("POST /api/signup", () => {
  it("returns 201 with a token on success", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseUser, role: "USER" });

    const res = await request(app).post("/api/signup").send({
      username: "john",
      email: "john@example.com",
      password: "secret123",
      role: "USER",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.role).toBe("USER");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/signup").send({ username: "john" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("All fields are required");
  });

  it("returns 409 when email is already taken", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser });

    const res = await request(app).post("/api/signup").send({
      username: "john",
      email: "john@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("email");
  });
});

describe("POST /api/login", () => {
  it("returns 200 with token and role on valid credentials", async () => {
    const hashed = await bcrypt.hash("secret123", 10);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });

    const res = await request(app).post("/api/login").send({
      username: "john",
      password: "secret123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.role).toBe("USER");
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/login").send({ username: "john" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/api/login").send({
      username: "nobody",
      password: "secret123",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("returns 401 when password is wrong", async () => {
    const hashed = await bcrypt.hash("secret123", 10);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, password: hashed });

    const res = await request(app).post("/api/login").send({
      username: "john",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});
