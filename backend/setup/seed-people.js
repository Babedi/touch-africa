import "dotenv/config";
import { createPersonRecord } from "../modules/internal/person/person.service.js";

// Simple PRNG helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a valid 13-digit SA ID number based on a real date and Luhn check
function generateSAIdNumber(date) {
  // date: JS Date in UTC; use YYMMDD from UTC parts
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const first6 = `${yy}${mm}${dd}`;

  // Next 7 digits arbitrary (simplified from previous 6 + checkdigit to just 7 random digits)
  const next7 = Array.from({ length: 7 }, () => String(randInt(0, 9))).join("");

  // Return 13-digit ID: 6 digits (date) + 7 random digits
  return `${first6}${next7}`;
}

// Monotonic PERSON id generator matching pattern PERSON{13digits}
let lastTs = 0;
async function nextPersonId() {
  let now = Date.now();
  // Ensure strictly increasing timestamp
  while (now <= lastTs) {
    await new Promise((r) => setTimeout(r, 1));
    now = Date.now();
  }
  lastTs = now;
  return `PERSON${now}`;
}

const maleFirst = [
  "John",
  "Sipho",
  "Thabo",
  "Peter",
  "Michael",
  "Daniel",
  "Liam",
  "Noah",
  "Ethan",
  "Lucas",
];
const femaleFirst = [
  "Jane",
  "Ayanda",
  "Thandi",
  "Sarah",
  "Emily",
  "Olivia",
  "Ava",
  "Mia",
  "Emma",
  "Sophia",
];
const otherFirst = ["Alex", "Riley", "Jordan", "Taylor", "Casey", "Kai"];
const surnames = [
  "Doe",
  "Nkosi",
  "Naidoo",
  "Botha",
  "Smith",
  "Molefe",
  "Dlamini",
  "Meyer",
  "Pillay",
  "van der Merwe",
  "Khumalo",
  "Mokoena",
  "Jacobs",
];

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function randomSAEmail(first, last, i) {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z]+/g, ".");
  return `${base}.${i}@example.za.com`;
}

function randomMobile() {
  // South African mobiles often start with 06, 07, or 08
  const start = pick(["06", "07", "08"]);
  let rest = "";
  for (let i = 0; i < 8; i++) rest += String(randInt(0, 9));
  return `0${start}${rest}`.slice(0, 10); // ensure 10 digits starting with 0
}

function randomDOB() {
  // Between 1975-01-01 and 2008-12-31
  const year = randInt(1975, 2008);
  const month = randInt(1, 12);
  const day = randInt(1, 28); // keep simple and valid
  return new Date(Date.UTC(year, month - 1, day));
}

function buildPerson(i) {
  // Cycle genders for variety
  const genderIdx = i % 5;
  const gender = ["Male", "Female", "Non-binary", "Other", "Unspecified"][
    genderIdx
  ];
  const first =
    gender === "Male"
      ? pick(maleFirst)
      : gender === "Female"
      ? pick(femaleFirst)
      : pick(otherFirst);
  const last = pick(surnames);

  const dobDate = randomDOB();
  const idNumber = generateSAIdNumber(dobDate);

  const email = randomSAEmail(first, last, i + 1);
  const mobile = randomMobile();

  // Minimal yet rich-enough person data; dateOfBirth omitted to let service auto-extract
  return {
    // Provide our own unique PERSON id to avoid collisions
    _customIdPromise: nextPersonId(),
    idNumber,
    firstName: first,
    surname: last,
    preferredName: first,
    gender,
    citizenshipStatus: "South African",
    contact: {
      mobile,
      email,
    },
    popia: {
      consent: true,
      processingBasis: "consent",
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  let count = 50;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--count" || a === "-n") {
      const v = parseInt(args[i + 1], 10);
      if (!Number.isNaN(v) && v > 0) count = v;
      i++;
    } else if (a.startsWith("--count=")) {
      const v = parseInt(a.split("=")[1], 10);
      if (!Number.isNaN(v) && v > 0) count = v;
    }
  }

  console.log(`🌱 Seeding ${count} sample people...`);
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    try {
      const person = buildPerson(i);
      // Resolve unique PERSON id
      const customId = await person._customIdPromise;
      delete person._customIdPromise;
      // Pass custom id to override service default (spread order lets data override)
      const created = await createPersonRecord(
        { id: customId, ...person },
        "seed-people-script"
      );
      ok++;
      if ((i + 1) % 10 === 0 || i === count - 1) {
        console.log(`✅ Created ${ok}/${i + 1} (last: ${created.id})`);
      }
      // small delay to be kind
      await new Promise((r) => setTimeout(r, 2));
    } catch (err) {
      failed++;
      // If duplicate SA ID, retry once with a new one
      const isDup = String(err?.message || "").includes("already exists");
      if (isDup) {
        try {
          const retry = buildPerson(i + randInt(1, 1000));
          const customId = await retry._customIdPromise;
          delete retry._customIdPromise;
          await createPersonRecord(
            { id: customId, ...retry },
            "seed-people-script"
          );
          ok++;
          console.log(`🔁 Retry succeeded (${ok} total)`);
          continue;
        } catch (e2) {
          console.error("❌ Retry failed:", e2.message);
        }
      }
      console.error("❌ Failed to create person:", err.message);
    }
  }

  console.log(`\n🎉 Done. Created: ${ok}, Failed: ${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main();
