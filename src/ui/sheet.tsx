import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Excel 式試算表的視覺基元（格線、固定表頭、列號欄）。
 * 集中於此以 token 表示，供「可編輯帳簿網格」與「唯讀彙總表」共用，
 * 避免一次性樣式散落各處。
 *
 * 註：全站 html 基準字級為 34px，這裡刻意用較小字級（cell text-sm、
 * 表頭 text-xs）讓密度接近 Excel。
 */

/** 可捲動容器：固定表頭/列號靠 sticky，需要這層的 overflow。 */
export function SheetScroll({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-scroll"
      className={cn(
        "relative w-full overflow-auto rounded-card border border-hairline bg-surface",
        "max-h-[70vh] text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function SheetTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="sheet-table"
      className={cn("w-full border-collapse tabular-nums", className)}
      {...props}
    />
  );
}

export function SheetHead({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="sheet-head"
      className={cn("sticky top-0 z-20", className)}
      {...props}
    />
  );
}

/** 一般表頭格（置中、髮絲格線）。 */
export function SheetHeadCell({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="sheet-head-cell"
      className={cn(
        "relative border border-hairline bg-canvas px-2 py-1.5 text-center text-xs font-semibold " +
          "uppercase tracking-[0.04em] text-slate-500 whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

/** 表頭最左上角（與列號欄對齊），同時 sticky top+left。 */
export function SheetCorner({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="sheet-corner"
      className={cn(
        "relative sticky left-0 z-30 w-12 border border-hairline bg-canvas px-2 py-1.5 " +
          "text-center text-xs font-semibold text-slate-400",
        className,
      )}
      {...props}
    />
  );
}

/** 每列最左的列號欄（sticky left）。 */
export function SheetRowNum({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="sheet-rownum"
      className={cn(
        "relative sticky left-0 z-10 w-12 border border-hairline bg-canvas px-1 py-1 " +
          "text-center text-xs text-slate-400 select-none",
        className,
      )}
      {...props}
    />
  );
}

/** 一般資料格（髮絲格線）。 */
export function SheetCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="sheet-cell"
      className={cn("border border-hairline px-2 py-1 align-middle", className)}
      {...props}
    />
  );
}

/** 選取中的儲存格外框（brand）。 */
export const sheetActiveCls =
  "outline outline-2 -outline-offset-1 outline-brand bg-brand/5";

/** 驗證未過的儲存格（紅底紅字，使用 money token）。 */
export const sheetInvalidCls = "bg-money/10 text-money";

/**
 * 欄寬拖移把手：放在表頭格右緣（SheetHeadCell 需 relative，已內建）。
 * 滑過/拖動時以 brand 提示。
 */
export function SheetColResizer({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sheet-col-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="調整欄寬"
      className={cn(
        "absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize touch-none select-none",
        "hover:bg-brand/40 active:bg-brand",
        className,
      )}
      {...props}
    />
  );
}

/**
 * 列高拖移把手：放在列號格下緣（SheetRowNum 需 relative，已內建）。
 * 滑過/拖動時以 brand 提示。
 */
export function SheetRowResizer({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sheet-row-resizer"
      role="separator"
      aria-orientation="horizontal"
      aria-label="調整列高"
      className={cn(
        "absolute bottom-0 left-0 z-10 h-1.5 w-full cursor-row-resize touch-none select-none",
        "hover:bg-brand/40 active:bg-brand",
        className,
      )}
      {...props}
    />
  );
}
