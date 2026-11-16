import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow || "ICT ONLINE ASSESSMENT"}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
