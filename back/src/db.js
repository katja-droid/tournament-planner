import { JSONFilePreset } from 'lowdb/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'db.json');
await fs.mkdir(path.dirname(dbPath), { recursive: true });

const defaultData = {
  users: [],
  tournaments: [],
  matches: [],
  optimizationRuns: [],
};

export const db = await JSONFilePreset(dbPath, defaultData);

function ensureSeedUser(email, name, password, role) {
  const existing = db.data.users.find((user) => user.email === email);
  if (existing) {
    return false;
  }

  db.data.users.push({
    id: nanoid(),
    email,
    name,
    role,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  });
  return true;
}

const seededAdmin = ensureSeedUser('admin@demo.local', 'Admin', 'Admin123!', 'admin');
const seededParticipant = ensureSeedUser('participant@demo.local', 'Participant', 'Participant123!', 'participant');
const meaningfulParticipants = [
  ['anna.nowak@demo.local', 'Anna Nowak'],
  ['jan.kowalski@demo.local', 'Jan Kowalski'],
  ['piotr.zielinski@demo.local', 'Piotr Zielinski'],
  ['maria.wisniewska@demo.local', 'Maria Wisniewska'],
  ['tomasz.kaczmarek@demo.local', 'Tomasz Kaczmarek'],
  ['karolina.mazur@demo.local', 'Karolina Mazur'],
  ['lukasz.wojcik@demo.local', 'Lukasz Wojcik'],
  ['ewa.krupa@demo.local', 'Ewa Krupa'],
];
const seededMeaningful = meaningfulParticipants
  .map(([email, name]) => ensureSeedUser(email, name, 'Participant123!', 'participant'))
  .some(Boolean);

if (seededAdmin || seededParticipant || seededMeaningful) {
  await db.write();
}
