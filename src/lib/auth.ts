import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { getDB } from "../db";
import { reactStartCookies } from "better-auth/react-start";

export const auth = betterAuth({
  appName: "Meu Horoscopo",
  database: drizzleAdapter(getDB(), {
    provider: "sqlite",
  }),
  plugins: [
    anonymous({ emailDomainName: "meuhoroscopo.com" }),
    reactStartCookies(),
  ],
});
