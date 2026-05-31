import Link from "next/link";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-4">
      <EmptyState
        title="找不到頁面"
        description="您要找的頁面不存在或已被移除。"
        action={
          <Button asChild size="touch">
            <Link href="/">回到首頁</Link>
          </Button>
        }
      />
    </div>
  );
}
