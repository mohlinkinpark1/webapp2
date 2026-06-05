import { NextRequest } from "next/server";

const DEFAULT_ADMIN_TOKEN = "supersecretadmintoken2024";

export function isAdminAuthorized(req: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
  
  // Headers are lowercased in Next.js Request
  const headerToken = req.headers.get("x-admin-token");
  
  return headerToken === adminToken;
}
