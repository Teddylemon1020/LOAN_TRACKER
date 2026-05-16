import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import loanRoutes from "./routes/loan";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", loanRoutes);

if (process.env.NODE_ENV === "production") {
  const clientBuild = path.join(__dirname, "..", "public");
  app.use(express.static(clientBuild));
  // Catch-all: serve React for any non-API route
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

export default app;
