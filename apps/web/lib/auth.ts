// @ts-nocheck — next-auth beta TS2742 issue (inferred type portability), works correctly
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const result = NextAuth({
  providers: [
    Credentials({
      name: "password",
      credentials: { password: { label: "Password", type: "password" } },
      authorize: async (credentials) => {
        const pwd = process.env.APP_PASSWORD || "admin123";
        if (credentials?.password === pwd) {
          return { id: "1", name: "Admin", email: "admin@videoforge.local" };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  trustHost: true,
});

export const handlers = result.handlers;
export const signIn = result.signIn;
export const auth = result.auth;
