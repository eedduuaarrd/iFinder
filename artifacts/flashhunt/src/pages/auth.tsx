import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Zap, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { LANGS } from "@/i18n/translations";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) setLocation("/hunt");
  }, [user, setLocation]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const body = isSignUp
        ? { email, password, username, city }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("auth.fail"));
      }

      await refreshUser();
      setLocation("/hunt");
    } catch (err: any) {
      setError(err.message || t("auth.fail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2 py-1 text-[10px] font-mono font-bold border-2 transition-colors ${
              lang === l.code
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary"
            }`}
            data-testid={`button-lang-${l.code}`}
          >
            {l.flag}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-2 border-primary bg-card shadow-[8px_8px_0px_0px_hsl(var(--primary))] rounded-none">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-mono tracking-tighter uppercase text-primary">{t("auth.title")}</CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase text-xs">
              {t("auth.tagline")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleAuth} className="grid gap-4">
              {isSignUp && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="username" className="uppercase font-mono text-xs">{t("auth.username")}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="hunter_x"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background"
                      required
                      autoComplete="username"
                      data-testid="input-username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city" className="uppercase font-mono text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t("auth.city")}
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder={t("auth.cityPlaceholder")}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background"
                      required
                      autoComplete="address-level2"
                      data-testid="input-city"
                    />
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{t("auth.cityHint")}</p>
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email" className="uppercase font-mono text-xs">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background"
                  required
                  autoComplete="email"
                  data-testid="input-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="uppercase font-mono text-xs">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background"
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  data-testid="input-password"
                />
              </div>
              {error && (
                <div className="text-destructive text-xs font-mono font-bold uppercase border border-destructive p-2">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                data-testid="button-submit"
                className="w-full border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-bold tracking-wider rounded-none mt-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] transition-all"
              >
                {loading ? t("auth.processing") : (isSignUp ? t("auth.signUp") : t("auth.signIn"))}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              variant="link"
              className="w-full text-muted-foreground hover:text-primary font-mono uppercase text-xs rounded-none"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              data-testid="button-toggle-auth"
            >
              {isSignUp ? t("auth.toLogin") : t("auth.toSignUp")}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
