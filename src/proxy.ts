import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Next.js 16 Proxy（原 middleware）— 路由保護的「樂觀檢查」。
 *
 * 兩種使用者身分：
 *  1) 會員端 /dashboard、/onboarding  —  Auth.js session（LINE 登入）
 *  2) 後台   /admin、/reports         —  iron-session cookie（帳密登入）
 *
 * 本 proxy 只能讀 cookie / Auth.js session；無法在 edge 解密 iron-session（依賴 Node API），
 * 因此後台採用「cookie 存在性」做樂觀檢查，真正驗證在 layout/page 中 getCurrentAdmin()。
 */
const ADMIN_COOKIE = "dudu-admin-session";

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = (req as unknown as { auth: { user?: { profileCompleted?: boolean } } | null })
    .auth;

  // -------- 會員端 ----------------------------------------------------------
  const isMemberLoggedIn = !!session?.user;
  const profileDone = session?.user?.profileCompleted === true;

  if (isMemberLoggedIn && profileDone && (path === "/login" || path === "/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (isMemberLoggedIn && !profileDone && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }
  if (!isMemberLoggedIn && (path.startsWith("/dashboard") || path === "/onboarding")) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // -------- 後台 ------------------------------------------------------------
  const hasAdminCookie = !!req.cookies.get(ADMIN_COOKIE)?.value;

  // 已登入時待在各自的登入頁 → 導回各自首頁
  if (hasAdminCookie && path === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }
  if (hasAdminCookie && path === "/reports/login") {
    return NextResponse.redirect(new URL("/reports", nextUrl));
  }

  // 未登入時保護各自區域，但放行各自的登入頁（避免無限導向）
  const isAdminProtected = path.startsWith("/admin") && path !== "/admin/login";
  const isReportsProtected = path.startsWith("/reports") && path !== "/reports/login";

  if (isAdminProtected && !hasAdminCookie) {
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }
  if (isReportsProtected && !hasAdminCookie) {
    return NextResponse.redirect(new URL("/reports/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
