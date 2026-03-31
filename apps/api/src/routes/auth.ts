import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  const authenticated = req.isAuthenticated();
  const rawUser = authenticated ? (req.user as any) : null;
  const user = rawUser ? {
    id: rawUser.id,
    email: rawUser.email ?? undefined,
    firstName: rawUser.firstName ?? undefined,
    lastName: rawUser.lastName ?? undefined,
    profileImageUrl: rawUser.profileImageUrl ?? undefined,
  } : undefined;
  res.json(GetCurrentAuthUserResponse.parse({ isAuthenticated: authenticated, user }));
});

router.get("/login", (_req: Request, res: Response) => {
  res.status(410).json({ error: "Deprecated. Use Clerk client-side sign-in." });
});

router.get("/callback", (_req: Request, res: Response) => {
  res.status(410).json({ error: "Deprecated. Clerk handles callback flow." });
});

router.get("/logout", (_req: Request, res: Response) => {
  res.status(410).json({ error: "Deprecated. Use Clerk client-side sign-out." });
});

export default router;
