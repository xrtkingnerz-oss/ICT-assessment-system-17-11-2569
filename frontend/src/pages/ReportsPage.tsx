/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  FileDown,
  Printer,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "../lib/api";
import type { Assessment } from "../types";
import PageHeader from "../components/PageHeader";

export default function ReportsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState<any>();
  const [reportError, setReportError] = useState("");
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const selectedAssessment = items.find(
    (assessment) => assessment.id === selected,
  );

  useEffect(() => {
    api.get("/assessments").then((r) => setItems(r.data.data.items));
  }, []);

  useEffect(() => {
    setData(undefined);
    setReportError("");
    if (!selected) {
      setIsLoadingReport(false);
      return;
    }

    let cancelled = false;
    setIsLoadingReport(true);
    api
      .get(`/reports/assessments/${selected}`)
      .then((r) => {
        if (!cancelled) setData(r.data.data);
      })
      .catch((error) => {
        if (!cancelled) {
          setReportError(
            error.response?.data?.error?.message || "โหลดรายงานไม่สำเร็จ",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingReport(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function exportCsv() {
    try {
      const response = await api.get(
        `/reports/assessments/${selected}/export`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `assessment-report-${selected}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      setReportError(
        error.response?.data?.error?.message || "ส่งออก CSV ไม่สำเร็จ",
      );
    }
  }

  function printReport() {
    const previousTitle = document.title;
    const title = (selectedAssessment?.title || "assessment-report")
      .replace(/[\\/:*?"<>|]/g, "-")
      .trim();
    document.title = `รายงานผล-${title}`;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  }

  return (
    <section className="content">
      <PageHeader
        title="รายงานผล"
        subtitle="สรุปคำตอบและคะแนนจากข้อมูลจริง"
        action={
          selected && data ? (
            <div className="report-header-actions">
              <button
                className="button outline"
                onClick={() => void exportCsv()}
              >
                <ArrowDownToLine size={17} /> ส่งออก CSV
              </button>
              <button className="button outline" onClick={printReport}>
                <Printer size={17} /> พิมพ์รายงาน
              </button>
              <button className="button primary" onClick={printReport}>
                <FileDown size={17} /> ส่งออก PDF
              </button>
            </div>
          ) : undefined
        }
      />
      <div className="panel form-panel report-panel">
        <div className="report-controls">
          <label>
            เลือกแบบประเมิน
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">เลือกแบบประเมิน</option>
              {items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {reportError && <div className="alert error">{reportError}</div>}
        {isLoadingReport && (
          <div className="loading report-loading">
            <span className="spinner" /> กำลังจัดทำรายงาน…
          </div>
        )}
        {data && (
          <div className="report-print-area">
            <h2 className="report-print-title">{data.assessment.title}</h2>
            <div className="stat-grid report-stat-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <Users size={18} />
                </div>
                <div className="stat-title">ผู้ตอบทั้งหมด</div>
                <div className="stat-value">
                  {data.summary.total}
                  <small>คน</small>
                </div>
                <div className="stat-foot">จำนวนคำตอบของแบบประเมินนี้</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">
                  <ShieldCheck size={18} />
                </div>
                <div className="stat-title">ผู้ตอบภายใน</div>
                <div className="stat-value">
                  {data.summary.internal}
                  <small>คน</small>
                </div>
                <div className="stat-foot">บุคลากรภายในหน่วยงาน</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">
                  <Users size={18} />
                </div>
                <div className="stat-title">ผู้ตอบภายนอก</div>
                <div className="stat-value">
                  {data.summary.external}
                  <small>คน</small>
                </div>
                <div className="stat-foot">ผู้รับบริการภายนอก</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">
                  <Activity size={18} />
                </div>
                <div className="stat-title">คะแนนเฉลี่ย</div>
                <div className="stat-value">
                  {data.summary.average == null
                    ? "—"
                    : data.summary.average.toFixed(2)}
                  <small>/ 5</small>
                </div>
                <div className="stat-foot">คำนวณจากคำถามแบบให้คะแนน</div>
              </div>
            </div>
            <div className="table-wrap report-question-table">
              <table>
                <thead>
                  <tr>
                    <th>คำถาม</th>
                    <th>ประเภท</th>
                    <th>คะแนนเฉลี่ย</th>
                    <th>ตัวเลือก/คำตอบ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.questions.length ? (
                    data.questions.map((question: any) => (
                      <tr key={question.id}>
                        <td>{question.question}</td>
                        <td>{question.type}</td>
                        <td>
                          {question.average == null
                            ? "—"
                            : question.average.toFixed(2)}
                        </td>
                        <td>
                          {Object.entries(question.options)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" · ") ||
                            question.texts.slice(0, 3).join(" · ") ||
                            "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="users-state-cell">
                        ยังไม่มีคำตอบสำหรับแบบประเมินนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
