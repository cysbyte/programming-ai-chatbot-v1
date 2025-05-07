import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const client = hc<AppType>(baseUrl);
