"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";
import {
  Field,
  FormError,
  PrimaryButton,
  TextInput,
} from "@/components/shared/form-controls";

type Portal = "ADMIN" | "PETUGAS" | "SISWA";

const PORTAL_CONFIG: Record<
  Portal,
  { label: string; title: string; identifierLabel: string; identifierPlaceholder: string }
> = {
  ADMIN: { label: "Admin", title: "Login Sebagai Admin", identifierLabel: "Email", identifierPlaceholder: "Email" },
  PETUGAS: { label: "Petugas", title: "Login Sebagai Petugas", identifierLabel: "NIK", identifierPlaceholder: "Nik" },
  SISWA: { label: "Siswa", title: "Login Sebagai Siswa", identifierLabel: "NIS", identifierPlaceholder: "Nis" },
};

export default function LoginPage() {
  const router = useRouter();

  // ===== state login =====
  const [portal, setPortal] = useState<Portal>("ADMIN");
  const [loginIdentifier, setLoginIdentifier] = useState(""); // email (admin) / nik (petugas) / nis (siswa)
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = PORTAL_CONFIG[portal];

  function handlePortalChange(newPortal: Portal) {
    setPortal(newPortal);
    setLoginIdentifier("");
    setLoginPassword("");
    setShowLoginPassword(false);
    setError("");
  }

  // ===== LOGIN =====
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword, portal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal, coba lagi.");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="MyClass, beranda"
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Kembali
            </Link>
          </div>
        </div>
      </header>

      {/* KONTEN */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-5">
            <h1 className="text-xl font-semibold tracking-tight">Selamat Datang di MyClass</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ayo Belajar Lebih Cerdas Bersama MyClass
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 text-card-foreground">
            <p className="text-xs font-medium text-muted-foreground">Portal Administrasi</p>
            <div
              role="group"
              aria-label="Pilih portal"
              className="mt-2 grid grid-cols-3 gap-1 rounded-md border bg-muted p-1"
            >
              {(Object.keys(PORTAL_CONFIG) as Portal[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={portal === key}
                  onClick={() => handlePortalChange(key)}
                  className={cn(
                    "h-9 cursor-pointer rounded-sm text-sm font-medium transition-colors duration-150 outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    portal === key
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {PORTAL_CONFIG[key].label}
                </button>
              ))}
            </div>

            <h2 className="mt-6 text-sm font-semibold">{config.title}</h2>

            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3">
              <Field label={config.identifierLabel}>
                <TextInput
                  type={portal === "ADMIN" ? "email" : "text"}
                  required
                  autoComplete="username"
                  placeholder={config.identifierPlaceholder}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className={portal !== "ADMIN" ? "font-mono" : undefined}
                />
              </Field>
              <Field label="Password">
                <span className="relative block">
                  <TextInput
                    type={showLoginPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? "Sembunyikan password" : "Lihat password"}
                    aria-pressed={showLoginPassword}
                    onClick={() => setShowLoginPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 inline-flex w-10 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </span>
              </Field>

              {error && <FormError>{error}</FormError>}

              <PrimaryButton type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Masuk"}
              </PrimaryButton>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}