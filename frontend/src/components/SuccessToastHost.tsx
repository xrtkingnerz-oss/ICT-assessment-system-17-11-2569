import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { SUCCESS_TOAST_EVENT } from "../lib/notifications";

export default function SuccessToastHost() {
  const [message, setMessage] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;
    let removeTimeout: ReturnType<typeof setTimeout> | undefined;
    const handleSuccess = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message || "บันทึกข้อมูลเรียบร้อยแล้ว");
      setIsLeaving(false);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (removeTimeout) clearTimeout(removeTimeout);
      hideTimeout = setTimeout(() => setIsLeaving(true), 320);
      removeTimeout = setTimeout(() => setMessage(""), 440);
    };

    window.addEventListener(SUCCESS_TOAST_EVENT, handleSuccess);
    return () => {
      window.removeEventListener(SUCCESS_TOAST_EVENT, handleSuccess);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (removeTimeout) clearTimeout(removeTimeout);
    };
  }, []);

  if (!message) return null;
  return (
    <div
      className={`success-toast-layer${isLeaving ? " is-leaving" : ""}`}
      role="presentation"
    >
      <div
        className={`success-toast${isLeaving ? " is-leaving" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="success-toast-icon">
          <Check size={25} strokeWidth={3} />
        </span>
        <strong>ทำรายการเสร็จสิ้น</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}
