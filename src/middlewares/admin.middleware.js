import { fail } from "../utils/response.js";

export const requireAdmin = (req, res, next) => {
  const user = req.user;
  const isAdminByRole = ["admin", "administrator"].includes(String(user?.role || "").toLowerCase());
  const isAdminByName = String(user?.name || "").toLowerCase() === "admin";
  const isAdminByFlag = Boolean(user?.isAdmin || user?.is_admin);

  if (!isAdminByFlag && !isAdminByRole && !isAdminByName) {
    return fail(res, "Forbidden", { auth: "Admin access required" }, 403);
  }

  return next();
};
