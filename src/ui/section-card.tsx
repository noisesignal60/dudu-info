import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";

/**
 * 區塊卡片（對外 API 不變，內部改用統一 Card）。標題比通用 Card 大一級（text-xl）。
 */
export function SectionCard({
  title,
  subtitle,
  eyebrow,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <CardTitle className="font-serif text-xl tracking-tight">{title}</CardTitle>
          {subtitle && <CardDescription className="mt-1.5">{subtitle}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
