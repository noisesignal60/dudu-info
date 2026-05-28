import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export type AdminSessionData = {
  adminId?: string;
  username?: string;
  displayName?: string;
};

const COOKIE_NAME = "dudu-admin-session";

function sessionOptions(): SessionOptions {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET 未設定或長度不足 32（請執行 openssl rand -base64 32）",
    );
  }
  return {
    password,
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 小時
    },
  };
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const store = await cookies();
  return getIronSession<AdminSessionData>(store, sessionOptions());
}

export async function getCurrentAdmin(): Promise<AdminSessionData | null> {
  const session = await getAdminSession();
  if (!session.adminId) return null;
  return {
    adminId: session.adminId,
    username: session.username,
    displayName: session.displayName,
  };
}
