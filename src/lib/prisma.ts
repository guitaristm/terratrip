// Prisma client - lazily initialized to avoid build-time errors before `prisma generate`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _prisma: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrisma(): any {
  if (!_prisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const { PrismaClient } = require("@prisma/client") as any;
    const g = globalThis as any;
    _prisma = g._prisma ?? new PrismaClient({ log: ["error"] });
    if (process.env.NODE_ENV !== "production") g._prisma = _prisma;
  }
  return _prisma;
}

// Named export for convenience
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    return getPrisma()[prop];
  },
});
