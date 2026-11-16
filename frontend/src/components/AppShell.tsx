import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { User } from "../types";

export default function AppShell({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "ภาพรวม", icon: LayoutDashboard },
    { to: "/assessments", label: "แบบประเมิน", icon: ClipboardList },
    { to: "/categories", label: "จัดการหมวดหมู่", icon: FolderKanban },
    ...(user.role === "ADMIN"
      ? [{ to: "/users", label: "จัดการผู้ใช้งาน", icon: Users }]
      : []),
    { to: "/reports", label: "รายงานผล", icon: BarChart3 },
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={21} />
          </div>
          <div>
            <b>ICT Assessment</b>
            <small>ศูนย์ ICT ขอนแก่น</small>
          </div>
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-note">
            <ShieldCheck size={17} />
            <span>ข้อมูลเชื่อมต่อฐานข้อมูลจริง</span>
          </div>
          <button
            className="profile-mini"
            onClick={() => (location.href = "/profile")}
          >
            <div className="avatar">{user.fullName.slice(0, 1)}</div>
            <span>
              <b>{user.fullName}</b>
              <small>
                {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}
              </small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="crumb">
            ศูนย์ ICT <span>/</span> <b>ระบบประเมินออนไลน์</b>
          </div>
          <div className="top-user">
            <div className="avatar">{user.fullName.slice(0, 1)}</div>
            <div>
              <b>{user.fullName}</b>
              <small>{user.role}</small>
            </div>
            <button
              className="icon-button"
              title="ออกจากระบบ"
              onClick={onLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        {children}
      </main>
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label="ปิดเมนู"
        />
      )}
    </div>
  );
}
