import request from "supertest";
import jwt from "jsonwebtoken";
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

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const userToken = jwt.sign({ id: "user-1", role: "USER" }, JWT_SECRET);
const adminToken = jwt.sign({ id: "admin-1", role: "ADMIN" }, JWT_SECRET);

const baseLoan = {
  id: "loan-1",
  amount: 5000,
  date: "2026-05-16",
  term: 6,
  rate: 6,
  monthly: 855.14,
  repayment: 5130.84,
  status: "PENDING",
  userId: "user-1",
  createdAt: new Date(),
};

describe("POST /api/loan", () => {
  it("returns 201 with the created loan", async () => {
    prismaMock.loan.create.mockResolvedValue(baseLoan);

    const res = await request(app)
      .post("/api/loan")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        amount: "5000",
        date: "2026-05-16",
        term: "6",
        rate: 6,
        monthly: "855.14",
        repayment: "5130.84",
        status: "PENDING",
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(5000);
    expect(res.body.status).toBe("PENDING");
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).post("/api/loan").send({ amount: "5000" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/loans", () => {
  it("returns the authenticated user's loans", async () => {
    prismaMock.loan.findMany.mockResolvedValue([baseLoan]);

    const res = await request(app)
      .get("/api/loans")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("loan-1");
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/loans");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users", () => {
  it("returns user list for ADMIN", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "user-1", username: "john", email: "john@example.com", password: "", role: "USER", createdAt: new Date() },
    ]);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("returns 403 for a regular USER", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users/:id/loans", () => {
  it("returns loans for a specific user", async () => {
    prismaMock.loan.findMany.mockResolvedValue([baseLoan]);

    const res = await request(app)
      .get("/api/admin/users/user-1/loans")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body[0].userId).toBe("user-1");
  });

  it("returns 403 for non-admin", async () => {
    const res = await request(app)
      .get("/api/admin/users/user-1/loans")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/admin/loans/:id", () => {
  it("approves a loan", async () => {
    prismaMock.loan.update.mockResolvedValue({ ...baseLoan, status: "APPROVED" });

    const res = await request(app)
      .patch("/api/admin/loans/loan-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVED" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("adjusts the interest rate", async () => {
    prismaMock.loan.update.mockResolvedValue({ ...baseLoan, rate: 9 });

    const res = await request(app)
      .patch("/api/admin/loans/loan-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rate: "9" });

    expect(res.status).toBe(200);
    expect(res.body.rate).toBe(9);
  });

  it("returns 403 for non-admin", async () => {
    const res = await request(app)
      .patch("/api/admin/loans/loan-1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "APPROVED" });

    expect(res.status).toBe(403);
  });
});
