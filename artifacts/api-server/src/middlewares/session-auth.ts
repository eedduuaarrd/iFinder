import { type Request, type Response, type NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userEmail?: string;
  }
}

export function sessionAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.session?.userId) {
    (req as any).userId = req.session.userId;
    (req as any).userEmail = req.session.userEmail;
  }
  next();
}
