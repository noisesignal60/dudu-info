import { signIn } from "@/auth";

export const metadata = {
  title: "登入 ｜ 嘟嘟資訊網",
};

export default function LoginPage() {
  async function loginWithLine() {
    "use server";
    await signIn("line", { redirectTo: "/dashboard" });
  }

  return (
    <main className="min-h-svh flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand text-white text-4xl font-black shadow-lg">
              嘟
            </div>
            <h1 className="mt-5 text-3xl font-black text-slate-900">
              嘟嘟資訊網
            </h1>
            <p className="mt-2 text-slate-600">分潤系統</p>
          </div>

          {/* LINE Login */}
          <form action={loginWithLine}>
            <button type="submit" className="btn-primary w-full text-xl">
              <svg
                className="w-6 h-6"
                viewBox="0 0 32 32"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 3C8.27 3 2 8.04 2 14.27c0 5.6 4.97 10.28 11.69 11.16.45.1 1.07.3 1.22.69.14.36.09.91.05 1.27l-.2 1.18c-.06.35-.28 1.37 1.2.75 1.49-.62 8-4.71 10.91-8.06h-.01c2.01-2.21 2.97-4.45 2.97-6.99C29.83 8.04 23.56 3 16 3z" />
              </svg>
              使用 LINE 登入
            </button>
          </form>

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
