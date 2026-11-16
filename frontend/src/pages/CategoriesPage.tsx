/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { FolderKanban, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { showSuccessToast } from "../lib/notifications";
import type { Category, User } from "../types";
import PageHeader from "../components/PageHeader";

export default function CategoriesPage({ user }: { user: User }) {
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const canManageCategories = user.role === "ADMIN";
  const filteredItems = items.filter((category) => {
    const matchesSearch = `${category.name} ${category.description || ""}`
      .toLocaleLowerCase("th")
      .includes(search.trim().toLocaleLowerCase("th"));
    const assessmentCount = category._count?.assessments || 0;
    const matchesUsage =
      usageFilter === "ALL" ||
      (usageFilter === "USED" && assessmentCount > 0) ||
      (usageFilter === "UNUSED" && assessmentCount === 0);
    return matchesSearch && matchesUsage;
  });

  const load = async () => {
    try {
      const response = await api.get("/categories");
      setItems(response.data.data);
    } catch (error: any) {
      setMessage(
        error.response?.data?.error?.message || "โหลดหมวดหมู่ไม่สำเร็จ",
      );
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  function openCreateModal() {
    setEditingCategory(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormError("");
    setModalOpen(true);
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageCategories || isSaving) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    if (!name) {
      setMessage("กรุณากรอกชื่อหมวดหมู่");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const payload = {
        name,
        description: description || null,
      };
      if (editingCategory) {
        const response = await api.put(
          `/categories/${editingCategory.id}`,
          payload,
        );
        const updated = response.data.data as Category;
        setItems((current) =>
          current
            .map((category) =>
              category.id === updated.id
                ? { ...category, ...updated }
                : category,
            )
            .sort((a, b) => a.name.localeCompare(b.name, "th")),
        );
        setMessage("บันทึกการแก้ไขหมวดหมู่แล้ว");
      } else {
        const response = await api.post("/categories", payload);
        const created = response.data.data as Category;
        setItems((current) =>
          [...current, { ...created, _count: { assessments: 0 } }].sort(
            (a, b) => a.name.localeCompare(b.name, "th"),
          ),
        );
        setMessage("เพิ่มหมวดหมู่แล้ว");
      }
      setMessageType("success");
      setModalOpen(false);
      showSuccessToast(
        editingCategory
          ? "บันทึกการแก้ไขหมวดหมู่แล้ว"
          : "เพิ่มหมวดหมู่เรียบร้อยแล้ว",
      );
    } catch (error: any) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.error?.message;
      setFormError(
        status === 401
          ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง"
          : status === 403
            ? "บัญชีนี้ไม่มีสิทธิ์เพิ่มหมวดหมู่ กรุณาเข้าสู่ระบบด้วยบัญชี Admin"
            : status === 409
              ? serverMessage || "หมวดหมู่นี้มีอยู่แล้ว"
              : !error.response
                ? "เชื่อมต่อระบบไม่ได้ กรุณาตรวจว่า backend กำลังทำงานอยู่"
                : serverMessage || "เพิ่มหมวดหมู่ไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`ลบหมวดหมู่ “${category.name}” หรือไม่?`)) return;
    try {
      await api.delete(`/categories/${category.id}`);
      setItems((current) => current.filter((item) => item.id !== category.id));
      setMessage(`ลบหมวดหมู่ “${category.name}” แล้ว`);
      setMessageType("success");
      showSuccessToast(`ลบหมวดหมู่ “${category.name}” เรียบร้อยแล้ว`);
    } catch (error: any) {
      setMessage(error.response?.data?.error?.message || "ลบหมวดหมู่ไม่สำเร็จ");
      setMessageType("error");
    }
  }

  return (
    <section className="content">
      <PageHeader
        title="หมวดหมู่"
        subtitle="จัดกลุ่มแบบประเมินให้ค้นหาและรายงานได้ง่าย"
        action={
          canManageCategories ? (
            <button className="button primary" onClick={openCreateModal}>
              <Plus size={17} /> เพิ่มหมวดหมู่
            </button>
          ) : undefined
        }
      />
      <div className="panel form-panel">
        {!canManageCategories && (
          <div className="alert info">
            หน้านี้ใช้จัดการหมวดหมู่ ผู้ดูแลระบบ (Admin)
            เท่านั้นที่เพิ่มหรือแก้ไขได้
          </div>
        )}
        <div className="user-toolbar category-toolbar">
          <label className="searchbox">
            <Search size={18} />
            <input
              placeholder="ค้นหาชื่อหรือคำอธิบายหมวดหมู่"
              aria-label="ค้นหาหมวดหมู่"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="กรองตามการใช้งานหมวดหมู่"
            value={usageFilter}
            onChange={(event) => setUsageFilter(event.target.value)}
          >
            <option value="ALL">ทุกหมวดหมู่</option>
            <option value="USED">มีแบบประเมิน</option>
            <option value="UNUSED">ยังไม่มีแบบประเมิน</option>
          </select>
          <span className="user-result-count">
            แสดง {filteredItems.length} จาก {items.length} หมวดหมู่
          </span>
        </div>
        {message && (
          <div
            className={`alert ${messageType}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}
        <div className="table-wrap">
          <table className="category-table">
            <thead>
              <tr>
                <th>ชื่อหมวดหมู่</th>
                <th>คำอธิบาย</th>
                <th>แบบประเมิน</th>
                {canManageCategories && <th>จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={canManageCategories ? 4 : 3}
                    className="users-state-cell"
                  >
                    กำลังโหลดหมวดหมู่…
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="category-name-cell">
                        <span className="category-symbol">
                          <FolderKanban size={17} />
                        </span>
                        <b>{c.name}</b>
                      </div>
                    </td>
                    <td className="category-description">
                      {c.description || "—"}
                    </td>
                    <td>{c._count?.assessments || 0} รายการ</td>
                    {canManageCategories && (
                      <td>
                        <div className="user-actions">
                          <button
                            className="icon-action"
                            title="แก้ไขหมวดหมู่"
                            aria-label={`แก้ไขหมวดหมู่ ${c.name}`}
                            onClick={() => openEditModal(c)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-action danger"
                            title="ลบหมวดหมู่"
                            aria-label={`ลบหมวดหมู่ ${c.name}`}
                            onClick={() => void deleteCategory(c)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canManageCategories ? 4 : 3}
                    className="users-state-cell"
                  >
                    {search ? "ไม่พบหมวดหมู่ตามคำค้น" : "ยังไม่มีหมวดหมู่"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving)
              setModalOpen(false);
          }}
        >
          <section
            className="user-modal category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div className="modal-heading">
              <div>
                <div className="eyebrow">CATEGORY MANAGEMENT</div>
                <h2 id="category-modal-title">
                  {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
                </h2>
              </div>
              <button
                className="icon-action"
                type="button"
                aria-label="ปิดหน้าต่าง"
                disabled={isSaving}
                onClick={() => setModalOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <form
              key={editingCategory?.id || "new-category"}
              className="user-form"
              onSubmit={saveCategory}
            >
              <label>
                ชื่อหมวดหมู่
                <input
                  name="name"
                  required
                  maxLength={150}
                  defaultValue={editingCategory?.name || ""}
                  placeholder="เช่น การให้บริการและสิ่งอำนวยความสะดวก"
                  autoFocus
                  disabled={isSaving}
                />
              </label>
              <label>
                คำอธิบาย
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={editingCategory?.description || ""}
                  placeholder="ระบุรายละเอียดเพิ่มเติม (ไม่บังคับ)"
                  disabled={isSaving}
                />
              </label>
              {formError && <div className="alert error">{formError}</div>}
              <div className="modal-actions">
                <button
                  className="button outline"
                  type="button"
                  disabled={isSaving}
                  onClick={() => setModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  className="button primary"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "กำลังบันทึก…"
                    : editingCategory
                      ? "บันทึกการแก้ไข"
                      : "เพิ่มหมวดหมู่"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
