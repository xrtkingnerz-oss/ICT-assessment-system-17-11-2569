/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { api } from "../lib/api";
import { showSuccessToast } from "../lib/notifications";
import type { User } from "../types";
import PageHeader from "../components/PageHeader";

export default function ProfilePage({ user }: { user: User }) {
  const [message, setMessage] = useState("");
  return (
    <section className="content">
      <PageHeader
        title="บัญชีของฉัน"
        subtitle="ข้อมูลผู้ใช้งานและความปลอดภัย"
      />
      <div className="panel form-panel narrow">
        <h2>{user.fullName}</h2>
        <p className="muted">
          {user.email} · {user.role}
        </p>
        <h3>เปลี่ยนรหัสผ่าน</h3>
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api.put("/auth/change-password", {
                currentPassword: f.get("currentPassword"),
                newPassword: f.get("newPassword"),
              });
              setMessage("เปลี่ยนรหัสผ่านแล้ว");
              showSuccessToast("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
            } catch (x: any) {
              setMessage(
                x.response?.data?.error?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ",
              );
            }
          }}
        >
          <label className="span-2">
            รหัสผ่านปัจจุบัน
            <input name="currentPassword" type="password" required />
          </label>
          <label className="span-2">
            รหัสผ่านใหม่
            <input name="newPassword" type="password" minLength={10} required />
          </label>
          <button className="button primary">บันทึกรหัสผ่าน</button>
        </form>
        {message && <div className="alert info">{message}</div>}
      </div>
    </section>
  );
}
