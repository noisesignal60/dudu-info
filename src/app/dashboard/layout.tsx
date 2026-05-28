import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FontScaleToggle } from "@/ui/font-scale-toggle";
import { SupportFab } from "@/ui/support-fab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white font-black text-lg grid place-items-center">
              嘟
            </div>
            <div>
              <p className="text-xs text-slate-500 leading-none">嘟嘟資訊網</p>
              <h1 className="font-bold text-slate-900 text-lg">分潤系統</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FontScaleToggle />
            <Suspense fallback={<UserPillSkeleton />}>
              <UserPill />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 pb-24">{children}</main>

      <SupportFab />
    </div>
  );
}

async function UserPill() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.profileCompleted) redirect("/onboarding");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex items-center gap-2 pl-2">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
      )}
      <form action={logout}>
        <button
          type="submit"
          className="text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-2"
        >
          登出
        </button>
      </form>
    </div>
  );
}

function UserPillSkeleton() {
  return (
    <div className="flex items-center gap-2 pl-2">
      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
      <div className="w-12 h-4 rounded bg-slate-200 animate-pulse" />
    </div>
  );
}
