import { AdminLoginForm } from "./admin-login-form";

export const metadata = {
  title: "後台登入 ｜ 嘟嘟資訊網",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-svh bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white text-2xl font-black">
            嘟
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">後台管理系統</h1>
          <p className="mt-1 text-sm text-slate-500">嘟嘟資訊網</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
