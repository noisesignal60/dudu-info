import { signIn } from "@/auth";
import { Button } from "@/ui/button";

export const metadata = {
  title: "登入 ｜ 嘟嘟資訊網",
};

export default function LoginPage() {
  async function loginWithLine() {
    "use server";
    await signIn("line", { redirectTo: "/dashboard" });
  }

  // 僅開發環境顯示：跳過 LINE 的測試登入
  const devLoginEnabled = process.env.NODE_ENV !== "production";
  async function loginDev() {
    "use server";
    await signIn("dev-login", { redirectTo: "/dashboard" });
  }

  return (
    <main className="min-h-svh flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-ink font-serif tracking-tight">
              嘟嘟資訊網
            </h1>
            <p className="mt-2 text-slate-600">分潤系統</p>
          </div>

          {/* LINE Login */}
          <form action={loginWithLine}>
            <Button type="submit" size="touch" className="w-full text-xl">
              <svg
                viewBox="0 0 32 32"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 3C8.27 3 2 8.04 2 14.27c0 5.6 4.97 10.28 11.69 11.16.45.1 1.07.3 1.22.69.14.36.09.91.05 1.27l-.2 1.18c-.06.35-.28 1.37 1.2.75 1.49-.62 8-4.71 10.91-8.06h-.01c2.01-2.21 2.97-4.45 2.97-6.99C29.83 8.04 23.56 3 16 3z" />
              </svg>
              使用 LINE 登入
            </Button>
          </form>

          {devLoginEnabled && (
            <form action={loginDev} className="mt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center min-h-12 text-base font-bold rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                開發測試登入（跳過 LINE）
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-slate-500 text-center leading-6">
            登入即代表您同意我們的服務條款與隱私政策。
            <br />
            首次登入需完成基本資料填寫。
          </p>
        </div>
      </div>

      <footer className="text-center text-sm text-slate-400 py-4">
        © 嘟嘟資訊網
      </footer>
    </main>
  );
}
