import "./styles.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";

// TODO: reemplazar por el dominio real antes de distribuir el launcher.
const BASE_URL = "https://app.tudominio.com";

const appWindow = getCurrentWindow();

const loginForm = document.querySelector<HTMLFormElement>("#login-form")!;
const loginError = document.querySelector<HTMLParagraphElement>("#login-error")!;
const accountScreen = document.querySelector<HTMLDivElement>("#account-screen")!;
const accountName = document.querySelector<HTMLHeadingElement>("#account-name")!;
const accountPlan = document.querySelector<HTMLParagraphElement>("#account-plan")!;
const downloadBtn = document.querySelector<HTMLButtonElement>("#download-btn")!;
const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;
const closeBtn = document.querySelector<HTMLButtonElement>("#close-btn")!;

const PLAN_LABEL: Record<string, string> = {
  free: "Plan gratis",
  class_a: "Clase A",
  class_b: "Clase B",
  class_c: "Clase C",
};

function currentPlatform(): "windows" | "macos" {
  return navigator.platform.toLowerCase().includes("mac") ? "macos" : "windows";
}

function showAccount(name: string, plan: string) {
  loginForm.hidden = true;
  accountScreen.hidden = false;
  accountName.textContent = `Hola, ${name}`;
  accountPlan.textContent = PLAN_LABEL[plan] ?? plan;
}

function showLogin() {
  accountScreen.hidden = true;
  loginForm.hidden = false;
}

async function tryRestoreSession() {
  const token = localStorage.getItem("doit_token");
  if (!token) return;
  try {
    const res = await fetch(`${BASE_URL}/api/me.php`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("invalid session");
    const data = await res.json();
    showAccount(data.name, data.plan);
  } catch {
    localStorage.removeItem("doit_token");
    showLogin();
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = (document.querySelector<HTMLInputElement>("#email")!).value;
  const password = (document.querySelector<HTMLInputElement>("#password")!).value;

  try {
    const res = await fetch(`${BASE_URL}/api/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error ?? "No se pudo iniciar sesión.";
      loginError.hidden = false;
      return;
    }
    localStorage.setItem("doit_token", data.token);
    showAccount(data.name, data.plan);
  } catch {
    loginError.textContent = "No se pudo conectar con la web de doit.";
    loginError.hidden = false;
  }
});

downloadBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("doit_token");
  if (!token) return;
  const platform = currentPlatform();
  await openUrl(`${BASE_URL}/api/download.php?platform=${platform}&token=${token}`);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("doit_token");
  showLogin();
});

closeBtn.addEventListener("click", () => appWindow.close());

tryRestoreSession();
