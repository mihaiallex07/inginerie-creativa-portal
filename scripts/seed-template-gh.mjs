import mysql2 from 'mysql2/promise';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// 1. Update F: "Social Media (pe proiect)" → rename to "Execuție" tasks are fine, but F needs correct tasks
// Actually F is "Social Media (pe proiect)" with only 1 task "Creare conținut" - add the rest
const fPhaseId = 30006;
await conn.query(`DELETE FROM template_tasks WHERE templatePhaseId = ?`, [fPhaseId]);
const fTasks = [
  'Creare conținut',
  'Editare foto/video', 
  'Planificare postări',
  'Publicare',
  'Campanii ads',
  'Analiză performanță',
];
for (let i = 0; i < fTasks.length; i++) {
  await conn.query(
    `INSERT INTO template_tasks (templatePhaseId, name, displayOrder) VALUES (?, ?, ?)`,
    [fPhaseId, fTasks[i], i + 1]
  );
}
console.log(`Updated F (Social Media) with ${fTasks.length} tasks`);

// 2. Add G: "Social Media" (new standalone phase - this is actually the renamed F)
// Wait - user said F is "Social Media (pe proiect)" with tasks above, and G is new "Social Media" 
// Re-reading: user wants F to stay as "Social Media" with the 6 tasks listed, 
// and G = new "Social Media" with same tasks? No - user listed:
// F. Social Media (pe proiect) - Creare conținut (already exists, just 1 task)
// G. Social Media - Creare conținut, Editare foto/video, Planificare postări, Publicare, Campanii ads, Analiză performanță
// H. Administrativ - ...
// So F stays as "Social Media (pe proiect)" with 1 task "Creare conținut"
// G is "Social Media" with 6 tasks
// H is "Administrativ" with 6 tasks

// Restore F to just 1 task
await conn.query(`DELETE FROM template_tasks WHERE templatePhaseId = ?`, [fPhaseId]);
await conn.query(
  `INSERT INTO template_tasks (templatePhaseId, name, displayOrder) VALUES (?, ?, ?)`,
  [fPhaseId, 'Creare conținut', 1]
);
console.log('Restored F (Social Media pe proiect) with 1 task');

// 3. Add G: Social Media
const [gResult] = await conn.query(
  `INSERT INTO template_phases (templateId, name, code, displayOrder, color) VALUES (1, 'Social Media', 'G', 7, '#EC4899')`,
);
const gPhaseId = gResult.insertId;
const gTasks = [
  'Creare conținut',
  'Editare foto/video',
  'Planificare postări',
  'Publicare',
  'Campanii ads',
  'Analiză performanță',
];
for (let i = 0; i < gTasks.length; i++) {
  await conn.query(
    `INSERT INTO template_tasks (templatePhaseId, name, displayOrder) VALUES (?, ?, ?)`,
    [gPhaseId, gTasks[i], i + 1]
  );
}
console.log(`Added G (Social Media) with ${gTasks.length} tasks, id=${gPhaseId}`);

// 4. Add H: Administrativ
const [hResult] = await conn.query(
  `INSERT INTO template_phases (templateId, name, code, displayOrder, color) VALUES (1, 'Administrativ', 'H', 8, '#6B7280')`,
);
const hPhaseId = hResult.insertId;
const hTasks = [
  'Comunicare pe mail',
  'Achiziții administrative',
  'Contabilitate',
  'Arhivare documente',
  'IT intern',
  'Management contracte',
];
for (let i = 0; i < hTasks.length; i++) {
  await conn.query(
    `INSERT INTO template_tasks (templatePhaseId, name, displayOrder) VALUES (?, ?, ?)`,
    [hPhaseId, hTasks[i], i + 1]
  );
}
console.log(`Added H (Administrativ) with ${hTasks.length} tasks, id=${hPhaseId}`);

await conn.end();
console.log('Done!');
