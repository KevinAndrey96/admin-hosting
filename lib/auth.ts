import { cookies } from "next/headers";
import { getSession } from "./session";

export async function auth() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session.isLoggedIn) {
    return null;
  }

  return {
    user: {
      id: session.userId,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
    },
  };
}
