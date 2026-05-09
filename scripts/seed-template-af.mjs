// Seed script: replaces old A-H template phases with correct A-F phases + tasks
import mysql from 'mysql2/promise';

const TEMPLATE_ID = 1;

const PHASES = [
  {
    code: "A",
    name: "Contractare / Administrativ pe proiect",
    color: "#3B82F6",
    order: 1,
    tasks: [
      "Cunoaștere beneficiar",
      "Discuții prezentare concept / design&build / contract concept",
      "Deviz estimativ",
      "Prezentare deviz estimativ către beneficiar",
      "Elaborare contract",
      "Facturi",
      "Verificare ore",
      "Comunicare pe mail",
      "Comunicare cu beneficiarul",
      "Livrare",
    ],
  },
  {
    code: "B",
    name: "Proiectare Structură",
    color: "#A855F7",
    order: 2,
    tasks: [
      "Temă de proiectare",
      "Modelare 3D Draft 1",
      "Calcul structural",
      "Modelare",
      "Modelare 3D Draft 2",
      "Verificare de către coordonator",
      "Implementare feedback de la coordonator",
      "Prezentare model 3D",
      "Implementare feedback după prezentarea către beneficiar",
      "Redactare",
      "Piese desenate (modelator)",
      "Piese scrise (coordonator)",
      "Liste de cantități",
      "Livrare electronică (coordonator)",
    ],
  },
  {
    code: "C",
    name: "Proiectare Arhitectură",
    color: "#22C55E",
    order: 3,
    tasks: [
      "Temă de proiectare",
      "Modelare 3D Draft 1",
      "Modelare 3D Draft 2",
      "Verificare de către coordonator",
      "Implementare feedback de la coordonator",
      "Prezentare model 3D",
      "Implementare feedback după prezentarea către beneficiar",
      "Redactare",
      "Piese desenate (modelator)",
      "Piese scrise (coordonator)",
      "Liste de cantități",
      "Livrare electronică (coordonator)",
    ],
  },
  {
    code: "D",
    name: "Proiectare Instalații",
    color: "#F97316",
    order: 4,
    tasks: [
      "Temă de proiectare",
      "Modelare 3D Draft 1",
      "Modelare 3D Draft 2",
      "Verificare",
      "Implementare feedback",
      "Prezentare model 3D",
      "Implementare feedback după prezentarea către beneficiar",
      "Redactare",
      "Piese desenate",
      "Piese scrise",
      "Liste de cantități",
      "Livrare electronică",
    ],
  },
  {
    code: "E",
    name: "Execuție",
    color: "#EF4444",
    order: 5,
    tasks: [
      "Deviz",
      "Achiziții",
      "Planificare",
      "Urmărire șantier",
      "Rapoarte",
      "Predare",
    ],
  },
  {
    code: "F",
    name: "Social Media (pe proiect)",
    color: "#EC4899",
    order: 6,
    tasks: [
      "Creare conținut",
    ],
  },
];

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Delete old template tasks and phases
  // Delete tasks via phase join first
  const [oldPhases] = await conn.query('SELECT id FROM template_phases WHERE templateId = ?', [TEMPLATE_ID]);
  for (const p of oldPhases) {
    await conn.query('DELETE FROM template_tasks WHERE templatePhaseId = ?', [p.id]);
  }
  await conn.query('DELETE FROM template_phases WHERE templateId = ?', [TEMPLATE_ID]);
  console.log('Deleted old phases and tasks');

  // Insert new phases and tasks
  for (const phase of PHASES) {
    const [result] = await conn.query(
      'INSERT INTO template_phases (templateId, name, code, color, displayOrder) VALUES (?, ?, ?, ?, ?)',
      [TEMPLATE_ID, phase.name, phase.code, phase.color, phase.order]
    );
    const phaseId = result.insertId;
    console.log(`Created phase ${phase.code}: ${phase.name} (id=${phaseId})`);

    for (let i = 0; i < phase.tasks.length; i++) {
      await conn.query(
        'INSERT INTO template_tasks (templatePhaseId, name, displayOrder) VALUES (?, ?, ?)',
        [phaseId, phase.tasks[i], i + 1]
      );
    }
    console.log(`  → ${phase.tasks.length} tasks inserted`);
  }

  console.log('\n✓ Template seeded successfully with A-F phases');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await conn.end();
}
