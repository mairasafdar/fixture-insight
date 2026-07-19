import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { IntroModal } from "@/components/IntroModal";
import { fetchLastUpdated } from "@/lib/queries";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-grass">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That fixture didn't make it onto the radar.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-grass px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Back to This Week
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The fixture data didn't load. Try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-grass px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fixture Radar — Premier League content planning" },
      {
        name: "description",
        content:
          "Automated Premier League content planning dashboard: ranked upcoming fixtures, rivalries, table stakes and tentpole moments — refreshed every 6 hours.",
      },
      { name: "author", content: "Maira Chaudhary" },
      { name: "google-site-verification", content: "3WizQJrhDt6aqeHuicvtHTi9XH6XCIVmqV54GCe0TYc" },
      { property: "og:title", content: "Fixture Radar — Premier League content planning" },
      {
        property: "og:description",
        content:
          "Automated Premier League content planning dashboard: ranked upcoming fixtures, rivalries, table stakes and tentpole moments — refreshed every 6 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Fixture Radar — Premier League content planning" },
      { name: "twitter:description", content: "Automated Premier League content planning dashboard: ranked upcoming fixtures, rivalries, table stakes and tentpole moments — refreshed every 6 hours." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dac14566-bc87-4c8c-afcf-133922f28452/id-preview-b227c920--d392c887-12ee-44fa-a07a-af1c30be65dc.lovable.app-1784239797784.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dac14566-bc87-4c8c-afcf-133922f28452/id-preview-b227c920--d392c887-12ee-44fa-a07a-af1c30be65dc.lovable.app-1784239797784.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800;900&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Fixture Radar",
          url: "https://fixture-pulse.lovable.app",
          description:
            "Automated Premier League content planning dashboard. Ranks upcoming fixtures by rivalry, table stakes, star power, tentpoles and form.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Fixture Radar",
          url: "https://fixture-pulse.lovable.app",
          founder: { "@type": "Person", name: "Maira Chaudhary" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  const { data: lastUpdated } = useQuery({
    queryKey: ["last-updated"],
    queryFn: fetchLastUpdated,
    staleTime: 60_000,
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Nav lastUpdated={lastUpdated ?? null} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <IntroModal />
    </div>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
