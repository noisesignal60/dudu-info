import Image from "next/image";
import type { DownlineMember } from "@/data/stats";

/** 下線名單單列：LINE 頭像 + 名稱（伺服器元件，供推薦／網絡頁共用） */
export function MemberRow({ member }: { member: DownlineMember }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={member.displayName} url={member.avatarUrl} />
      <span className="text-ink font-medium truncate">{member.displayName}</span>
    </li>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={80}
        height={80}
        className="size-10 shrink-0 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand">
      {name.slice(0, 1)}
    </span>
  );
}
