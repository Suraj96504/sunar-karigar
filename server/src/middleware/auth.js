import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies.session;
    if (!token)
      return res.status(401).json({ message: "Please sign in to continue." });
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const user = await User.findById(payload.sub);
    if (!user || user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Administrator access required." });
    req.user = user;
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Your session has expired. Please sign in again." });
  }
}
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      return res
        .status(400)
        .json({
          message: result.error.issues
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("; "),
        });
    req.body = result.data;
    next();
  };
}
