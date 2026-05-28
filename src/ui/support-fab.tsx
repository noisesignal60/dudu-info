import { HelpCircle } from "lucide-react";

/** 浮動客服按鈕：固定在右下角，方便司機求助 */
export function SupportFab() {
  return (
    <a
      href="tel:+886000000000"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2
                 min-h-12 px-5 rounded-full bg-slate-900 text-white shadow-lg
                 hover:bg-slate-800 active:scale-95 transition"
      aria-label="聯絡客服"
    >
      <HelpCircle className="w-5 h-5" />
      <span className="font-semibold">客服</span>
    </a>
  );
}
