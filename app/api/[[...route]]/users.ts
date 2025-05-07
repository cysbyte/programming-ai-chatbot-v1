import { Hono } from "hono";

const app = new Hono().get("/", (c) => c.json({ message: "Hello, world!" }))
    .post("/", (c) => c.json({ message: "Hello, world!" }))
    .get("/:id", (c) => c.json({ message: "Hello, world!" }));

export default app;