"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LayoutGrid, ListTree, ZoomIn, ZoomOut } from "lucide-react";
import type { TreeNode } from "@/data/admin/network";
import { cn } from "@/lib/utils";

type Mode = "tree" | "list";

function subscribeViewport(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getIsDesktop(): boolean {
  return typeof window !== "undefined"
    ? window.matchMedia("(min-width: 768px)").matches
    : false;
}

export function NetworkTreeView({
  roots,
  totalMembers,
}: {
  roots: TreeNode[];
  totalMembers: number;
}) {
  const isDesktop = useSyncExternalStore(
    subscribeViewport,
    getIsDesktop,
    () => false,
  );
  const [override, setOverride] = useState<Mode | null>(null);
  const mode: Mode = override ?? (isDesktop ? "tree" : "list");
  const setMode = (m: Mode) => setOverride(m);

  // 包成單一虛擬 root 給 d3-tree 用
  const data = useMemo<TreeNode>(() => {
    if (roots.length === 1) return roots[0];
    return {
      id: "__virtual__",
      name: "嘟嘟資訊網",
      attributes: { downlineCount: totalMembers },
      children: roots,
    };
  }, [roots, totalMembers]);

  if (roots.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-500">
        尚無會員資料
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          共 <strong className="text-slate-900">{totalMembers}</strong> 位會員
          {roots.length > 1 && (
            <> · {roots.length} 個獨立節點</>
          )}
        </span>
        <div className="inline-flex border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("tree")}
            className={cn(
              "px-3 py-2 text-sm font-medium inline-flex items-center gap-1",
              mode === "tree"
                ? "bg-brand text-white"
                : "bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            樹狀
          </button>
          <button
            type="button"
            onClick={() => setMode("list")}
            className={cn(
              "px-3 py-2 text-sm font-medium inline-flex items-center gap-1",
              mode === "list"
                ? "bg-brand text-white"
                : "bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            <ListTree className="w-4 h-4" />
            縮排列表
          </button>
        </div>
      </div>

      {mode === "tree" ? <D3TreeView data={data} /> : <IndentedList data={data} />}
    </div>
  );
}

// ─── D3 Tree ─────────────────────────────────────────────────────────

function D3TreeView({ data }: { data: TreeNode }) {
  const [Tree, setTree] = useState<React.ComponentType<Record<string, unknown>> | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 200, y: 60 });
  const [zoom, setZoom] = useState(0.8);

  useEffect(() => {
    // 動態 import，避免 SSR 載入 d3
    import("react-d3-tree").then((mod) => {
      setTree(() => mod.default as unknown as React.ComponentType<Record<string, unknown>>);
    });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setTranslate({ x: r.width / 2, y: 60 });
    }
  }, [Tree]);

  return (
    <div
      ref={containerRef}
      className="relative bg-slate-50"
      style={{ height: "calc(100vh - 280px)", minHeight: 500 }}
    >
      {!Tree && (
        <div className="absolute inset-0 grid place-items-center text-slate-500 text-sm">
          載入樹狀圖中...
        </div>
      )}
      {Tree && (
        <Tree
          data={data}
          orientation="vertical"
          translate={translate}
          zoom={zoom}
          collapsible={true}
          separation={{ siblings: 1.6, nonSiblings: 2 }}
          nodeSize={{ x: 200, y: 120 }}
          pathFunc="step"
          renderCustomNodeElement={({ nodeDatum }: { nodeDatum: TreeNode }) => (
            <NodeCard nodeDatum={nodeDatum} />
          )}
        />
      )}
      <div className="absolute right-4 top-4 flex flex-col gap-1 bg-white rounded-xl border border-slate-200 shadow p-1">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
          aria-label="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
          aria-label="縮小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NodeCard({ nodeDatum }: { nodeDatum: TreeNode }) {
  const isVirtual = nodeDatum.id === "__virtual__";
  return (
    <g>
      <foreignObject x={-90} y={-30} width={180} height={70}>
        {isVirtual ? (
          <div className="w-full h-full bg-slate-800 text-white rounded-xl flex items-center justify-center px-3 text-sm font-bold">
            {nodeDatum.name}
          </div>
        ) : (
          <a
            href={`/admin/members/${nodeDatum.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full bg-white border-2 border-brand rounded-xl px-3 py-2 hover:shadow-md transition no-underline"
          >
            <div className="text-sm font-bold text-slate-900 truncate">
              {nodeDatum.name}
            </div>
            {nodeDatum.attributes?.referralCode && (
              <div className="text-xs text-brand-dark font-mono mt-0.5">
                {nodeDatum.attributes.referralCode}
              </div>
            )}
            {(nodeDatum.attributes?.downlineCount ?? 0) > 0 && (
              <div className="text-xs text-slate-500 mt-0.5">
                下包 {nodeDatum.attributes.downlineCount} 人
              </div>
            )}
          </a>
        )}
      </foreignObject>
    </g>
  );
}

// ─── Indented List ──────────────────────────────────────────────────

function IndentedList({ data }: { data: TreeNode }) {
  return (
    <div className="p-3 overflow-x-auto">
      <IndentedNode node={data} depth={0} />
    </div>
  );
}

function IndentedNode({ node, depth }: { node: TreeNode; depth: number }) {
  const isVirtual = node.id === "__virtual__";
  const hasChildren = node.children.length > 0;

  if (isVirtual) {
    return (
      <>
        {node.children.map((c) => (
          <IndentedNode key={c.id} node={c} depth={depth} />
        ))}
      </>
    );
  }

  return (
    <details open className="ml-0" style={{ marginLeft: depth * 16 }}>
      <summary className="cursor-pointer list-none py-1.5 flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2">
        {hasChildren ? (
          <span className="text-slate-400 group-open:rotate-90 transition-transform">
            ▶
          </span>
        ) : (
          <span className="w-3" />
        )}
        <Link
          href={`/admin/members/${node.id}`}
          className="font-medium text-slate-900 hover:text-brand-dark"
        >
          {node.name}
        </Link>
        {node.attributes?.referralCode && (
          <code className="text-xs bg-brand-soft text-brand-dark px-1.5 py-0.5 rounded font-mono">
            {node.attributes.referralCode}
          </code>
        )}
        {(node.attributes?.downlineCount ?? 0) > 0 && (
          <span className="text-xs text-slate-500">
            ・ {node.attributes.downlineCount} 人
          </span>
        )}
      </summary>
      {hasChildren && (
        <div className="border-l-2 border-slate-200 ml-2">
          {node.children.map((c) => (
            <IndentedNode key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </details>
  );
}
