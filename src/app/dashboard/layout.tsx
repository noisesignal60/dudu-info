import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 bg-surface border-b border-hairline shadow-premium-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow leading-none">嘟嘟資訊網</p>
            <h1 className="font-serif font-bold text-ink text-lg leading-tight mt-0.5">分潤系統</h1>
          </div>

          <div className="flex items-center gap-2">
            <Suspense fallback={<UserPillSkeleton />}>
              <UserPill />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 pb-24">{children}</main>
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
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="font-medium text-slate-600 hover:text-slate-900"
        >
          登出
        </Button>
      </form>
    </div>
  );
}

function UserPillSkeleton() {
  return (
    <div className="flex items-center gap-2 pl-2">
      <Skeleton className="w-9 h-9 rounded-full" />
      <Skeleton className="w-12 h-4 rounded" />
    </div>
  );
}
