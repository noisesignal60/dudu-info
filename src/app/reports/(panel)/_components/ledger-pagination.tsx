import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/pagination";

type Props = {
  basePath: string; // /reports
  // 目前的 searchParams（含 dept/year/from/to/sort/page），換頁時原樣保留其餘篩選鍵
  searchParams: {
    dept?: string;
    year?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: string;
    q?: string;
  };
  page: number; // 目前頁（1-based）
  totalPages: number;
};

/**
 * 收支總表分頁列：上一頁／下一頁 ＋ 視窗化頁碼（首頁、末頁、目前頁 ±1，其餘省略）。
 * 純導頁（GET），故為 Server Component；連結沿用目前所有篩選並改寫 page。
 */
export function LedgerPagination({ basePath, searchParams, page, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  const items = pageWindow(page, totalPages);

  return (
    <Pagination className="-mt-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={hrefFor(page - 1)} disabled={page <= 1} />
        </PaginationItem>

        {items.map((it, i) =>
          it === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={it}>
              <PaginationLink href={hrefFor(it)} isActive={it === page}>
                {it}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext href={hrefFor(page + 1)} disabled={page >= totalPages} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** 產生頁碼視窗：首頁、末頁、目前頁 ±1，之間的落差以 "ellipsis" 表示。 */
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}
