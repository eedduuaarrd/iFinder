import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLang } from "@/i18n/LanguageContext";
import { LANGS } from "@/i18n/translations";
import { useGetHuntItems } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Hunt from "@/pages/hunt";
import Camera from "@/pages/camera";
import Rankings from "@/pages/rankings";
import Friends from "@/pages/friends";
import Profile from "@/pages/profile";
import { Target, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center text-primary font-mono animate-pulse">
        LOADING...
      </div>
    );
  }

  if (!user) return <Auth />;
  return <Component />;
}

function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className="flex gap-0.5">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          data-testid={`button-header-lang-${l.code}`}
          aria-label={l.label}
          className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"} font-mono font-bold border-2 transition-colors leading-none ${
            lang === l.code
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border hover:border-primary"
          }`}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function HuntBadge() {
  const { user } = useAuth();
  const { data: items } = useGetHuntItems(undefined, { query: { enabled: !!user } });
  const remaining = items ? items.filter((i) => !i.found).length : 0;
  if (!user || remaining === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground border-2 border-background font-mono text-[10px] font-bold flex items-center justify-center rounded-full">
      {remaining}
    </span>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useLang();

  if (location === "/auth" || location.startsWith("/camera")) {
    return <>{children}</>;
  }

  const navItems = [
    { path: "/hunt", icon: Target, label: t("nav.hunt"), badge: true },
    { path: "/rankings", icon: Trophy, label: t("nav.ranks"), badge: false },
    { path: "/friends", icon: Users, label: t("nav.crew"), badge: false },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-[480px] mx-auto relative border-x border-border/30 shadow-2xl">
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b-2 border-border px-3 py-2.5 flex justify-between items-center gap-2">
        <Link href="/hunt" className="text-lg font-bold font-mono tracking-tighter text-primary uppercase shrink-0">
          ⚡ FLASHHUNT
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <Link href="/profile">
            <Avatar className="h-9 w-9 rounded-none border-2 border-primary cursor-pointer hover:bg-primary/20 transition-colors">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="rounded-none bg-black text-primary font-mono text-xs">
                {user?.username?.substring(0, 2).toUpperCase() || "ME"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-black border-t-2 border-[#333] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`nav-${item.path.slice(1)}`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6 mb-1" />
                  {item.badge && <HuntBadge />}
                </div>
                <span className="font-mono text-[10px] font-bold uppercase">{item.label}</span>
                {isActive && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading) setLocation(user ? "/hunt" : "/auth");
  }, [isLoading, user, setLocation]);

  return <div className="min-h-[100dvh] bg-background" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/auth" component={Auth} />
      <Route path="/hunt"><ProtectedRoute component={Hunt} /></Route>
      <Route path="/camera/:itemId"><ProtectedRoute component={Camera} /></Route>
      <Route path="/rankings"><ProtectedRoute component={Rankings} /></Route>
      <Route path="/friends"><ProtectedRoute component={Friends} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppShell>
                <Router />
              </AppShell>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
