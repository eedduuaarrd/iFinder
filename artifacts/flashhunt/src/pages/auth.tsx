import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Zap, MapPin, Eye, EyeOff, AlertTriangle, User, Mail, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LANGS } from "@/i18n/translations";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

function mapBackendError(raw: string | undefined, t: (k: string) => string): string {
  if (!raw) return t("auth.fail");
  const r = raw.toLowerCase();
  if (r.includes("email already")) return t("auth.emailInUse");
  if (r.includes("username already") || r.includes("username taken")) return t("auth.usernameTaken");
  if (r.includes("invalid email or password") || r.includes("invalid credentials")) return t("auth.invalidLogin");
  if (r.includes("password must be at least")) return t("auth.passwordTooShort");
  if (r.includes("city is required")) return t("auth.city");
  return raw;
}

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
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (user) setLocation("/hunt");
  }, [user, setLocation]);

  const validate = (): string | null => {
    const e = email.trim();
    if (!EMAIL_RE.test(e)) return t("auth.invalidEmail");
    if (password.length < 6) return t("auth.passwordTooShort");
    if (isSignUp) {
      const u = username.trim();
      if (u.length < 3) return t("auth.usernameTooShort");
      if (!USERNAME_RE.test(u)) return t("auth.usernameHint");
      if (city.trim().length < 2) return t("auth.city");
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const body = isSignUp
        ? {
            email: email.trim().toLowerCase(),
            password,
            username: username.trim(),
            city: city.trim(),
          }
        : {
            email: email.trim().toLowerCase(),
            password,
          };

      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        throw new Error(t("auth.networkError"));
      }

      let data: any = {};
      try { data = await res.json(); } catch { /* tolerate non-JSON */ }

      if (!res.ok) {
        throw new Error(mapBackendError(data?.error, t));
      }

      await refreshUser();
      setLocation("/hunt");
    } catch (err: any) {
      setError(err.message || t("auth.fail"));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setPassword("");
  };

  // Strength indicator: 0-3 segments
  const strength = (() => {
    if (!isSignUp) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[^a-zA-Z0-9]/.test(password) || (/[A-Z]/.test(password) && /[0-9]/.test(password))) s++;
    return s;
  })();
  const strengthColors = ["bg-destructive", "bg-orange-400", "bg-secondary", "bg-primary"];

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }} />

      <div className="absolute top-3 right-3 z-20 flex gap-1">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2 py-1 text-[10px] font-mono font-bold border-2 transition-colors leading-none ${
              lang === l.code
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary"
            }`}
            data-testid={`button-lang-${l.code}`}
          >
            {l.code.toUpperCase()}
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
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-16 h-16 bg-primary flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
              >
                <Zap className="w-8 h-8 text-primary-foreground" />
              </motion.div>
            </div>
            <CardTitle className="text-3xl font-bold font-mono tracking-tighter uppercase text-primary">
              {t("auth.title")}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase text-xs">
              {t("auth.tagline")}
            </CardDescription>
          </CardHeader>

          {/* Tab switcher */}
          <div className="grid grid-cols-2 mx-6 border-2 border-border mb-4">
            <button
              type="button"
              onClick={() => !isSignUp || switchMode()}
              data-testid="tab-login"
              className={`py-2 font-mono font-bold uppercase text-xs tracking-wider transition-colors ${
                !isSignUp ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.signIn")}
            </button>
            <button
              type="button"
              onClick={() => isSignUp || switchMode()}
              data-testid="tab-signup"
              className={`py-2 font-mono font-bold uppercase text-xs tracking-wider transition-colors ${
                isSignUp ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.signUp")}
            </button>
          </div>

          <CardContent className="grid gap-4">
            <form onSubmit={handleAuth} className="grid gap-4" noValidate>
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid gap-4 overflow-hidden"
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="username" className="uppercase font-mono text-xs flex items-center gap-1">
                        <User className="w-3 h-3" /> {t("auth.username")}
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="hunter_x"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                        className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background h-11"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={24}
                        data-testid="input-username"
                      />
                      <p className="text-[10px] font-mono text-muted-foreground">{t("auth.usernameHint")}</p>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="city" className="uppercase font-mono text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {t("auth.city")}
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder={t("auth.cityPlaceholder")}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background h-11"
                        autoComplete="address-level2"
                        maxLength={64}
                        data-testid="input-city"
                      />
                      <p className="text-[10px] font-mono text-muted-foreground">{t("auth.cityHint")}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="uppercase font-mono text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background h-11 lowercase"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  data-testid="input-email"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password" className="uppercase font-mono text-xs flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> {t("auth.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background h-11 pr-12"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    minLength={6}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-1 top-1 bottom-1 px-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t("auth.hide") : t("auth.show")}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isSignUp && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-1 flex-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 transition-colors ${
                            password.length === 0 ? "bg-border" : strength > i ? strengthColors[strength] : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{t("auth.passwordHint")}</span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-destructive text-xs font-mono font-bold uppercase border-2 border-destructive p-2 flex items-start gap-2"
                    data-testid="text-auth-error"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="break-words">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                data-testid="button-submit"
                className="w-full border-2 border-foreground bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-bold tracking-wider rounded-none mt-1 h-12 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t("auth.processing") : (isSignUp ? t("auth.signUp") : t("auth.signIn"))}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0">
            <Button
              variant="link"
              className="w-full text-muted-foreground hover:text-primary font-mono uppercase text-xs rounded-none"
              onClick={switchMode}
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
