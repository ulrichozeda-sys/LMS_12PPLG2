"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";
import {
  Field,
  FormError,
  PrimaryButton,
  TextInput,
} from "@/components/shared/form-controls";

export default function GantiPasswordAwalPage() {
  const router = useRouter();
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(passwordBaru)) {
      setError("Password minimal 6 karakter dan harus kombinasi huruf dan angka.");
      return;
    }
    if (passwordBaru !== konfirmasi) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ganti-password-awal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordBaru }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password.");
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
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold tracking-tight">Buat password baru</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Satu langkah lagi sebelum masuk ke MyClass.
          </p>

          <div className="mt-5 rounded-lg border bg-card p-6 text-card-foreground">
            <div className="rounded-md border bg-muted p-3">
              <p className="text-xs font-semibold">Password sementara</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Password anda masih menggunakan password sementara. Untuk keamanan akun, silakan buat
                password baru sebelum melanjutkan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <Field label="Password baru" hint="Minimal 6 karakter, kombinasi huruf dan angka.">
                <TextInput
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Password Baru"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                />
              </Field>
              <Field label="Konfirmasi password baru">
                <TextInput
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Konfirmasi Password Baru"
                  value={konfirmasi}
                  onChange={(e) => setKonfirmasi(e.target.value)}
                />
              </Field>

              {error && <FormError>{error}</FormError>}

              <PrimaryButton type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </PrimaryButton>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}