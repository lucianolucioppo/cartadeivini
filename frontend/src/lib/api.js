import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

const NO_RETRY = ["/auth/login", "/auth/refresh", "/auth/logout"];
let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const skip = NO_RETRY.some((p) => original?.url?.includes(p));
    if (error.response?.status === 401 && original && !original._retry && !skip) {
      original._retry = true;
      refreshing = refreshing || api.post("/auth/refresh").finally(() => { refreshing = null; });
      try {
        await refreshing;
        return api(original);
      } catch (e) {
        window.dispatchEvent(new Event("auth:expired"));
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Si è verificato un errore. Riprova.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  }
  if (typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const fileUrl = (path) => (path ? `${API}/files/${path}` : null);
export const publicFotoUrl = (id) => `${API}/public/foto/${id}`;
export const PUBLIC_CARTA_PATH = "/carta-digitale";

const euroFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
export const euro = (v) => (v == null || v === "" ? "—" : euroFmt.format(v));

export async function downloadFile(url, fallbackName) {
  const res = await api.get(url, { responseType: "blob" });
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = match ? match[1] : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
