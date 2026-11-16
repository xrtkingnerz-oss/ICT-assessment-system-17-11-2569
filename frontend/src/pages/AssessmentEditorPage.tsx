/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { ArrowDownToLine, ClipboardList, Plus } from "lucide-react";
import { api } from "../lib/api";
import { showSuccessToast } from "../lib/notifications";
import type { Assessment, Category, Question } from "../types";
import PageHeader from "../components/PageHeader";
import { Status } from "../components/DataStates";

export default function AssessmentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [message, setMessage] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const isLocked = Boolean(
    assessment &&
    (assessment.status !== "DRAFT" || (assessment.responseCount || 0) > 0),
  );
  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data.data));
    if (id)
      api
        .get(`/assessments/${id}`)
        .then((r) => {
          setAssessment(r.data.data);
          setQuestions(r.data.data.questions || []);
          if (r.data.data.publicToken) {
            setQrUrl(
              `${window.location.origin}/assessment/${r.data.data.publicToken}`,
            );
          }
        })
        .catch(() => setMessage("เปิดแบบประเมินไม่สำเร็จ"));
  }, [id]);
  const duplicateAssessment = async () => {
    if (!assessment) return;
    setIsDuplicating(true);
    try {
      const response = await api.post(
        `/assessments/${assessment.id}/duplicate`,
      );
      showSuccessToast("ทำสำเนาแบบประเมินเรียบร้อยแล้ว");
      navigate(`/assessments/${response.data.data.id}`);
    } catch (error: any) {
      setMessage(
        error.response?.data?.error?.message || "ทำสำเนาแบบประเมินไม่สำเร็จ",
      );
    } finally {
      setIsDuplicating(false);
    }
  };
  const saveAssessment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title"),
      description: fd.get("description"),
      categoryId: fd.get("categoryId"),
      targetGroup: fd.get("targetGroup"),
    };
    try {
      const r = id
        ? await api.put(`/assessments/${id}`, body)
        : await api.post("/assessments", body);
      setAssessment(r.data.data);
      setMessage("บันทึกข้อมูลแบบประเมินแล้ว");
      showSuccessToast("บันทึกข้อมูลแบบประเมินเรียบร้อยแล้ว");
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || "บันทึกไม่สำเร็จ");
    }
  };
  const addQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assessment) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const type = String(fd.get("questionType"));
    const options = String(fd.get("options") || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((optionText, index) => ({ optionText, score: index + 1 }));
    try {
      const r = await api.post(`/assessments/${assessment.id}/questions`, {
        questionText: fd.get("questionText"),
        questionType: type,
        isRequired: fd.get("required") === "on",
        sortOrder: questions.length,
        options,
      });
      const q = r.data.data;
      setQuestions([
        ...questions,
        {
          id: q.id,
          questionText: q.question_text,
          questionType: q.question_type,
          isRequired: q.is_required,
          options: q.question_options.map((o: any) => ({
            id: o.id,
            optionText: o.option_text,
            score: o.score,
          })),
        },
      ]);
      form.reset();
      showSuccessToast("เพิ่มคำถามเรียบร้อยแล้ว");
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || "เพิ่มคำถามไม่สำเร็จ");
    }
  };
  const publish = async () => {
    try {
      const r = await api.post(`/assessments/${assessment?.id}/publish`);
      setAssessment({
        ...assessment!,
        status: "PUBLISHED",
        publicToken: r.data.data.public_token,
      });
      setQrUrl(r.data.data.publicUrl);
      setMessage("เผยแพร่แบบประเมินแล้ว");
      showSuccessToast("เผยแพร่แบบประเมินเรียบร้อยแล้ว");
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || "เผยแพร่ไม่สำเร็จ");
    }
  };
  const downloadQr = () => {
    const svg = document.querySelector("#public-qr svg") as SVGElement | null;
    if (!svg) return;
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml",
      }),
    );
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 640;
      canvas.getContext("2d")?.drawImage(img, 0, 0, 640, 640);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(png);
        a.download = "assessment-qr.png";
        a.click();
        URL.revokeObjectURL(a.href);
        URL.revokeObjectURL(url);
      });
    };
    img.src = url;
  };
  return (
    <section className="content">
      <PageHeader
        title={id ? "แก้ไขแบบประเมิน" : "สร้างแบบประเมิน"}
        subtitle="1. บันทึกรายละเอียด  2. เพิ่มคำถาม  3. เผยแพร่เพื่อรับคำตอบ"
        action={
          <button
            className="button outline"
            onClick={() => navigate("/assessments")}
          >
            กลับรายการ
          </button>
        }
      />
      {message && <div className="alert info">{message}</div>}
      {isLocked && assessment && (
        <div className="assessment-lock-notice">
          <div>
            <b>
              แบบประเมินนี้
              {assessment.status === "PUBLISHED"
                ? "เผยแพร่แล้ว"
                : "ปิดรับคำตอบแล้ว"}
              {assessment.responseCount
                ? ` และมีคำตอบ ${assessment.responseCount} รายการ`
                : ""}
            </b>
            <span>
              ระบบล็อกการแก้ไขเพื่อรักษาคำถามและข้อมูลคำตอบเดิม
              ทำสำเนาเป็นฉบับร่างหากต้องการแก้ไขหรือใช้ทดสอบ
            </span>
          </div>
          <button
            className="button primary"
            onClick={() => void duplicateAssessment()}
            disabled={isDuplicating}
          >
            <ClipboardList size={16} />
            {isDuplicating ? "กำลังทำสำเนา…" : "ทำสำเนาเป็นฉบับร่าง"}
          </button>
        </div>
      )}
      <div className="editor-grid">
        <div className="panel form-panel">
          <h2>รายละเอียดแบบประเมิน</h2>
          <form
            key={assessment?.id || "new-assessment"}
            onSubmit={saveAssessment}
            className="form-grid"
          >
            <label>
              ชื่อแบบประเมิน
              <input
                name="title"
                required
                disabled={isLocked}
                defaultValue={assessment?.title}
              />
            </label>
            <label>
              หมวดหมู่
              <select
                name="categoryId"
                required
                disabled={isLocked}
                defaultValue={assessment?.categoryId || ""}
              >
                <option value="" disabled>
                  เลือกหมวดหมู่
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              กลุ่มเป้าหมาย
              <select
                name="targetGroup"
                disabled={isLocked}
                defaultValue={assessment?.targetGroup || "BOTH"}
              >
                <option value="BOTH">ภายในและภายนอก</option>
                <option value="INTERNAL">ภายใน</option>
                <option value="EXTERNAL">ภายนอก</option>
              </select>
            </label>
            <label className="span-2">
              คำอธิบาย
              <textarea
                name="description"
                rows={3}
                disabled={isLocked}
                defaultValue={(assessment as any)?.description || ""}
              />
            </label>
            <div className="span-2">
              <button className="button primary" disabled={isLocked}>
                บันทึกรายละเอียด
              </button>
              {assessment && (
                <span className="inline-status">
                  <Status value={assessment.status} />
                </span>
              )}
            </div>
          </form>
        </div>
        {assessment && (
          <div className="panel form-panel">
            <h2>{isLocked ? "คำถามในแบบประเมิน" : "เพิ่มคำถาม"}</h2>
            {!isLocked && (
              <form onSubmit={addQuestion} className="form-grid">
                <label className="span-2">
                  ข้อความคำถาม
                  <input
                    name="questionText"
                    required
                    placeholder="เช่น ท่านพึงพอใจต่อการให้บริการเพียงใด"
                  />
                </label>
                <label>
                  ประเภทคำถาม
                  <select name="questionType">
                    <option value="RATING">คะแนน 1–5</option>
                    <option value="SINGLE_CHOICE">เลือกหนึ่งข้อ</option>
                    <option value="MULTIPLE_CHOICE">เลือกได้หลายข้อ</option>
                    <option value="SHORT_TEXT">ข้อความสั้น</option>
                    <option value="LONG_TEXT">ข้อความยาว</option>
                    <option value="NUMBER">ตัวเลข</option>
                  </select>
                </label>
                <label className="check-label">
                  <input name="required" type="checkbox" /> จำเป็นต้องตอบ
                </label>
                <label className="span-2">
                  ตัวเลือก{" "}
                  <small>(หนึ่งรายการต่อบรรทัด สำหรับคำถามแบบเลือก)</small>
                  <textarea
                    name="options"
                    rows={3}
                    placeholder={"ดีมาก\nปานกลาง\nน้อย"}
                  />
                </label>
                <button className="button secondary">
                  <Plus size={16} />
                  เพิ่มคำถาม
                </button>
              </form>
            )}
            <div className="question-list">
              {questions.map((q, i) => (
                <div className="question-row" key={q.id}>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  <span>
                    {q.questionText}
                    <small>
                      {q.questionType} {q.isRequired ? "· จำเป็น" : ""}
                    </small>
                  </span>
                  {!isLocked && (
                    <button
                      className="quiet"
                      onClick={async () => {
                        try {
                          await api.delete(`/questions/${q.id}`);
                          setQuestions(questions.filter((_, n) => n !== i));
                          showSuccessToast("ลบคำถามเรียบร้อยแล้ว");
                        } catch (e: any) {
                          setMessage(
                            e.response?.data?.error?.message ||
                              "ลบคำถามไม่สำเร็จ",
                          );
                        }
                      }}
                    >
                      ลบ
                    </button>
                  )}
                </div>
              ))}
            </div>
            {assessment.status === "DRAFT" && (
              <button
                className="button primary full"
                disabled={!questions.length}
                onClick={publish}
              >
                เผยแพร่แบบประเมิน
              </button>
            )}
          </div>
        )}
        {qrUrl && (
          <div className="panel qr-panel">
            <div id="public-qr">
              <QRCode value={qrUrl} size={160} />
            </div>
            <h2>แบบประเมินพร้อมตอบ</h2>
            <p>{qrUrl}</p>
            <div className="button-row">
              <button
                className="button outline"
                onClick={() => navigator.clipboard.writeText(qrUrl)}
              >
                คัดลอกลิงก์
              </button>
              <button className="button primary" onClick={downloadQr}>
                <ArrowDownToLine size={16} />
                ดาวน์โหลด PNG
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
