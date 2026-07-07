import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/ui/button";

/**
 * 分頁導覽基元（shadcn/ui 結構，改用 next/link 導頁）。
 * 樣式沿用全站唯一的 buttonVariants：目前頁用 secondary（有框），
 * 其餘頁與上/下一頁用 ghost；停用時以 aria-disabled + 半透明呈現。
 */

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="分頁導覽"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row flex-wrap items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

export function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

export function PaginationLink({
  className,
  isActive,
  ...props
}: { isActive?: boolean } & React.ComponentProps<typeof Link>) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
        "min-w-9",
        className,
      )}
      {...props}
    />
  );
}

export function PaginationPrevious({
  className,
  disabled,
  ...props
}: { disabled?: boolean } & React.ComponentProps<typeof Link>) {
  const cls = cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "gap-1 px-2.5",
    className,
  );
  if (disabled) {
    return (
      <span aria-disabled aria-label="上一頁" className={cn(cls, "pointer-events-none opacity-50")}>
        <ChevronLeft />
        <span>上一頁</span>
      </span>
    );
  }
  return (
    <Link aria-label="上一頁" className={cls} {...props}>
      <ChevronLeft />
      <span>上一頁</span>
    </Link>
  );
}

export function PaginationNext({
  className,
  disabled,
  ...props
}: { disabled?: boolean } & React.ComponentProps<typeof Link>) {
  const cls = cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "gap-1 px-2.5",
    className,
  );
  if (disabled) {
    return (
      <span aria-disabled aria-label="下一頁" className={cn(cls, "pointer-events-none opacity-50")}>
        <span>下一頁</span>
        <ChevronRight />
      </span>
    );
  }
  return (
    <Link aria-label="下一頁" className={cls} {...props}>
      <span>下一頁</span>
      <ChevronRight />
    </Link>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center text-slate-400", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">更多頁</span>
    </span>
  );
}
