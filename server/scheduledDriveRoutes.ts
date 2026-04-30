/**
 * Scheduled Drive check endpoint
 *
 * POST /api/scheduled/drive-check
 *
 * Called by the hourly scheduled task to detect Drive changes and send notifications.
 * Requires a valid session cookie (role: user, admin, or coordonator).
 * The scheduled task platform auto-injects SCHEDULED_TASK_COOKIE.
 */
import type { Express } from "express";
import { sdk } from "./_core/sdk";
import {
  getAllEmployeeDriveFolders,
  getDriveSnapshots,
  upsertDriveSnapshot,
  markDriveSnapshotDeleted,
  createNotification,
  getAllUsers,
  getAppSetting,
} from "./db";
import {
  listFilesInFolder,
  findFolderByName,
  HUB_IC_ROOT_FOLDER_ID,
} from "./googleDrive";

const COMPANY_SUBFOLDERS = [
  "Regulament intern",
  "Viziune & Valori",
  "Procese & Proceduri",
  "Biblioteca tehnica",
];

async function runDriveCheck() {
  const rootFolderId =
    (await getAppSetting("drive_hub_ic_root_folder_id")) ?? HUB_IC_ROOT_FOLDER_ID;

  let totalNew = 0;
  let totalModified = 0;
  let totalDeleted = 0;

  // 1. Check company subfolders
  for (const subfolderName of COMPANY_SUBFOLDERS) {
    try {
      const subfolder = await findFolderByName(rootFolderId, subfolderName);
      if (!subfolder) continue;

      const currentFiles = await listFilesInFolder(subfolder.id);
      const snapshots = await getDriveSnapshots(subfolder.id);
      const snapshotMap = new Map(snapshots.map((s) => [s.fileId, s]));
      const currentIds = new Set(currentFiles.map((f) => f.id));

      for (const file of currentFiles) {
        const snap = snapshotMap.get(file.id);
        if (!snap) {
          totalNew++;
          await upsertDriveSnapshot({
            fileId: file.id,
            fileName: file.name,
            folderId: subfolder.id,
            folderType: "company",
            subfolderName,
            modifiedTime: file.modifiedTime,
            size: file.size,
            mimeType: file.mimeType,
          });
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({
              userId: user.id,
              type: "info",
              title: `Document nou in ${subfolderName}`,
              message: `A fost adaugat documentul "${file.name}" in ${subfolderName}.`,
              link: "/documente",
            });
          }
        } else if (
          snap.modifiedTime &&
          file.modifiedTime &&
          snap.modifiedTime !== file.modifiedTime
        ) {
          totalModified++;
          await upsertDriveSnapshot({
            fileId: file.id,
            fileName: file.name,
            folderId: subfolder.id,
            folderType: "company",
            subfolderName,
            modifiedTime: file.modifiedTime,
            size: file.size,
            mimeType: file.mimeType,
          });
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({
              userId: user.id,
              type: "info",
              title: `Document actualizat in ${subfolderName}`,
              message: `Documentul "${file.name}" din ${subfolderName} a fost actualizat.`,
              link: "/documente",
            });
          }
        }
      }

      for (const snap of snapshots) {
        if (!currentIds.has(snap.fileId)) {
          totalDeleted++;
          await markDriveSnapshotDeleted(snap.fileId);
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({
              userId: user.id,
              type: "warning",
              title: `Document sters din ${subfolderName}`,
              message: `Documentul "${snap.fileName}" a fost eliminat din ${subfolderName}.`,
              link: "/documente",
            });
          }
        }
      }
    } catch (err) {
      console.error(`[drive-check] Error checking subfolder ${subfolderName}:`, err);
    }
  }

  // 2. Check personal employee folders
  try {
    const allMappings = await getAllEmployeeDriveFolders();
    for (const mapping of allMappings) {
      try {
        const currentFiles = await listFilesInFolder(mapping.folderId);
        const snapshots = await getDriveSnapshots(mapping.folderId);
        const snapshotMap = new Map(snapshots.map((s) => [s.fileId, s]));
        const currentIds = new Set(currentFiles.map((f) => f.id));

        for (const file of currentFiles) {
          const snap = snapshotMap.get(file.id);
          if (!snap) {
            totalNew++;
            await upsertDriveSnapshot({
              fileId: file.id,
              fileName: file.name,
              folderId: mapping.folderId,
              folderType: "personal",
              ownerUserId: mapping.userId,
              modifiedTime: file.modifiedTime,
              size: file.size,
              mimeType: file.mimeType,
            });
            await createNotification({
              userId: mapping.userId,
              type: "info",
              title: "Document personal nou",
              message: `A fost adaugat documentul "${file.name}" in dosarul tau personal.`,
              link: "/documente",
            });
          } else if (
            snap.modifiedTime &&
            file.modifiedTime &&
            snap.modifiedTime !== file.modifiedTime
          ) {
            totalModified++;
            await upsertDriveSnapshot({
              fileId: file.id,
              fileName: file.name,
              folderId: mapping.folderId,
              folderType: "personal",
              ownerUserId: mapping.userId,
              modifiedTime: file.modifiedTime,
              size: file.size,
              mimeType: file.mimeType,
            });
            await createNotification({
              userId: mapping.userId,
              type: "info",
              title: "Document personal actualizat",
              message: `Documentul "${file.name}" din dosarul tau personal a fost actualizat.`,
              link: "/documente",
            });
          }
        }

        for (const snap of snapshots) {
          if (!currentIds.has(snap.fileId)) {
            totalDeleted++;
            await markDriveSnapshotDeleted(snap.fileId);
            await createNotification({
              userId: mapping.userId,
              type: "warning",
              title: "Document personal sters",
              message: `Documentul "${snap.fileName}" a fost eliminat din dosarul tau personal.`,
              link: "/documente",
            });
          }
        }
      } catch (err) {
        console.error(`[drive-check] Error checking personal folder for user ${mapping.userId}:`, err);
      }
    }
  } catch (err) {
    console.error("[drive-check] Error fetching employee mappings:", err);
  }

  return { success: true, totalNew, totalModified, totalDeleted };
}

export function registerScheduledDriveRoutes(app: Express) {
  app.post("/api/scheduled/drive-check", async (req, res) => {
    try {
      // Authenticate via session cookie (scheduled task injects SCHEDULED_TASK_COOKIE)
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      // Allow any authenticated user (scheduled task runs as "user" role)
      const result = await runDriveCheck();
      console.log(`[drive-check] Completed: ${result.totalNew} new, ${result.totalModified} modified, ${result.totalDeleted} deleted`);
      return res.json(result);
    } catch (err: any) {
      console.error("[drive-check] Fatal error:", err);
      return res.status(500).json({ error: err.message ?? "Internal server error" });
    }
  });
}
