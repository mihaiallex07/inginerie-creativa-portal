import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

await conn.execute(`
  CREATE TABLE IF NOT EXISTS \`drive_file_snapshots\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`fileId\` varchar(256) NOT NULL,
    \`fileName\` varchar(512) NOT NULL,
    \`folderId\` varchar(256) NOT NULL,
    \`folderType\` varchar(32) NOT NULL DEFAULT 'company',
    \`ownerUserId\` int,
    \`subfolderName\` varchar(256),
    \`modifiedTime\` varchar(64),
    \`size\` varchar(32),
    \`mimeType\` varchar(128),
    \`deletedAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`drive_file_snapshots_id\` PRIMARY KEY(\`id\`)
  )
`);

console.log("Migration applied: drive_file_snapshots table created.");
await conn.end();
