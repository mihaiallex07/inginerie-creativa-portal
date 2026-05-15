/**
 * Secure Google Drive file proxy routes
 *
 * GET /api/drive/file/:fileId   — personal files (requires auth + ownership check)
 * GET /api/drive/public/:fileId — company-wide files (requires auth only, no ownership check)
 *
 * Security model for personal files:
 *  1. User must have a valid session cookie
 *  2. The requested fileId must be a direct child of the user's mapped Drive folder
 *  3. If either check fails → 403 Forbidden
 *
 * Security model for public files:
 *  1. User must have a valid session cookie
 *  2. The requested fileId must be a direct child of the HUB IC root folder or one of its
 *     known public subfolders (Regulament intern, Viziune & Valori, etc.)
 *  3. This prevents anyone from using this endpoint to proxy arbitrary Drive files
 */

import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getEmployeeDriveFolder } from "./db";
import {
  downloadFileStream,
  isFileInFolder,
  HUB_IC_ROOT_FOLDER_ID,
  findFolderByName,
} from "./googleDrive";

/** Sanitize a fileId to only allow valid Drive file ID characters */
function isValidFileId(id: string): boolean {
  return /^[a-zA-Z0-9_\-]{10,100}$/.test(id);
}

export function registerDriveProxyRoutes(app: Express) {
  /**
   * Personal file proxy — requires auth + ownership
   */
  app.get("/api/drive/file/:fileId", async (req: Request, res: Response) => {
    try {
      // 1. Authenticate
      const user = await sdk.authenticateRequest(req);

      // 2. Validate fileId format
      const { fileId } = req.params;
      if (!isValidFileId(fileId)) {
        res.status(400).json({ error: "Invalid file ID" });
        return;
      }

      // 3. Check ownership — file must be in user's mapped folder
      const mapping = await getEmployeeDriveFolder(user.id);
      if (!mapping) {
        res.status(403).json({ error: "No Drive folder mapped for your account. Contact administrator." });
        return;
      }

      const inFolder = await isFileInFolder(fileId, mapping.folderId);
      if (!inFolder) {
        res.status(403).json({ error: "Access denied: file does not belong to your folder." });
        return;
      }

      // 4. Stream file from Drive
      const { stream, mimeType, name, size } = await downloadFileStream(fileId);

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(name)}"`
      );
      if (size) res.setHeader("Content-Length", size);
      // Prevent caching of sensitive personal documents
      res.setHeader("Cache-Control", "private, no-store");

      stream.pipe(res);
    } catch (err: any) {
      if (err?.message?.includes("Invalid session") || err?.message?.includes("Forbidden")) {
        res.status(401).json({ error: "Authentication required" });
      } else {
        console.error("[DriveProxy] Error serving personal file:", err);
        res.status(500).json({ error: "Failed to retrieve file" });
      }
    }
  });

  /**
   * Public (company-wide) file proxy — requires auth, no ownership check
   * File must be inside HUB IC root or one of its direct subfolders
   */
  app.get("/api/drive/public/:fileId", async (req: Request, res: Response) => {
    try {
      // 1. Authenticate (must be a logged-in employee)
      await sdk.authenticateRequest(req);

      // 2. Validate fileId format
      const { fileId } = req.params;
      if (!isValidFileId(fileId)) {
        res.status(400).json({ error: "Invalid file ID" });
        return;
      }

      // 3. Verify file is inside HUB IC root (direct child) or inside a known subfolder
      // First check direct child of root
      let allowed = await isFileInFolder(fileId, HUB_IC_ROOT_FOLDER_ID);

      // If not direct child, check if it's inside any direct subfolder of HUB IC root
      if (!allowed) {
        // We check the file's actual parent against known public subfolders
        // by looking up the file metadata and checking its parent is a child of HUB IC root
        const { getFileMetadata } = await import("./googleDrive");
        const meta = await getFileMetadata(fileId);
        if (meta && meta.parents.length > 0) {
          for (const parentId of meta.parents) {
            const parentInRoot = await isFileInFolder(parentId, HUB_IC_ROOT_FOLDER_ID);
            if (parentInRoot) {
              allowed = true;
              break;
            }
          }
        }
      }

      if (!allowed) {
        res.status(403).json({ error: "Access denied: file is not in HUB IC." });
        return;
      }

      // 4. Stream file from Drive
      const { stream, mimeType, name, size } = await downloadFileStream(fileId);

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(name)}"`
      );
      if (size) res.setHeader("Content-Length", size);
      // Allow short caching for public company documents
      res.setHeader("Cache-Control", "private, max-age=300");

      stream.pipe(res);
    } catch (err: any) {
      if (err?.message?.includes("Invalid session") || err?.message?.includes("Forbidden")) {
        res.status(401).json({ error: "Authentication required" });
      } else {
        console.error("[DriveProxy] Error serving public file:", err);
        res.status(500).json({ error: "Failed to retrieve file" });
      }
    }
  });
}
