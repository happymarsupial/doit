import * as vscode from "vscode";
import * as http from "http";

const API_BASE = "http://127.0.0.1:47821";

interface ProjectSummary {
  id: string;
  name: string;
  clientName: string;
}

let statusBarItem: vscode.StatusBarItem;
let timerInterval: ReturnType<typeof setInterval> | undefined;
let timerStart: number | undefined;
let activeProject: ProjectSummary | undefined;

function apiRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `${API_BASE}${path}`,
      {
        method,
        headers: data
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
          : undefined,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(raw ? (JSON.parse(raw) as T) : (undefined as T));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`doit respondió ${res.statusCode}: ${raw}`));
          }
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function updateStatusBar() {
  if (!timerStart || !activeProject) {
    statusBarItem.text = "$(clock) doit";
    statusBarItem.tooltip = "Iniciar cronómetro de doit";
    statusBarItem.command = "doit.startTimer";
    return;
  }
  const elapsed = Date.now() - timerStart;
  statusBarItem.text = `$(debug-stop) ${formatElapsed(elapsed)} · ${activeProject.name}`;
  statusBarItem.tooltip = `Parar cronómetro (${activeProject.clientName})`;
  statusBarItem.command = "doit.stopTimer";
}

async function startTimer() {
  if (timerStart) {
    vscode.window.showInformationMessage("Ya hay un cronómetro corriendo. Parálo antes de iniciar otro.");
    return;
  }

  let projects: ProjectSummary[];
  try {
    projects = await apiRequest<ProjectSummary[]>("/api/projects", "GET");
  } catch {
    vscode.window.showErrorMessage("No se pudo conectar con doit. ¿Está abierto?");
    return;
  }
  if (projects.length === 0) {
    vscode.window.showWarningMessage("No hay proyectos activos en Freelance dentro de doit.");
    return;
  }

  const pick = await vscode.window.showQuickPick(
    projects.map((p) => ({ label: p.name, description: p.clientName, project: p })),
    { placeHolder: "Elegí un proyecto" },
  );
  if (!pick) return;

  activeProject = pick.project;
  timerStart = Date.now();
  timerInterval = setInterval(updateStatusBar, 1000);
  updateStatusBar();
  statusBarItem.show();
}

async function stopTimer() {
  if (!timerStart || !activeProject) return;

  const elapsedMs = Date.now() - timerStart;
  const hours = Math.round((elapsedMs / 3_600_000) * 100) / 100;
  const project = activeProject;

  clearInterval(timerInterval);
  timerStart = undefined;
  activeProject = undefined;
  updateStatusBar();

  if (hours < 0.01) return;

  const description = await vscode.window.showInputBox({
    prompt: `Registrar ${hours}h en "${project.name}". Descripción (opcional)`,
  });

  try {
    await apiRequest("/api/time-entries", "POST", {
      projectId: project.id,
      entryDate: new Date().toISOString().slice(0, 10),
      hours,
      description: description || undefined,
    });
    vscode.window.showInformationMessage(`Se registraron ${hours}h en ${project.name}.`);
  } catch {
    vscode.window.showErrorMessage(
      `No se pudo guardar en doit (¿se cerró la app?). No perdiste el dato: trabajaste ${hours}h en ${project.name}.`,
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  updateStatusBar();
  statusBarItem.show();

  context.subscriptions.push(
    statusBarItem,
    vscode.commands.registerCommand("doit.startTimer", startTimer),
    vscode.commands.registerCommand("doit.stopTimer", stopTimer),
  );
}

export function deactivate() {
  if (timerInterval) clearInterval(timerInterval);
}
