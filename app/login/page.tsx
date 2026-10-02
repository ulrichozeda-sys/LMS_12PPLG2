"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";
import {
  Field,
  FormError,
  InlineButton,
  PrimaryButton,
  TextArea,
  TextInput,
} from "@/components/shared/form-controls";

type Portal = "ADMIN" | "PETUGAS" | "SISWA";
type View = "LOGIN" | "LAPOR" | "OTP" | "PASSWORD_BARU" | "SUKSES";

const PORTAL_CONFIG: Record<
  Portal,
  { label: string; title: string; identifierLabel: string; identifierPlaceholder: string }
> = {
  ADMIN: { label: "Admin", title: "Login Sebagai Admin", identifierLabel: "Email", identifierPlaceholder: "Email" },
  PETUGAS: { label: "Petugas", title: "Login Sebagai Petugas", identifierLabel: "NIK", identifierPlaceholder: "Nik" },
  SISWA: { label: "Siswa", title: "Login Sebagai Siswa", identifierLabel: "NIS", identifierPlaceholder: "Nis" },
};

function ViewHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 text-sm font-semibold leading-snug">{title}</h2>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("LOGIN");

  // ===== state login =====
  const [portal, setPortal] = useState<Portal>("ADMIN");
  const [loginIdentifier, setLoginIdentifier] = useState(""); // email (admin) / nik (petugas) / nis (siswa)
  const [loginPassword, setLoginPassword] = useState("");

  // ===== state lupa password =====
  const [identifier, setIdentifier] = useState(""); // NIS/NIK
  const [lupaEmail, setLupaEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alasan, setAlasan] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [passwordBaru, setPasswordBaru] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const config = PORTAL_CONFIG[portal];

  function resetLupaState() {
    setIdentifier("");
    setLupaEmail("");
    setTanggalLahir("");
    setAlasan("");
    setOtpDigits(["", "", "", ""]);
    setPasswordBaru("");
    setError("");
    setInfo("");
  }

  function handlePortalChange(newPortal: Portal) {
    setPortal(newPortal);
    setLoginIdentifier("");
    setLoginPassword("");
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

  // ===== LAPOR (step 1) =====
  async function handleLaporSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, email: lupaEmail, tanggalLahir, alasan }),
      });
      const data = await res.json();
      setInfo(data.message ?? "Laporan berhasil dikirim ke admin.");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ===== OTP (step 2) =====
  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return; // cuma boleh 1 digit angka
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const otp = otpDigits.join("");
    if (otp.length !== 4) {
      setError("Masukkan 4 digit kode OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kode OTP tidak valid.");
        setLoading(false);
        return;
      }
      setView("PASSWORD_BARU");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ===== PASSWORD BARU (step 3) =====
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (passwordBaru.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, passwordBaru }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password.");
        setLoading(false);
        return;
      }
      setView("SUKSES");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function kembaliKeLogin() {
    resetLupaState();
    setView("LOGIN");
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
            {/* ============ VIEW: LOGIN ============ */}
            {view === "LOGIN" && (
              <>
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
                    <TextInput
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </Field>

                  {error && <FormError>{error}</FormError>}

                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Memproses..." : "Masuk"}
                  </PrimaryButton>

                  {portal !== "ADMIN" && (
                    <p className="text-center text-xs text-muted-foreground">
                      Lupa Password?{" "}
                      <InlineButton
                        onClick={() => {
                          resetLupaState();
                          setView("LAPOR");
                        }}
                      >
                        Ubah Password
                      </InlineButton>
                    </p>
                  )}
                </form>
              </>
            )}

            {/* ============ VIEW: LAPOR (step 1) ============ */}
            {view === "LAPOR" && (
              <>
                <ViewHeading
                  eyebrow="Buat Laporan Password"
                  title="Gunakan NIS/NIK, email, tanggal lahir, dan alasan untuk ubah password"
                />

                {info ? (
                  <div role="status" className="mt-4 rounded-md border bg-brand-subtle p-4 text-center">
                    <p className="text-sm">{info}</p>
                    <InlineButton onClick={kembaliKeLogin} className="mt-2">
                      Kembali ke Login
                    </InlineButton>
                  </div>
                ) : (
                  <form onSubmit={handleLaporSubmit} className="mt-4 space-y-3">
                    <Field label="NIS / NIK">
                      <TextInput
                        required
                        placeholder="NIS / NIK"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="font-mono"
                      />
                    </Field>
                    <Field label="Email">
                      <TextInput
                        type="email"
                        required
                        placeholder="Email"
                        value={lupaEmail}
                        onChange={(e) => setLupaEmail(e.target.value)}
                      />
                    </Field>
                    <Field label="Tanggal lahir">
                      <TextInput
                        type="date"
                        required
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                      />
                    </Field>
                    <Field label="Alasan lupa password">
                      <TextArea
                        required
                        placeholder="Alasan lupa password"
                        value={alasan}
                        onChange={(e) => setAlasan(e.target.value)}
                        rows={3}
                      />
                    </Field>

                    {error && <FormError>{error}</FormError>}

                    <PrimaryButton type="submit" disabled={loading}>
                      {loading ? "Mengirim..." : "Buat Laporan"}
                    </PrimaryButton>

                    <div className="flex items-center justify-between">
                      <InlineButton tone="muted" onClick={kembaliKeLogin}>
                        Kembali ke login
                      </InlineButton>
                      <InlineButton onClick={() => setView("OTP")}>
                        Sudah punya kode OTP?
                      </InlineButton>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ============ VIEW: OTP (step 2) ============ */}
            {view === "OTP" && (
              <>
                <ViewHeading
                  eyebrow="Ubah Password"
                  title="Ketik NIS/NIK lalu masukkan kode OTP 4 digit yang dikirim admin melalui email"
                />

                <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
                  <Field label="NIS / NIK">
                    <TextInput
                      required
                      placeholder="NIS / NIK"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="font-mono"
                    />
                  </Field>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Kode OTP</p>
                    <div className="flex justify-center gap-3">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          aria-label={`Digit OTP ${i + 1}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          className="size-12 rounded-md border border-input bg-background text-center font-mono text-lg font-semibold text-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        />
                      ))}
                    </div>
                  </div>

                  {error && <FormError className="text-center">{error}</FormError>}

                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Memverifikasi..." : "Lanjut"}
                  </PrimaryButton>

                  <div className="flex items-center justify-between">
                    <InlineButton tone="muted" onClick={kembaliKeLogin}>
                      Kembali ke login
                    </InlineButton>
                    <InlineButton onClick={() => setView("LAPOR")}>Belum lapor?</InlineButton>
                  </div>
                </form>
              </>
            )}

            {/* ============ VIEW: PASSWORD BARU (step 3) ============ */}
            {view === "PASSWORD_BARU" && (
              <>
                <ViewHeading eyebrow="Portal Administrasi" title="Buat Password Baru" />

                <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
                  <Field label="Password baru">
                    <TextInput
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Password Baru"
                      value={passwordBaru}
                      onChange={(e) => setPasswordBaru(e.target.value)}
                    />
                  </Field>

                  {error && <FormError>{error}</FormError>}

                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Buat Password"}
                  </PrimaryButton>

                  <div className="text-center">
                    <InlineButton tone="muted" onClick={kembaliKeLogin}>
                      Kembali ke login
                    </InlineButton>
                  </div>
                </form>
              </>
            )}

            {/* ============ VIEW: SUKSES ============ */}
            {view === "SUKSES" && (
              <div role="status" className="text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-brand text-brand-foreground">
                  <Check className="size-5" strokeWidth={2} aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-sm font-semibold">Password Berhasil Diubah</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Silakan login dengan password baru anda.
                </p>
                <PrimaryButton type="button" onClick={kembaliKeLogin} className="mt-4">
                  Kembali ke Login
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}