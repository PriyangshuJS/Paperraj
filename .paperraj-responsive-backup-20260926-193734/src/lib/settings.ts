import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type PlatformSettings = {
  /** Approve uploads automatically as soon as they pass validation. */
  autoApproval: boolean;
  /** Hard upper bound for a single upload, in megabytes. */
  maxUploadMb: number;
};

export const SETTING_KEYS = {
  autoApproval: "auto_approval",
  maxUploadMb: "max_upload_mb",
} as const;

const DEFAULTS: PlatformSettings = {
  autoApproval: true,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 50),
};

export async function getSettings(): Promise<PlatformSettings> {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(
        inArray(settings.key, [SETTING_KEYS.autoApproval, SETTING_KEYS.maxUploadMb]),
      );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const autoRaw = map.get(SETTING_KEYS.autoApproval);
    const sizeRaw = map.get(SETTING_KEYS.maxUploadMb);
    const parsedSize = Number.parseInt(sizeRaw ?? "", 10);
    return {
      autoApproval: autoRaw === undefined ? DEFAULTS.autoApproval : autoRaw === "true",
      maxUploadMb:
        Number.isFinite(parsedSize) && parsedSize > 0
          ? Math.min(parsedSize, 200)
          : DEFAULTS.maxUploadMb,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function writeSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function setAutoApproval(enabled: boolean): Promise<void> {
  await writeSetting(SETTING_KEYS.autoApproval, enabled ? "true" : "false");
}

export async function setMaxUploadMb(mb: number): Promise<void> {
  await writeSetting(SETTING_KEYS.maxUploadMb, String(mb));
}

export async function ensureSettingsRow(): Promise<void> {
  const current = await db.select().from(settings).where(eq(settings.key, "seeded"));
  if (current.length === 0) {
    await setAutoApproval(DEFAULTS.autoApproval);
    await setMaxUploadMb(DEFAULTS.maxUploadMb);
    await writeSetting("seeded", new Date().toISOString());
  }
}
