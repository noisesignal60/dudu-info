import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";

export const metadata = {
  title: "完成個人資料 ｜ 嘟嘟資訊網",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-svh">
      <header className="bg-white border-b border-hairline">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-serif font-bold text-ink">嘟嘟資訊網</span>
          <Suspense fallback={<span className="text-slate-300 text-sm">…</span>}>
            <LogoutButton />
          </Suspense>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 font-serif">完成您的個人資料</h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            歡迎加入嘟嘟資訊網！請先填寫以下資料，完成後即可進入主系統。
            <br />
            <span className="text-money font-semibold">
              ＊ 銀行存摺圖片上傳後將自動加上浮水印，且無法重新上傳。
            </span>
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <OnboardingGate />
        </Suspense>
      </div>
    </main>
  );
}

async function OnboardingGate() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.profileCompleted) redirect("/dashboard");
  return <OnboardingForm />;
}

async function LogoutButton() {
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm" className="text-slate-600">
        登出
      </Button>
    </form>
  );
}
