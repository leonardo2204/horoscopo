/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import { Header } from "../components/Header";
import { PostHogProvider } from "posthog-js/react";
import { Footer } from "../components/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "better-auth";
import { auth } from "../lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { wrapCreateRootRouteWithSentry } from "@sentry/tanstackstart-react";

interface RouteContext {
  user?: User;
}

const getSessionFn = createServerFn({ method: "POST" }).handler(async () => {
  const headers = getHeaders();

  const session = await auth.api.getSession({
    headers: headers as any,
  });

  return session?.user;
});

export const Route = wrapCreateRootRouteWithSentry(
  createRootRouteWithContext<RouteContext>
)()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title:
          "Horóscopo do Dia Grátis - Signos, Mapa Astral e Previsão Amorosa para 2025 | MeuHoroscopo.com",
        description:
          "Descubra seu horóscopo diário completo, previsões anuais, compatibilidade entre signos e mapa astral grátis. Atualizações 2025. Confira agora!",
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  beforeLoad: async () => {
    const user = await getSessionFn();
    return { user };
  },
});

const queryClient = new QueryClient();

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            defaults: "2025-05-24",
            disable_external_dependency_loading: true,
            debug: import.meta.env.MODE === "development",
          }}
        >
          <QueryClientProvider client={queryClient}>
            <Header />
            {children}
            <Footer />
          </QueryClientProvider>
        </PostHogProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
