import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { Business } from '../types';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'leads.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dedupe_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    email_source TEXT,
    email_status TEXT,
    website TEXT,
    facebook_url TEXT,
    rating REAL,
    reviews INTEGER,
    lat REAL,
    lon REAL,
    source TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    contacted_at TEXT
  )
`);

// Purani DB files (status/notes columns se pehle banayi hui) ke liye migration
for (const stmt of [
  "ALTER TABLE leads ADD COLUMN status TEXT NOT NULL DEFAULT 'new'",
  'ALTER TABLE leads ADD COLUMN notes TEXT',
  'ALTER TABLE leads ADD COLUMN contacted_at TEXT',
  'ALTER TABLE leads ADD COLUMN email_status TEXT',
]) {
  try {
    db.exec(stmt);
  } catch {
    // column already exists, ignore
  }
}

export type LeadStatus = 'new' | 'contacted' | 'replied' | 'converted' | 'not_interested';

export interface StoredBusiness extends Business {
  id: number;
  isNew: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  status: LeadStatus;
  notes: string | null;
  contactedAt: string | null;
}

function buildDedupeKey(b: Business, city: string): string {
  const digits = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
  if (digits.length >= 8) return `phone:${digits}`;
  return `name:${b.name.trim().toLowerCase()}|city:${city.trim().toLowerCase()}`;
}

function rowToBusiness(row: any): StoredBusiness {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    emailSource: row.email_source,
    emailStatus: row.email_status,
    website: row.website,
    facebookUrl: row.facebook_url,
    rating: row.rating,
    reviews: row.reviews,
    lat: row.lat,
    lon: row.lon,
    source: row.source,
    isNew: false,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    status: row.status || 'new',
    notes: row.notes,
    contactedAt: row.contacted_at,
  };
}

const findStmt = db.prepare('SELECT * FROM leads WHERE dedupe_key = ?');

const insertStmt = db.prepare(`
  INSERT INTO leads
    (dedupe_key, name, type, city, address, phone, whatsapp, email, email_source, email_status, website, facebook_url, rating, reviews, lat, lon, source, first_seen_at, last_seen_at)
  VALUES
    (@dedupeKey, @name, @type, @city, @address, @phone, @whatsapp, @email, @emailSource, @emailStatus, @website, @facebookUrl, @rating, @reviews, @lat, @lon, @source, @firstSeenAt, @lastSeenAt)
`);

const updateStmt = db.prepare(`
  UPDATE leads SET
    address = @address,
    phone = COALESCE(@phone, phone),
    whatsapp = COALESCE(@whatsapp, whatsapp),
    email = COALESCE(@email, email),
    email_source = COALESCE(@emailSource, email_source),
    email_status = COALESCE(@emailStatus, email_status),
    website = COALESCE(@website, website),
    facebook_url = COALESCE(@facebookUrl, facebook_url),
    rating = COALESCE(@rating, rating),
    reviews = COALESCE(@reviews, reviews),
    last_seen_at = @lastSeenAt
  WHERE dedupe_key = @dedupeKey
`);

// Nayi search ke results ko DB mein save karo. Jo pehle se maujood hain
// (phone ya name+city se match) unko update karo, naye insert karo — isse
// har search pe purani leads dobara duplicate nahi banti aur history build hoti hai.
export function upsertLeads(businesses: Business[], city: string): StoredBusiness[] {
  const now = new Date().toISOString();

  return businesses.map((b) => {
    const dedupeKey = buildDedupeKey(b, city);
    const existing = findStmt.get(dedupeKey) as any;

    if (existing) {
      updateStmt.run({
        dedupeKey,
        address: b.address,
        phone: b.phone,
        whatsapp: b.whatsapp,
        email: b.email,
        emailSource: b.emailSource,
        emailStatus: b.emailStatus ?? null,
        website: b.website,
        facebookUrl: b.facebookUrl,
        rating: b.rating,
        reviews: b.reviews,
        lastSeenAt: now,
      });
      return {
        ...b,
        id: existing.id,
        isNew: false,
        firstSeenAt: existing.first_seen_at,
        lastSeenAt: now,
        status: existing.status || 'new',
        notes: existing.notes,
        contactedAt: existing.contacted_at,
      };
    }

    const result = insertStmt.run({
      dedupeKey,
      name: b.name,
      type: b.type,
      city,
      address: b.address,
      phone: b.phone,
      whatsapp: b.whatsapp,
      email: b.email,
      emailSource: b.emailSource,
      emailStatus: b.emailStatus ?? null,
      website: b.website,
      facebookUrl: b.facebookUrl,
      rating: b.rating,
      reviews: b.reviews,
      lat: b.lat,
      lon: b.lon,
      source: b.source,
      firstSeenAt: now,
      lastSeenAt: now,
    });
    return {
      ...b,
      id: Number(result.lastInsertRowid),
      isNew: true,
      firstSeenAt: now,
      lastSeenAt: now,
      status: 'new',
      notes: null,
      contactedAt: null,
    };
  });
}

export function getAllLeads(): StoredBusiness[] {
  const rows = db.prepare('SELECT * FROM leads ORDER BY first_seen_at DESC').all();
  return rows.map(rowToBusiness);
}

const VALID_STATUSES: LeadStatus[] = ['new', 'contacted', 'replied', 'converted', 'not_interested'];

const updateStatusStmt = db.prepare(`
  UPDATE leads SET
    status = @status,
    notes = @notes,
    contacted_at = CASE WHEN @status != 'new' AND contacted_at IS NULL THEN @now ELSE contacted_at END
  WHERE id = @id
`);
const findByIdStmt = db.prepare('SELECT * FROM leads WHERE id = ?');

// Outreach status/notes update karo — jab lead ko pehli dafa 'new' se hataya
// jaye to contacted_at auto-set hota hai, dobara set nahi hota.
export function updateLeadStatus(
  id: number,
  status: LeadStatus,
  notes: string | null
): StoredBusiness | null {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  updateStatusStmt.run({ id, status, notes, now: new Date().toISOString() });
  const row = findByIdStmt.get(id) as any;
  return row ? rowToBusiness(row) : null;
}
