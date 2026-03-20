import User from "../models/User.js";
import { ALL_ROLES, Roles } from "../utils/roles.js";
import { isEmail, normalizeEmail, requireFields, safeTrim } from "../utils/validators.js";

export async function listUsers(req, res, next) {
  try {
    const { role, q } = req.query;
    const filter = {};
    if (role && ALL_ROLES.includes(role)) filter.role = role;
    if (q) {
      const rx = new RegExp(String(q).replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
    }
    const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).lean();
    res.json({ items: users });
  } catch (e) {
    next(e);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function createUser(req, res, next) {
  try {
    const missing = requireFields(req.body, ["name", "username", "password", "role"]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });

    const role = safeTrim(req.body.role);
    if (!ALL_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (role === Roles.Admin && req.user.role !== Roles.Admin) {
      return res.status(403).json({ message: "Only Admin can create Admin users" });
    }

    const username = safeTrim(req.body.username).toLowerCase();
    const exists = await User.findOne({ username }).lean();
    if (exists) return res.status(409).json({ message: "Username already exists" });

    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    if (email && !isEmail(email)) return res.status(400).json({ message: "Invalid email" });

    const passwordHash = await User.hashPassword(req.body.password);
    const user = await User.create({
      name: safeTrim(req.body.name),
      username,
      email,
      role,
      twoFactorEnabled: Boolean(req.body.twoFactorEnabled),
      passwordHash,
    });

    res.status(201).json({ id: user._id, name: user.name, username: user.username, email: user.email, role: user.role });
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name != null) user.name = safeTrim(req.body.name);

    if (req.body.username != null) {
      const username = safeTrim(req.body.username).toLowerCase();
      const existing = await User.findOne({ username }).lean();
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(409).json({ message: "Username already exists" });
      }
      user.username = username;
    }

    if (req.body.email != null) user.email = normalizeEmail(req.body.email);
    if (req.body.role != null) {
      const role = safeTrim(req.body.role);
      if (!ALL_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
      if (role === Roles.Admin && req.user.role !== Roles.Admin) {
        return res.status(403).json({ message: "Only Admin can assign Admin role" });
      }
      user.role = role;
    }
    if (req.body.twoFactorEnabled != null) user.twoFactorEnabled = Boolean(req.body.twoFactorEnabled);
    if (req.body.isActive != null) user.isActive = Boolean(req.body.isActive);
    if (req.body.password) user.passwordHash = await User.hashPassword(req.body.password);

    await user.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = false;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

