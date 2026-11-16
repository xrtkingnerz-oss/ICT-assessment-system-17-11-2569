/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClipboardList } from "lucide-react";

export function Status({ value }: { value: string }) {
  const names: any = {
    DRAFT: "ฉบับร่าง",
    PUBLISHED: "เผยแพร่",
    CLOSED: "ปิดแล้ว",
  };
  return (
    <span className={`status ${value.toLowerCase()}`}>
      <i />
      {names[value] || value}
    </span>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <ClipboardList size={30} />
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}
