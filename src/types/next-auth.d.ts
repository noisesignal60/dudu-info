import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      memberId?: string;
      profileCompleted?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    memberId?: string;
    profileCompleted?: boolean;
    lineUserId?: string;
    displayName?: string;
  }
}
