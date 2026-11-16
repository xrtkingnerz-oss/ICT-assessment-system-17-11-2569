/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { showSuccessToast } from "../lib/notifications";
import type { Assessment } from "../types";
import PageHeader from "../components/PageHeader";
import { Empty, Status } from "../components/DataStates";

export default function AssessmentList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Assessment[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/assessments", { params: { search } })
      .then((r) => setItems(r.data.data.items))
      .catch(() => setError("โหลดรายการไม่สำเร็จ"));
  }, [search]);
  return (
    <section className="content">
      <PageHeader
        title="แบบประเมิน"
        subtitle="สร้าง จัดการ และติดตามแบบประเมินของหน่วยงาน"
        action={
          <Link className="button primary" to="/assessments/new">
            <Plus size={17} />
            สร้างแบบประเมิน
          </Link>
        }
      />
      <div className="assessment-guide">
        <b>เริ่มทำแบบประเมินสำหรับทดสอบ</b>
        <span>
          สร้างแบบประเมินใหม่ → เพิ่มคำถาม → เผยแพร่ → เปิดลิงก์หรือสแกน QR
          เพื่อลองตอบ
        </span>
        <small>
          แบบประเมินที่เผยแพร่แล้วหรือมีคำตอบ จะล็อกการแก้ไขเพื่อรักษาข้อมูลเดิม
          ใช้ “ทำสำเนา” เพื่อสร้างฉบับร่างสำหรับแก้ไขหรือทดสอบ
        </small>
      </div>
      <div className="toolbar">
        <label className="searchbox">
          <Search size={17} />
          <input
            placeholder="ค้นหาชื่อแบบประเมิน"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <span className="muted">{items.length} รายการ</span>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>แบบประเมิน</th>
              <th>หมวดหมู่</th>
              <th>สถานะ</th>
              <th>ผู้ตอบ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link className="table-link" to={`/assessments/${a.id}`}>
                    {a.title}
                  </Link>
                  <small className="table-sub">
                    กลุ่มเป้าหมาย {a.targetGroup}
                  </small>
                </td>
                <td>{a.category || "—"}</td>
                <td>
                  <Status value={a.status} />
                </td>
                <td>{a.responseCount || 0}</td>
                <td>
                  <div className="assessment-actions">
                    <Link className="text-action" to={`/assessments/${a.id}`}>
                      เปิด →
                    </Link>
                    <button
                      className="text-action-button"
                      onClick={async () => {
                        try {
                          const response = await api.post(
                            `/assessments/${a.id}/duplicate`,
                          );
                          showSuccessToast("ทำสำเนาแบบประเมินเรียบร้อยแล้ว");
                          navigate(`/assessments/${response.data.data.id}`);
                        } catch (error: any) {
                          setError(
                            error.response?.data?.error?.message ||
                              "ทำสำเนาแบบประเมินไม่สำเร็จ",
                          );
                        }
                      }}
                    >
                      ทำสำเนา
                    </button>
                    <button
                      className="icon-action danger"
                      title={
                        a.responseCount
                          ? "ลบไม่ได้ เนื่องจากแบบประเมินมีคำตอบแล้ว"
                          : "ลบแบบประเมิน"
                      }
                      aria-label={`ลบแบบประเมิน ${a.title}`}
                      disabled={Boolean(a.responseCount)}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `ลบแบบประเมิน “${a.title}” หรือไม่? การลบไม่สามารถย้อนกลับได้`,
                          )
                        )
                          return;
                        try {
                          await api.delete(`/assessments/${a.id}`);
                          setItems((current) =>
                            current.filter((item) => item.id !== a.id),
                          );
                          showSuccessToast("ลบแบบประเมินเรียบร้อยแล้ว");
                        } catch (deleteError: any) {
                          setError(
                            deleteError.response?.data?.error?.message ||
                              "ลบแบบประเมินไม่สำเร็จ",
                          );
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <Empty
            title="ไม่พบแบบประเมิน"
            text="ลองค้นหาด้วยคำอื่น หรือสร้างแบบประเมินใหม่"
          />
        )}
      </div>
    </section>
  );
}
