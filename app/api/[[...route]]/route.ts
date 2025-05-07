import { Hono } from "hono";
import { handle } from "hono/vercel";

import conversations from "./conversations";
import users from "./users";
import auth from "./auth";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.route("/conversations", conversations).route("/users", users).route("/auth", auth);

export const GET = handle(app);
export const POST = handle(app);

export type AppType = typeof app;