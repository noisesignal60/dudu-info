import { AdminLoginForm } from "./admin-login-form";

export const metadata = {
  title: "後台登入 ｜ 嘟嘟資訊網",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-card shadow-premium border border-hairline p-8">
        <div className="text-center mb-8">
          <p className="eyebrow">嘟嘟資訊網</p>
          <h1 className="mt-1 font-serif text-2xl font-black text-ink tracking-tight">後台管理系統</h1>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
