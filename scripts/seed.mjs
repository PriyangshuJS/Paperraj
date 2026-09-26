/**
 * PaperRaj demo seed — creates the librarian, a contributor, a few readers,
 * settings, teacher contacts and a small set of real, downloadable papers.
 *
 *   node scripts/seed.mjs
 *
 * Safe to run repeatedly: every insert uses ON CONFLICT DO NOTHING.
 */
import { randomUUID, scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import pg from "pg";

const scrypt = promisify(_scrypt);

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    /* no .env file — rely on the environment */
  }
}
loadEnv();

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/** Build a small, genuinely valid single-page PDF. */
function makePdf(lines) {
  const content = lines
    .map(
      (line, index) =>
        `BT /F1 ${index === 0 ? 20 : 13} Tf 60 ${770 - index * 26} Td (${String(line)
          .replace(/\\/g, "\\\\")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)")}) Tj ET`,
    )
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

/** Minimal 8-bit grayscale PNG (checkerboard) so image previews work. */
function makePng(width = 240, height = 320) {
  const raw = [];
  for (let y = 0; y < height; y += 1) {
    raw.push(0);
    for (let x = 0; x < width; x += 1) {
      const shade = ((x >> 4) + (y >> 4)) % 2 === 0 ? 238 : 214;
      raw.push(shade, 226, 198);
    }
  }
  const rawBuffer = Buffer.from(raw);
  const crcTable = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed));
    return Buffer.concat([length, typed, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlibDeflate(rawBuffer)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function zlibDeflate(buffer) {
  return deflateSync(buffer);
}

const PAPERS = [
  {
    fileName: "Chemistry IX Half Yearly 2026.pdf",
    uploaderName: "Raj",
    classLevel: "Class 9",
    board: "ICSE",
    subject: "Chemistry",
    exam: "Half Yearly",
    year: 2026,
    school: "St. Xavier's Collegiate School",
    paperType: "Year Paper",
    description:
      "Half yearly examination paper with periodic table, mole concept and language of chemistry sections. 8 printed pages, no answer key.",
    lines: [
      "Chemistry — Class IX Half Yearly Examination 2026",
      "St. Xavier's Collegiate School · ICSE",
      "Time: 2 hours    Maximum marks: 80",
      "",
      "Section A — Attempt all questions (40 marks)",
      "1. State the law of constant proportion with one example. [2]",
      "2. Calculate the number of moles in 8.0 g of methane. [3]",
      "3. Name the isotopes used in detecting thyroid disorders. [2]",
      "Section B — Answer any four questions (40 marks)",
      "4. Describe the preparation of ammonia by Haber's process. [10]",
    ],
    downloads: 347,
    likes: 42,
    dislikes: 3,
  },
  {
    fileName: "Mathematics Class 10 Specimen 2025.pdf",
    uploaderName: "Anita Rao",
    classLevel: "Class 10",
    board: "CBSE",
    subject: "Mathematics",
    exam: "Board Practice",
    year: 2025,
    school: "Delhi Public School",
    paperType: "Specimen Paper",
    description:
      "Specimen paper released for board practice, including the full marking scheme on the last two pages.",
    lines: [
      "Mathematics — Class X Specimen Paper 2025",
      "CBSE · Delhi Public School",
      "Time: 3 hours    Maximum marks: 80",
      "",
      "1. If two positive integers p and q are written as p = a^2 b and q = a b^3, find HCF(p, q).",
      "2. Solve the pair of equations x + y = 14 and x - y = 4 graphically.",
      "3. Prove that sqrt(3) is irrational.",
    ],
    downloads: 1290,
    likes: 233,
    dislikes: 7,
  },
  {
    fileName: "Physics XI Final 2024.pdf",
    uploaderName: "Rahul M.",
    classLevel: "Class 11",
    board: "CBSE",
    subject: "Physics",
    exam: "Final Exam",
    year: 2024,
    school: "ABC School",
    paperType: "Year Paper",
    description: "Kinematics through rotational motion. Numericals carry 60% of the marks.",
    lines: [
      "Physics — Class XI Annual Examination 2024",
      "ABC School · CBSE",
      "Time: 3 hours    Maximum marks: 70",
      "",
      "1. Derive the three equations of motion from a velocity-time graph.",
      "2. A body of mass 2 kg is acted upon by a force of 20 N. Find its acceleration.",
      "3. State and prove the work-energy theorem.",
    ],
    downloads: 512,
    likes: 88,
    dislikes: 4,
  },
  {
    fileName: "Biology X Prelims 2026.pdf",
    uploaderName: "Sneha K.",
    classLevel: "Class 10",
    board: "ICSE",
    subject: "Biology",
    exam: "Prelims",
    year: 2026,
    school: "Bombay Scottish School",
    paperType: "Year Paper",
    description: "Preliminary paper with diagram-based questions from the human circulatory system.",
    lines: [
      "Biology — Class X Preliminary Examination 2026",
      "Bombay Scottish School · ICSE",
      "Time: 2 hours    Maximum marks: 80",
      "",
      "1. Draw a labelled diagram of the human heart.",
      "2. Distinguish between arteries and veins.",
    ],
    downloads: 208,
    likes: 31,
    dislikes: 1,
  },
  {
    fileName: "History VIII Annual 2025.png",
    uploaderName: "Raj",
    classLevel: "Class 8",
    board: "ICSE",
    subject: "History",
    exam: "Annual Exam",
    year: 2025,
    school: "St. Xavier's Collegiate School",
    paperType: "Year Paper",
    description: "Scanned copy of the annual history paper — readable on a phone.",
    isImage: true,
    downloads: 96,
    likes: 12,
    dislikes: 0,
  },
  {
    fileName: "English Language IX Specimen 2026.pdf",
    uploaderName: "Meera T.",
    classLevel: "Class 9",
    board: "ICSE",
    subject: "English",
    exam: "Specimen",
    year: 2026,
    school: "La Martiniere",
    paperType: "Specimen Paper",
    description: "Composition, comprehension and functional grammar sections.",
    lines: [
      "English Language — Class IX Specimen Paper 2026",
      "La Martiniere · ICSE",
      "Time: 2 hours    Maximum marks: 80",
      "",
      "Question 1. Write a composition of 300 words on any one of the following.",
      "(a) The most useful book I have read. (b) A visit to a heritage library.",
    ],
    downloads: 61,
    likes: 9,
    dislikes: 2,
  },
];

const TEACHERS = [
  {
    name: "Mrs. Anita Rao",
    subject: "Mathematics",
    school: "Delhi Public School",
    contact: "+91 90000 11223",
    notes: "Takes weekend doubt-clearing sessions for Class 10 board students.",
  },
  {
    name: "Mr. Deepak Verma",
    subject: "Physics",
    school: "ABC School",
    contact: "d.verma@example.edu",
    notes: "Shares printed numerical sets on request.",
  },
  {
    name: "Ms. Farida Shaikh",
    subject: "Chemistry",
    school: "St. Xavier's Collegiate School",
    contact: "+91 90000 44556",
    notes: null,
  },
];

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@paperraj.test").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "paperraj-admin";
  const adminHash = await hashPassword(adminPassword);

  const adminId = randomUUID();
  await client.query(
    `insert into profiles (id, email, password_hash, full_name, school, role)
     values ($1,$2,$3,$4,$5,'admin')
     on conflict (email) do nothing`,
    [adminId, adminEmail, adminHash, "The Librarian", "PaperRaj"],
  );

  const demoHash = await hashPassword("paperraj-demo");
  const demoId = randomUUID();
  await client.query(
    `insert into profiles (id, email, password_hash, full_name, school, role)
     values ($1,$2,$3,$4,$5,'user')
     on conflict (email) do nothing`,
    [demoId, "rahul@example.com", demoHash, "Rahul M.", "ABC School"],
  );

  await client.query(
    `insert into settings (key, value) values ('auto_approval','true'), ('max_upload_mb','50')
     on conflict (key) do nothing`,
  );

  for (const teacher of TEACHERS) {
    await client.query(
      `insert into teachers (name, subject, school, contact, notes)
       select $1,$2,$3,$4,$5 where not exists (select 1 from teachers where name = $1)`,
      [teacher.name, teacher.subject, teacher.school, teacher.contact, teacher.notes],
    );
  }

  const existing = await client.query("select count(*)::int as n from papers");
  if (existing.rows[0].n > 0) {
    console.log(`Papers table already has ${existing.rows[0].n} row(s) — skipping paper seed.`);
    await client.end();
    return;
  }

  const owner = await client.query("select id from profiles where email = $1", ["rahul@example.com"]);
  const ownerId = owner.rows[0]?.id ?? null;

  for (const paper of PAPERS) {
    const id = randomUUID();
    const buffer = paper.isImage ? makePng() : makePdf(paper.lines);
    const ext = paper.fileName.split(".").pop().toLowerCase();
    const mime = ext === "pdf" ? "application/pdf" : "image/png";
    const path = `papers/${id}/${paper.fileName}`;

    const inserted = await client.query(
      `insert into papers
        (id, file_name, owner_id, uploader_name, class_level, board, subject, exam, year, school,
         paper_type, description, file_size, file_ext, mime_type, storage_bucket, storage_path,
         status, download_count, like_count, dislike_count, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'paperraj-papers',$16,'APPROVED',$17,$18,$19, now() - ($20 || ' hours')::interval)
       on conflict (file_name) do nothing
       returning id`,
      [
        id,
        paper.fileName,
        ownerId,
        paper.uploaderName,
        paper.classLevel,
        paper.board,
        paper.subject,
        paper.exam,
        paper.year,
        paper.school,
        paper.paperType,
        paper.description,
        buffer.byteLength,
        ext,
        mime,
        path,
        paper.downloads,
        paper.likes,
        paper.dislikes,
        Math.floor(Math.random() * 400),
      ],
    );

    if (inserted.rows.length === 0) continue;

    await client.query(
      `insert into file_blobs (paper_id, data) values ($1,$2) on conflict (paper_id) do nothing`,
      [id, buffer],
    );
    console.log(`  · seeded ${paper.fileName} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
  }

  // A couple of comments and votes so the margin and counters look real.
  await client.query(
    `insert into comments (paper_id, user_id, author_name, body)
     select p.id, pr.id, 'Rahul M.', 'This paper is missing the map question from Section B — does anyone have the full set?'
     from papers p, profiles pr
     where p.file_name = 'History VIII Annual 2025.png' and pr.email = 'rahul@example.com'
     limit 1`,
  );
  await client.query(
    `update papers set comment_count = (select count(*) from comments c where c.paper_id = papers.id)`,
  );

  console.log("\nDemo librarian:");
  console.log(`  email:    ${adminEmail}`);
  console.log(`  password: ${adminPassword}`);
  console.log("\nDemo contributor:");
  console.log("  email:    rahul@example.com");
  console.log("  password: paperraj-demo");
  console.log("\nChange these before going public (see README → Admin setup).");

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
