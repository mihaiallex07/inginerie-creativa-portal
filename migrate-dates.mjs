import mysql from 'mysql2/promise';

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await conn.execute('ALTER TABLE projects ADD COLUMN startDate DATE NULL AFTER coordinatorId');
    console.log('startDate added');
  } catch(e) { console.log('startDate:', e.message); }
  try {
    await conn.execute('ALTER TABLE projects ADD COLUMN endDate DATE NULL AFTER startDate');
    console.log('endDate added');
  } catch(e) { console.log('endDate:', e.message); }
  const [rows] = await conn.execute('DESCRIBE projects');
  console.log(rows.map(r => r.Field).join(', '));
  await conn.end();
}
run();
