import { google } from "googleapis";

// Root folder ID for "HUB IC" in Google Drive
export const HUB_IC_ROOT_FOLDER_ID = "1OL49nEvwiwRwPmrTWJUqJpAoUhB3dwRZ";

function getDriveClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  previewUrl: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

/**
 * List files (non-folders) in a given Drive folder
 */
export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime, size)",
    orderBy: "name",
  });

  const files = response.data.files ?? [];
  return files.map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    modifiedTime: f.modifiedTime ?? null,
    size: f.size ?? null,
    previewUrl: `https://drive.google.com/file/d/${f.id}/preview`,
  }));
}

/**
 * List subfolders inside a given Drive folder
 */
export async function listSubfolders(folderId: string): Promise<DriveFolder[]> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name",
  });

  const folders = response.data.files ?? [];
  return folders.map((f) => ({
    id: f.id!,
    name: f.name!,
  }));
}

/**
 * Find a subfolder by name inside a parent folder
 */
export async function findFolderByName(
  parentFolderId: string,
  name: string
): Promise<DriveFolder | null> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and trashed = false`,
    fields: "files(id, name)",
  });

  const folders = response.data.files ?? [];
  if (folders.length === 0) return null;
  return { id: folders[0].id!, name: folders[0].name! };
}

/**
 * Get the "Angajați" subfolder ID inside HUB IC root
 */
export async function getAngajatiFolder(): Promise<DriveFolder | null> {
  return findFolderByName(HUB_IC_ROOT_FOLDER_ID, "Angajați");
}

/**
 * Download a file from Drive as a readable stream (for server-side proxy)
 */
export async function downloadFileStream(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
  name: string;
  size: string | null;
}> {
  const drive = getDriveClient();

  // Get file metadata first
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size",
  });

  const mimeType = meta.data.mimeType ?? "application/octet-stream";
  const name = meta.data.name ?? "document";
  const size = meta.data.size ?? null;

  // For Google Docs/Sheets/Slides, export as PDF
  if (mimeType.startsWith("application/vnd.google-apps.")) {
    const exportRes = await drive.files.export(
      { fileId, mimeType: "application/pdf" },
      { responseType: "stream" }
    );
    return { stream: exportRes.data as NodeJS.ReadableStream, mimeType: "application/pdf", name: name + ".pdf", size: null };
  }

  // For regular files, download directly
  const dlRes = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return { stream: dlRes.data as NodeJS.ReadableStream, mimeType, name, size };
}

/**
 * Get file metadata (to verify file exists and belongs to a folder)
 */
export async function getFileMetadata(fileId: string): Promise<{
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
} | null> {
  try {
    const drive = getDriveClient();
    const res = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, parents",
    });
    return {
      id: res.data.id!,
      name: res.data.name!,
      mimeType: res.data.mimeType!,
      parents: res.data.parents ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Check if a file is inside a given folder (direct parent check)
 */
export async function isFileInFolder(fileId: string, folderId: string): Promise<boolean> {
  const meta = await getFileMetadata(fileId);
  if (!meta) return false;
  return meta.parents.includes(folderId);
}

/**
 * Test Drive connectivity — returns true if root folder is accessible
 */
export async function testDriveConnection(): Promise<boolean> {
  try {
    const drive = getDriveClient();
    await drive.files.get({
      fileId: HUB_IC_ROOT_FOLDER_ID,
      fields: "id, name",
    });
    return true;
  } catch {
    return false;
  }
}
