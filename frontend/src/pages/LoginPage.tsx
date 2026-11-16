/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../lib/api";

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const r = await api.post("/auth/login", values);
      sessionStorage.setItem("ict-token", r.data.data.token);
      navigate("/");
    } catch (e: any) {
      setError(
        e.response?.data?.error?.message ||
          "เข้าสู่ระบบไม่สำเร็จ ตรวจสอบ Backend และบัญชี",
      );
    }
  });
  return (
    <div className="login-page">
      <div className="login-aside">
        <div className="brand light">
          <div className="brand-icon">
            <Activity />
          </div>
          <div>
            <b>ICT Assessment</b>
            <small>ศูนย์ ICT ขอนแก่น</small>
          </div>
        </div>
        <div className="login-message">
          <span className="eyebrow">ICT KHON KAEN</span>
          <h1>
            เสียงของคุณ
            <br />
            ขับเคลื่อนบริการ
            <br />
            <em>ให้ดียิ่งขึ้น</em>
          </h1>
          <p>
            ระบบประเมินออนไลน์และวิเคราะห์ผล
            <br />
            เพื่อการพัฒนาบริการอย่างต่อเนื่อง
          </p>
          <div className="login-decoration">
            <div />
            <div />
            <div />
          </div>
        </div>
        <small className="copyright">© 2026 ศูนย์ ICT ขอนแก่น</small>
      </div>
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-symbol">
            <ShieldCheck />
          </div>
          <div className="eyebrow">WELCOME BACK</div>
          <h2>เข้าสู่ระบบ</h2>
          <p>กรุณาใช้บัญชีเจ้าหน้าที่เพื่อดำเนินการต่อ</p>
          <form onSubmit={submit}>
            <label>
              อีเมล
              <input
                {...register("email")}
                type="email"
                placeholder="name@organization.go.th"
                autoComplete="username"
              />
              {errors.email && (
                <small className="field-error">{errors.email.message}</small>
              )}
            </label>
            <label>
              รหัสผ่าน
              <input
                {...register("password")}
                type="password"
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
              />
              {errors.password && (
                <small className="field-error">{errors.password.message}</small>
              )}
            </label>
            {error && <div className="alert error">{error}</div>}
            <button className="button primary full" disabled={isSubmitting}>
              {isSubmitting ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>
          <div className="login-help">บัญชีผู้ใช้จัดการโดยผู้ดูแลระบบ</div>
          <div className="public-link">
            ผู้ตอบแบบประเมินสามารถเปิดผ่าน QR Code โดยไม่ต้องเข้าสู่ระบบ
          </div>
        </div>
      </div>
    </div>
  );
}
