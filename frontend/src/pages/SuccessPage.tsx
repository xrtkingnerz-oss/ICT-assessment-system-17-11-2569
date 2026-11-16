import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div className="public-page">
      <div className="public-card success-card">
        <div className="success-check">✓</div>
        <div className="eyebrow">SUBMISSION COMPLETE</div>
        <h1>ขอบคุณสำหรับความคิดเห็น</h1>
        <p>
          ระบบบันทึกคำตอบของท่านเรียบร้อยแล้ว
          ข้อมูลของท่านช่วยให้เราพัฒนาบริการได้ดียิ่งขึ้น
        </p>
        <Link className="button outline" to="/login">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
