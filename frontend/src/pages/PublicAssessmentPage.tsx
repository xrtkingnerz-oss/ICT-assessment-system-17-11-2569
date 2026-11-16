/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";

export default function PublicForm() {
  const { token = "" } = useParams();
  const [survey, setSurvey] = useState<any>();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    api
      .get(`/public/assessments/${token}`)
      .then((r) => setSurvey(r.data.data))
      .catch(() => setError("แบบประเมินนี้ไม่เปิดรับคำตอบหรือไม่พบลิงก์"));
  }, [token]);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const answers = survey.questions.map((q: any) => {
      const raw = f.get(`q-${q.id}`);
      return {
        questionId: q.id,
        text: q.type.includes("TEXT") ? String(raw || "") : undefined,
        number:
          ["RATING", "NUMBER"].includes(q.type) && raw !== null && raw !== ""
            ? Number(raw)
            : undefined,
        optionIds:
          q.type === "MULTIPLE_CHOICE"
            ? f.getAll(`q-${q.id}`).map(String)
            : q.type === "SINGLE_CHOICE" && raw
              ? [String(raw)]
              : [],
      };
    });
    try {
      await api.post(
        `/public/assessments/${token}/responses`,
        {
          respondentType: f.get("respondentType"),
          name: f.get("name") || null,
          email: f.get("email") || null,
          answers,
        },
        { headers: { "Idempotency-Key": crypto.randomUUID() } },
      );
      navigate("/success");
    } catch (x: any) {
      setError(x.response?.data?.error?.message || "ส่งคำตอบไม่สำเร็จ");
    }
  };
  if (error)
    return (
      <div className="public-page">
        <div className="public-card">
          <div className="brand-icon">
            <Activity />
          </div>
          <h1>ไม่สามารถเปิดแบบประเมิน</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  if (!survey)
    return (
      <div className="loading">
        <span className="spinner" />
        กำลังโหลดแบบประเมิน…
      </div>
    );
  return (
    <div className="public-page">
      <form className="public-form" onSubmit={submit}>
        <section className="public-form-card public-form-heading-card">
          <div className="public-brand">
            <div className="brand-icon">
              <Activity />
            </div>
            <span>ศูนย์ ICT ขอนแก่น</span>
          </div>
          <div className="eyebrow">แบบประเมินออนไลน์</div>
          <h1>{survey.title}</h1>
          <p>
            {survey.description ||
              "ความคิดเห็นของท่านมีส่วนสำคัญในการพัฒนาบริการ"}
          </p>
          <div className="public-required-note">
            <em>*</em> ระบุว่าเป็นคำถามที่จำเป็นต้องตอบ
          </div>
        </section>

        <section className="public-form-card respondent-card">
          <h2>ข้อมูลผู้ตอบแบบประเมิน</h2>
          <div className="public-fields">
            <label>
              ประเภทผู้ตอบ <em>*</em>
              <select name="respondentType" required>
                <option value="INTERNAL">บุคลากรภายใน</option>
                <option value="EXTERNAL">บุคคลภายนอก</option>
              </select>
            </label>
            <label>
              ชื่อ <small>(ไม่บังคับ)</small>
              <input name="name" placeholder="ไม่ระบุชื่อได้" />
            </label>
            <label>
              อีเมล <small>(ไม่บังคับ)</small>
              <input name="email" type="email" placeholder="name@example.com" />
            </label>
          </div>
        </section>
        {survey.questions.map((q: any, i: number) => (
          <section className="public-form-card public-question" key={q.id}>
            <label>
              <b>
                {i + 1}. {q.text}
              </b>
              {q.required && <em> *</em>}
            </label>
            {q.type === "SHORT_TEXT" ? (
              <input name={`q-${q.id}`} required={q.required} />
            ) : q.type === "LONG_TEXT" ? (
              <textarea name={`q-${q.id}`} rows={4} required={q.required} />
            ) : q.type === "RATING" ? (
              <>
                <div className="rating-options">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={n}
                        required={q.required}
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
                <div className="rating-scale-caption">
                  <span>น้อยที่สุด</span>
                  <span>มากที่สุด</span>
                </div>
              </>
            ) : q.type === "NUMBER" ? (
              <input name={`q-${q.id}`} type="number" required={q.required} />
            ) : (
              <div className="choice-list">
                {q.options.map((o: any) => (
                  <label key={o.id}>
                    <input
                      type={q.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                      name={`q-${q.id}`}
                      value={o.id}
                      required={q.required && q.type === "SINGLE_CHOICE"}
                    />
                    <span>{o.text}</span>
                  </label>
                ))}
              </div>
            )}
          </section>
        ))}
        <section className="public-form-footer-card">
          {error && <div className="alert error">{error}</div>}
          <button className="button primary">ส่งคำตอบ</button>
          <small className="privacy-note">
            <ShieldCheck size={15} />
            ระบบใช้ข้อมูลเพื่อการประเมินและรักษาความเป็นส่วนตัว
          </small>
        </section>
      </form>
    </div>
  );
}
