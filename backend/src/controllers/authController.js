import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { normalizeEmail, requireFields, safeTrim } from "../utils/validators.js";
import { Roles } from "../utils/roles.js";

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function register(req, res, next) {
  try {
    const missing = requireFields(req.body, ["name", "username", "password"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const name = safeTrim(req.body.name);
    const username = safeTrim(req.body.username).toLowerCase();
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;

    const existing = await User.findOne({ username }).lean();
    if (existing) return res.status(409).json({ message: "Username already exists" });

    // Public register defaults to Parent.
    const role = Roles.Parent;
    const passwordHash = await User.hashPassword(req.body.password);
    const user = await User.create({ name, username, email, role, passwordHash });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function bootstrapAdmin(req, res, next) {
  try {
    const already = await User.exists({ role: Roles.Admin });
    if (already) return res.status(403).json({ message: "Admin already exists. Bootstrap is disabled." });

    if (env.bootstrapToken) {
      const token = safeTrim(req.headers["x-bootstrap-token"] || req.body.bootstrapToken || "");
      if (!token || token !== env.bootstrapToken) {
        return res.status(403).json({ message: "Invalid bootstrap token" });
      }
    }

    const missing = requireFields(req.body, ["name", "username", "password"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const name = safeTrim(req.body.name);
    const username = safeTrim(req.body.username).toLowerCase();
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;

    const existing = await User.findOne({ username }).lean();
    if (existing) return res.status(409).json({ message: "Username already exists" });

    const passwordHash = await User.hashPassword(req.body.password);
    const user = await User.create({ name, username, email, role: Roles.Admin, passwordHash });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const password = req.body.password;
    const identifier = safeTrim(req.body.username || req.body.email || req.body.identifier || "");
    const missing = [];
    if (!identifier) missing.push("username");
    if (!password) missing.push("password");
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const normalized = identifier.toLowerCase();
    const email = normalized.includes("@") ? normalizeEmail(normalized) : null;
    const user = await User.findOne(
      email ? { $or: [{ username: normalized }, { email }] } : { username: normalized }
    );
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ message: "User is deactivated" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res) {
  // JWT logout is typically handled client-side or with token revocation list.
  res.json({ ok: true });
}

export async function me(req, res) {
  res.json({
    id: req.user._id,
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  });
}
