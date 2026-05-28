import { handlers } from "@/auth";

// Auth.js v5：OAuth callback handler
// LINE Provider 的 callback URL：{AUTH_URL}/api/auth/callback/line
export const { GET, POST } = handlers;
