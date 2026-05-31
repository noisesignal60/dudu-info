import { AdminLoginForm } from "@/app/admin/login/admin-login-form";

export const metadata = {
  title: "登入 ｜ 帳簿系統",
};

export default function ReportsLoginPage() {
  return (
    <main className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-card shadow-premium border border-hairline p-8">
        <div className="text-center mb-8">
          <p className="eyebrow">嘟嘟資訊網</p>
          <h1 className="mt-1 font-serif text-2xl font-black text-ink tracking-tight">帳簿系統</h1>
        </div>
        <AdminLoginForm redirectTo="/reports" />
      </div>
    </main>
  );
}
