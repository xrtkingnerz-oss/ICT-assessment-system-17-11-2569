/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import { showSuccessToast } from "../lib/notifications";
import type { User } from "../types";
import PageHeader from "../components/PageHeader";

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [formError, setFormError] = useState("");
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get("/users", {
        params: {
          search,
          page,
          pageSize,
          ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
      })
      .then((response) => {
        if (cancelled) return;
        setItems(response.data.data.items);
        setTotal(response.data.data.total);
      })
      .catch((error: any) => {
        if (!cancelled) {
          setMessageType("error");
          setMessage(
            error.response?.data?.error?.message || "โหลดผู้ใช้งานไม่ได้",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, roleFilter, statusFilter, page, refreshKey]);

  function openCreateModal() {
    setEditingUser(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormError("");
    setModalOpen(true);
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "").trim();
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      role: String(formData.get("role")) as User["role"],
      isActive: formData.get("isActive") === "on",
      ...(password ? { password } : {}),
    };

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        setMessage("บันทึกการแก้ไขผู้ใช้แล้ว");
      } else {
        await api.post("/users", payload);
        setMessage("เพิ่มบัญชีผู้ใช้แล้ว");
        setPage(1);
      }
      setMessageType("success");
      setModalOpen(false);
      setRefreshKey((value) => value + 1);
      showSuccessToast(
        editingUser ? "บันทึกการแก้ไขผู้ใช้แล้ว" : "เพิ่มบัญชีผู้ใช้แล้ว",
      );
    } catch (error: any) {
      setFormError(
        error.response?.data?.error?.message || "บันทึกข้อมูลไม่สำเร็จ",
      );
    }
  }

  async function toggleUserStatus(user: User) {
    const nextStatus = !user.isActive;
    const action = nextStatus ? "เปิดใช้งาน" : "ระงับ";
    if (!window.confirm(`ยืนยัน${action}บัญชี ${user.fullName} หรือไม่?`))
      return;

    try {
      await api.patch(`/users/${user.id}/status`, { isActive: nextStatus });
      setMessage(`เปลี่ยนสถานะบัญชี ${user.fullName} แล้ว`);
      setMessageType("success");
      setRefreshKey((value) => value + 1);
      showSuccessToast(`เปลี่ยนสถานะบัญชี ${user.fullName} เรียบร้อยแล้ว`);
    } catch (error: any) {
      setMessageType("error");
      setMessage(
        error.response?.data?.error?.message || "เปลี่ยนสถานะบัญชีไม่สำเร็จ",
      );
    }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`ลบบัญชี ${user.fullName} อย่างถาวรหรือไม่?`)) return;

    try {
      await api.delete(`/users/${user.id}`);
      setMessage(`ลบบัญชี ${user.fullName} แล้ว`);
      setMessageType("success");
      showSuccessToast(`ลบบัญชี ${user.fullName} เรียบร้อยแล้ว`);
      if (items.length === 1 && page > 1) setPage((value) => value - 1);
      else setRefreshKey((value) => value + 1);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error.response?.data?.error?.message || "ลบบัญชีไม่สำเร็จ");
    }
  }

  return (
    <section className="content">
      <PageHeader
        title="ผู้ใช้งาน"
        subtitle="เพิ่ม แก้ไขสิทธิ์ และจัดการสถานะบัญชีผู้ใช้งานระบบ"
        action={
          <button className="button primary" onClick={openCreateModal}>
            <Plus size={16} /> เพิ่มผู้ใช้งาน
          </button>
        }
      />
      <div className="panel form-panel">
        <div className="user-toolbar">
          <label className="searchbox">
            <Search size={17} />
            <input
              placeholder="ค้นหาชื่อหรืออีเมล"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="กรองตามสิทธิ์"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">ทุกสิทธิ์</option>
            <option value="ADMIN">ผู้ดูแลระบบ</option>
            <option value="STAFF">เจ้าหน้าที่</option>
          </select>
          <select
            aria-label="กรองตามสถานะ"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ระงับ</option>
          </select>
          <span className="user-result-count">ทั้งหมด {total} บัญชี</span>
        </div>
        {message && (
          <div
            className={`alert ${messageType === "error" ? "error" : "info"}`}
          >
            {message}
          </div>
        )}
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สิทธิ์</th>
                <th>สถานะ</th>
                <th>วันที่เพิ่ม</th>
                <th>อัปเดตล่าสุด</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="users-state-cell">
                    กำลังโหลดรายชื่อผู้ใช้งาน…
                  </td>
                </tr>
              ) : items.length ? (
                items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-name-cell">
                        <span className="avatar">
                          {user.fullName.slice(0, 1)}
                        </span>
                        <b>{user.fullName}</b>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-label ${user.role.toLowerCase()}`}>
                        {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`user-state ${user.isActive ? "active" : "inactive"}`}
                      >
                        <i /> {user.isActive ? "ใช้งาน" : "ระงับ"}
                      </span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Intl.DateTimeFormat("th-TH", {
                            dateStyle: "medium",
                          }).format(new Date(user.createdAt))
                        : "—"}
                    </td>
                    <td>
                      {user.updatedAt
                        ? new Intl.DateTimeFormat("th-TH", {
                            dateStyle: "medium",
                          }).format(new Date(user.updatedAt))
                        : "—"}
                    </td>
                    <td>
                      <div className="user-actions">
                        <button
                          className="icon-action"
                          title="แก้ไขข้อมูลและรหัสผ่าน"
                          aria-label={`แก้ไข ${user.fullName}`}
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-action"
                          title={
                            user.isActive ? "ระงับบัญชี" : "เปิดใช้งานบัญชี"
                          }
                          aria-label={`${user.isActive ? "ระงับ" : "เปิดใช้งาน"} ${user.fullName}`}
                          onClick={() => void toggleUserStatus(user)}
                        >
                          {user.isActive ? (
                            <ShieldOff size={15} />
                          ) : (
                            <ShieldCheck size={15} />
                          )}
                        </button>
                        <button
                          className="icon-action danger"
                          title="ลบบัญชี"
                          aria-label={`ลบ ${user.fullName}`}
                          onClick={() => void deleteUser(user)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="users-state-cell">
                    ไม่พบผู้ใช้งานตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <span>
            หน้า {page} จาก {pageCount}
          </span>
          <div>
            <button
              className="button outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              ก่อนหน้า
            </button>
            <button
              className="button outline"
              disabled={page >= pageCount || isLoading}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <section
            className="user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >
            <div className="modal-heading">
              <div>
                <div className="eyebrow">USER MANAGEMENT</div>
                <h2 id="user-modal-title">
                  {editingUser ? "แก้ไขบัญชีผู้ใช้" : "เพิ่มผู้ใช้งาน"}
                </h2>
              </div>
              <button
                className="icon-action"
                aria-label="ปิดหน้าต่าง"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form
              key={editingUser?.id || "new-user"}
              className="user-form"
              onSubmit={saveUser}
            >
              <label>
                ชื่อ-นามสกุล
                <input
                  name="fullName"
                  required
                  minLength={2}
                  maxLength={150}
                  defaultValue={editingUser?.fullName || ""}
                  autoFocus
                />
              </label>
              <label>
                อีเมล
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={150}
                  defaultValue={editingUser?.email || ""}
                />
              </label>
              <label>
                สิทธิ์การใช้งาน
                <select name="role" defaultValue={editingUser?.role || "STAFF"}>
                  <option value="STAFF">เจ้าหน้าที่ (Staff)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </label>
              <label>
                {editingUser
                  ? "ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)"
                  : "รหัสผ่านเริ่มต้น"}
                <input
                  name="password"
                  type="password"
                  minLength={10}
                  required={!editingUser}
                  autoComplete="new-password"
                  placeholder={
                    editingUser
                      ? "อย่างน้อย 10 ตัวอักษร"
                      : "อย่างน้อย 10 ตัวอักษร"
                  }
                />
              </label>
              <label className="user-active-toggle">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editingUser?.isActive ?? true}
                />
                เปิดใช้งานบัญชี
              </label>
              {formError && <div className="alert error">{formError}</div>}
              <div className="modal-actions">
                <button
                  className="button outline"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button className="button primary" type="submit">
                  {editingUser ? "บันทึกการแก้ไข" : "สร้างบัญชี"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
