import { redirect } from "next/navigation";

const CREATOR_URL = process.env.NEXT_PUBLIC_CREATOR_URL ?? "http://localhost:3000";

export default function CmsLoginPage() {
  redirect(`${CREATOR_URL}/login`);
}
