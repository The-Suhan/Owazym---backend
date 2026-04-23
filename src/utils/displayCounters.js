import { prisma } from "../config/prisma.js";

let displayCounterSchemaReadyPromise = null;

export const ensureDisplayCounterSchema = async () => {
  if (!displayCounterSchemaReadyPromise) {
    displayCounterSchemaReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE artists
        ADD COLUMN IF NOT EXISTS display_listeners BIGINT
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE music
        ADD COLUMN IF NOT EXISTS display_plays BIGINT
      `);
    })().catch((error) => {
      displayCounterSchemaReadyPromise = null;
      throw error;
    });
  }

  return displayCounterSchemaReadyPromise;
};
