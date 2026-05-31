/** 浮動客服按鈕：固定在右下角，方便司機求助 */
export function SupportFab() {
  return (
    <a
      href="tel:+886000000000"
      className="fixed bottom-5 right-5 z-40 flex items-center
                 min-h-12 px-5 rounded-full bg-primary text-primary-foreground shadow-premium
                 hover:bg-brand-dark active:scale-95 transition"
      aria-label="聯絡客服"
    >
      <span className="font-semibold">客服</span>
    </a>
  );
}
