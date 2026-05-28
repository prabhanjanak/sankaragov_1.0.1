import { db } from "./index.js";
import { usersTable } from "./schema/users.js";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

// Must match the hashPassword in artifacts/api-server/src/lib/crypto.ts
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const admins = [
  {
    clerkId: "local_auth_saravanan",
    email: "saravanan@sankaraeye.com",
    name: "Saravanan",
    role: "super_admin" as const,
    password: "Saravanan@2026",
    mustChangePassword: false,
  },
  {
    clerkId: "local_auth_prabhanjan",
    email: "prabhanjan@sankaraeye.com",
    name: "Prabhanjan",
    role: "super_admin" as const,
    password: "Prabhanjan@2026",
    mustChangePassword: false,
  },
  {
    clerkId: "local_auth_admin",
    email: "admin@sankaraeye.com",
    name: "MHQ Admin",
    role: "super_admin" as const,
    password: "Welcome@123",
    mustChangePassword: true,
  },
];

async function seedAdmins() {
  console.log("🌱 Seeding admin users into Neon DB...");
  for (const admin of admins) {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, admin.email));

    const pwdHash = hashPassword(admin.password);

    if (existing.length > 0) {
      await db
        .update(usersTable)
        .set({
          passwordHash: pwdHash,
          mustChangePassword: admin.mustChangePassword,
          role: admin.role,
          isActive: true,
          name: admin.name,
        })
        .where(eq(usersTable.email, admin.email));
      console.log(`✅ Updated:  ${admin.email}`);
    } else {
      await db.insert(usersTable).values({
        clerkId: admin.clerkId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        passwordHash: pwdHash,
        mustChangePassword: admin.mustChangePassword,
        isActive: true,
      });
      console.log(`✅ Created:  ${admin.email}`);
    }
  }
  console.log("\n🎉 Done!");
  console.log("   saravanan@sankaraeye.com  → Saravanan@2026");
  console.log("   prabhanjan@sankaraeye.com → Prabhanjan@2026");
  console.log("   admin@sankaraeye.com      → Welcome@123 (must change on first login)");
  process.exit(0);
}

seedAdmins().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
