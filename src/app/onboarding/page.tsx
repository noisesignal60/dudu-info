import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "完成個人資料 ｜ 嘟嘟資訊網",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-svh">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white font-black text-lg grid place-items-center">
              嘟
            </div>
            <span className="font-bold text-slate-900">嘟嘟資訊網</span>
          </div>
          <Suspense fallback={<span className="text-slate-300 text-sm">…</span>}>
            <LogoutButton />
          </Suspense>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">完成您的個人資料</h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            歡迎加入嘟嘟資訊網！請先填寫以下資料，完成後即可進入主系統。
            <br />
            <span className="text-money font-semibold">
              ＊ 銀行存摺圖片上傳後將自動加上浮水印，且無法重新上傳。
            </span>
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
          }
        >
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
      <button type="submit" className="text-slate-600 text-sm px-3 py-2">
        登出
      </button>
    </form>
  );
}
