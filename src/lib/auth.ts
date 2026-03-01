import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";
import { loginLimiter } from "./rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit by IP
        const forwarded = request?.headers?.get?.("x-forwarded-for");
        const ip = forwarded
          ? forwarded.split(",")[0].trim()
          : "unknown";
        const { limited, retryAfterSeconds } = loginLimiter.check(ip);
        if (limited) {
          const minutes = Math.ceil((retryAfterSeconds || 0) / 60);
          throw new Error(
            `Too many login attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
          );
        }

        const user = await db.adminUser.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

        // Successful login — reset rate limit counter
        loginLimiter.reset(ip);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
