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
