const SUCCESS_TOAST_EVENT = "ict:success-toast";
export function showSuccessToast(message: string) {
  window.dispatchEvent(
    new CustomEvent(SUCCESS_TOAST_EVENT, { detail: { message } }),
  );
}
export { SUCCESS_TOAST_EVENT };
