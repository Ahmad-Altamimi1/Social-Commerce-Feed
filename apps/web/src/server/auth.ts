import { createClerkClient, verifyToken } from "@clerk/backend";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import type { ApiTypes } from "@workspace/api-zod";

type AuthUser = ApiTypes.AuthUser;

const CLERK_SECRET_KEY =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.CLERK_SECRET_KEY;
const GUEST_COOKIE = "guest_id";
const GUEST_TTL = 30 * 24 * 60 * 60;
const clerkClient = CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: CLERK_SECRET_KEY })
  : null;

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

async function upsertUser(user: AuthUser): Promise<void> {
  await db
    .insert(usersTable)
    .values({
      id: user.id,
      email: user.email ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: user.email ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function resolveClerkUser(req: NextRequest): Promise<AuthUser | null> {
  if (!CLERK_SECRET_KEY || !clerkClient) return null;

  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const claims = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    if (!claims?.sub) return null;

    const clerkUser = await clerkClient.users.getUser(claims.sub);
    const user: AuthUser = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
      profileImageUrl: clerkUser.imageUrl ?? undefined,
    };

    await upsertUser(user);
    return user;
  } catch {
    return null;
  }
}

export async function getOrCreateGuestUserId(
  req: NextRequest,
  res: NextResponse,
): Promise<string> {
  const existing = req.cookies.get(GUEST_COOKIE)?.value;
  if (typeof existing === "string" && existing.startsWith("guest_")) {
    const [row] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, existing));
    if (row?.id) return existing;
  }

  const uuid =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const guestId = `guest_${uuid}`;
  await db.insert(usersTable).values({ id: guestId });
  res.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_TTL,
  });
  return guestId;
}
