import NextAuth from "next-auth";
import LINE from "next-auth/providers/line";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Auth.js v5
 *
 * 流程：
 *   LINE OAuth → signIn callback → upsert public.members（以 line_user_id 為主鍵）
 *   session callback → 帶 memberId / profileCompleted 進 session
 *   proxy.ts 用 session 做樂觀檢查；DAL 用 session.memberId 查資料。
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    LINE({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
      authorization: { params: { scope: "profile openid email" } },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    /** LINE 登入成功時：upsert 會員主檔 */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "line") return false;

      const lineUserId =
        (profile as { sub?: string } | undefined)?.sub ??
        account.providerAccountId;
      if (!lineUserId) return false;

      const db = supabaseAdmin();

      const { data: existing } = await db
        .from("members")
        .select("id, profile_completed")
        .eq("line_user_id", lineUserId)
        .maybeSingle();

      if (!existing) {
        // 首次登入：建立 member + 對應 balances + 自動產推薦碼
        const referralCode = await generateUniqueReferralCode(db);
        const { data: inserted, error } = await db
          .from("members")
          .insert({
            line_user_id: lineUserId,
            line_display: user.name,
            line_avatar_url: user.image,
            email: user.email,
            referral_code: referralCode,
            profile_completed: false,
          })
          .select("id")
          .single();

        if (error || !inserted) {
          console.error("[auth] insert member failed", error);
          return false;
        }

        await db.from("balances").insert({ member_id: inserted.id });
      } else {
        // 已存在：刷新 LINE 名稱與頭像
        await db
          .from("members")
          .update({
            line_display: user.name,
            line_avatar_url: user.image,
            email: user.email,
          })
          .eq("id", existing.id);
      }
      return true;
    },

    /** JWT：把 memberId / profileCompleted 寫入 token */
    async jwt({ token, account, profile }) {
      const lineUserId =
        (profile as { sub?: string } | undefined)?.sub ??
        account?.providerAccountId ??
        (token.lineUserId as string | undefined);

      if (lineUserId && !token.memberId) {
        const db = supabaseAdmin();
        const { data } = await db
          .from("members")
          .select("id, profile_completed, name")
          .eq("line_user_id", lineUserId)
          .maybeSingle();

        if (data) {
          token.memberId = data.id;
          token.profileCompleted = data.profile_completed;
          token.displayName = data.name ?? token.name;
          token.lineUserId = lineUserId;
        }
      }
      return token;
    },

    /** Session：暴露給 server / client 可讀的欄位 */
    async session({ session, token }) {
      if (session.user) {
        (session.user as { memberId?: string }).memberId =
          token.memberId as string | undefined;
        (session.user as { profileCompleted?: boolean }).profileCompleted =
          (token.profileCompleted as boolean | undefined) ?? false;
      }
      return session;
    },
  },
});

async function generateUniqueReferralCode(
  db: ReturnType<typeof supabaseAdmin>,
): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomBase32(6);
    const { data } = await db
      .from("members")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  // fallback：時戳 + 隨機，碰撞機率極低
  return `${Date.now().toString(36).slice(-4).toUpperCase()}${randomBase32(4)}`;
}

function randomBase32(len: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 排除易混字 I, O, 0, 1
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
