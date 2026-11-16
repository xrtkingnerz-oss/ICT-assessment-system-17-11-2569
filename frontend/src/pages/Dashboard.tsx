/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ClipboardList,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import { chartColors as colors } from "../constants";
import type { Assessment } from "../types";
import PageHeader from "../components/PageHeader";
import { Empty, Status } from "../components/DataStates";

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/dashboard/summary"), api.get("/dashboard/charts")])
      .then(([s, c]) => {
        setSummary(s.data.data);
        setCharts(c.data.data);
      })
      .catch(() =>
        setError("ไม่สามารถโหลดข้อมูลได้ ตรวจสอบการเชื่อมต่อ Backend"),
      );
  }, []);
  if (error)
    return (
      <section className="content">
        <PageHeader title="ภาพรวม" />
        <div className="alert error">{error}</div>
      </section>
    );
  if (!summary)
    return (
      <div className="loading">
        <span className="spinner" />
        กำลังโหลดข้อมูลจริง…
      </div>
    );
  const stats = [
    [
      "แบบประเมินทั้งหมด",
      summary.assessments.total,
      "รายการ",
      ClipboardList,
      "blue",
    ],
    [
      "กำลังเผยแพร่",
      summary.assessments.published,
      "รายการ",
      Activity,
      "green",
    ],
    ["ผู้ตอบทั้งหมด", summary.responses.total, "คน", Users, "purple"],
    ["เจ้าหน้าที่", summary.staff, "บัญชี", ShieldCheck, "orange"],
  ];
  return (
    <section className="content">
      <PageHeader
        eyebrow="ศูนย์ ICT ขอนแก่น"
        title="ภาพรวมระบบ"
        subtitle="ติดตามสถานะแบบประเมินและการตอบกลับจากฐานข้อมูลจริง"
        action={
          <Link className="button primary" to="/assessments/new">
            <Plus size={17} />
            สร้างแบบประเมิน
          </Link>
        }
      />
      <div className="stat-grid">
        {stats.map(([label, value, unit, Icon, tone]: any) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}>
              <Icon size={19} />
            </div>
            <div className="stat-title">{label}</div>
            <div className="stat-value">
              {value}
              <small>{unit}</small>
            </div>
            <div className="stat-foot">
              <span className="dot" />
              อัปเดตจากฐานข้อมูล
            </div>
          </div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>แนวโน้มคำตอบ</h2>
              <p>จำนวนผู้ตอบรายวัน · 30 วันล่าสุด</p>
            </div>
            <span className="tag">LIVE DATA</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.daily || []}>
                <CartesianGrid stroke="#edf1f5" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13, fill: "#8592a3" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13, fill: "#8592a3" }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2876b8"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#2876b8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>ประเภทผู้ตอบ</h2>
              <p>สัดส่วนการตอบทั้งหมด</p>
            </div>
          </div>
          <div className="pie-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "ภายใน",
                      value: charts?.respondents?.internal || 0,
                    },
                    {
                      name: "ภายนอก",
                      value: charts?.respondents?.external || 0,
                    },
                  ]}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={92}
                  paddingAngle={5}
                >
                  {[0, 1].map((i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-center">
              <b>{summary.responses.total}</b>
              <small>คำตอบ</small>
            </div>
          </div>
          <div className="legend">
            <span>
              <i style={{ background: colors[0] }} />
              ภายใน <b>{summary.responses.internal}</b>
            </span>
            <span>
              <i style={{ background: colors[1] }} />
              ภายนอก <b>{summary.responses.external}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="panel recent">
        <div className="panel-head">
          <div>
            <h2>แบบประเมินล่าสุด</h2>
            <p>รายการที่สร้างในระบบ</p>
          </div>
          <Link to="/assessments">ดูทั้งหมด →</Link>
        </div>
        {summary.recent.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ชื่อแบบประเมิน</th>
                  <th>หมวดหมู่</th>
                  <th>สถานะ</th>
                  <th>คำตอบ</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent.map((a: Assessment) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.title}</b>
                    </td>
                    <td>{a.category || "—"}</td>
                    <td>
                      <Status value={a.status} />
                    </td>
                    <td>{a.responseCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="ยังไม่มีแบบประเมิน"
            text="สร้างแบบประเมินแรกเพื่อเริ่มเก็บข้อมูล"
          />
        )}
      </div>
    </section>
  );
}
