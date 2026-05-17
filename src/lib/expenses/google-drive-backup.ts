import { Readable } from "node:stream";
import { google } from "googleapis";

import { getGoogleServiceAccountJwt } from "@/lib/expenses/google-service-account";

function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL?.trim() &&
      normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)?.trim() &&
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim(),
  );
}

function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
}

async function findChildFolderId(
  parentId: string,
  folderName: string,
): Promise<string | null> {
  const auth = getGoogleServiceAccountJwt();
  if (!auth) return null;
  const drive = google.drive({ version: "v3", auth });
  const escaped = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const { data } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: 5,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return data.files?.[0]?.id ?? null;
}

async function createFolder(parentId: string, name: string): Promise<string> {
  const auth = getGoogleServiceAccountJwt();
  if (!auth) throw new Error("Google Drive no configurado");
  const drive = google.drive({ version: "v3", auth });
  const { data } = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  const id = data.id;
  if (!id) throw new Error("No se pudo crear carpeta en Drive");
  return id;
}

/** Asegura/crea la carpeta `AAAA-MM` bajo la carpeta raíz del .env (Comprobantes). */
export async function ensureExpenseDriveFolderPath(
  expenseDateISO: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expenseId?: string,
): Promise<string> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim();
  if (!rootId) throw new Error("Falta GOOGLE_DRIVE_ROOT_FOLDER_ID");

  const d = expenseDateISO.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`Fecha de gasto inválida: ${expenseDateISO}`);
  }
  const monthFolder = d.slice(0, 7); // YYYY-MM

  const existing = await findChildFolderId(rootId, monthFolder);
  if (existing) return existing;
  return createFolder(rootId, monthFolder);
}

export type DriveUploadResult = {
  fileId: string;
  webViewLink: string;
};

export async function uploadBufferToGoogleDrive(opts: {
  parentFolderId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<DriveUploadResult> {
  const auth = getGoogleServiceAccountJwt();
  if (!auth) throw new Error("Google Drive no configurado");
  const drive = google.drive({ version: "v3", auth });
  const body = Readable.from(opts.buffer);

  const { data } = await drive.files.create({
    requestBody: {
      name: opts.filename,
      parents: [opts.parentFolderId],
    },
    media: {
      mimeType: opts.mimeType || "application/octet-stream",
      body,
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const fileId = data.id;
  if (!fileId) throw new Error("Drive no devolvió id de archivo");

  return {
    fileId,
    webViewLink: data.webViewLink ?? driveViewUrl(fileId),
  };
}
