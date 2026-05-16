import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/loan", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, date, term, rate, monthly, repayment } = req.body;
    const loan = await prisma.loan.create({
      data: {
        amount: parseFloat(amount),
        date,
        term: parseInt(term),
        rate: parseFloat(rate),
        monthly: parseFloat(monthly),
        repayment: parseFloat(repayment),
        status: "PENDING",
        userId: req.user!.id,
      },
    });
    res.status(201).json(loan);
  } catch {
    res.status(500).json({ message: "Failed to create loan" });
  }
});

router.get("/loans", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(loans);
  } catch {
    res.status(500).json({ message: "Failed to fetch loans" });
  }
});

router.get("/admin/users", requireAuth, requireRole("ADMIN"), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true },
    });
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/admin/users/:id/loans", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(loans);
  } catch {
    res.status(500).json({ message: "Failed to fetch user loans" });
  }
});

router.patch("/admin/loans/:id", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const { status, rate } = req.body;
    const updated = await prisma.loan.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(rate !== undefined && { rate: parseFloat(rate) }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update loan" });
  }
});

export default router;
