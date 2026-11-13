# MyClass

MyClass adalah Learning Management System (LMS) untuk mendukung aktivitas sekolah: pengelolaan kelas, akun siswa dan guru, materi, tugas, asesmen, pengumpulan jawaban, serta pemantauan performa akademik.

A modern classroom and academic management app built with Next.js.

## Fitur Utama

- Autentikasi dan role-based access untuk Super Admin, Admin, Kepsek, Kurikulum, Guru, dan Siswa.
- Dashboard berbeda sesuai kebutuhan setiap role.
- Kelas, pengumuman, materi, tugas, asesmen, soal, dan jawaban siswa.
- Penilaian, detail submission read-only untuk role pengawas, dan ekspor nilai.
- Grafik performa akademik sekolah, kelas, dan mata pelajaran.

## Arsitektur

Frontend dan API berada dalam satu repository dan satu aplikasi Next.js:

```text
app/                 Halaman frontend dan route UI
app/api/             API Route Handlers backend
components/          Komponen UI yang dapat dipakai ulang
lib/                 Auth, database, RBAC, format, dan helper
prisma/              Schema, migration, dan seed database
public/              Asset frontend
```

Untuk kondisi project sekarang, satu repository lebih sederhana karena frontend dan API berbagi session, RBAC, Prisma Client, tipe data, dan komponen. Pisahkan menjadi repository frontend/backend hanya jika API akan dipakai client lain, memiliki siklus deployment berbeda, atau dikerjakan tim terpisah.

## Prasyarat

- Node.js 20 atau lebih baru
- npm
- MySQL atau MariaDB

## Instalasi

```bash
git clone <URL_REPOSITORY>
cd myclass
npm install
copy .env.example .env
```

Pada PowerShell, perintah `copy` di atas dapat digunakan. Isi nilai database dan secret di `.env` sebelum menjalankan aplikasi.

## Environment Variables

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=myclass
DB_SSL=false
DB_SSL_CA=
DATABASE_URL=mysql://root@127.0.0.1:3306/myclass
JWT_SECRET=ganti-dengan-secret-random
RESEND_API_KEY=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
SUPER_ADMIN_NAME=Super Admin
```

Untuk TiDB Cloud, isi `DB_HOST`, `DB_PORT=4000`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME=myclass` sesuai kredensial cluster; set `DB_SSL=true` dan `DB_SSL_CA` ke isi sertifikat CA PEM. `DB_SSL_CA` menerima PEM multiline atau satu baris dengan newline yang ditulis sebagai `\n`. `DATABASE_URL` dipakai Prisma CLI, sedangkan koneksi aplikasi dan seed memakai `DB_*`.

Untuk membuat akun Super Admin, isi `SUPER_ADMIN_EMAIL` dan `SUPER_ADMIN_PASSWORD` secara lokal. Seed memvalidasi format email dan password, menggunakan bcryptjs, serta menolak email yang sudah dipakai role lain. Jangan masukkan nilai tersebut ke chat atau commit.

Di Vercel, tambahkan variabel tersebut di Project Settings → Environment Variables. Pastikan `DB_SSL` dan `DB_SSL_CA` tersedia untuk setiap environment yang memakai TiDB (Production dan Preview jika Preview digunakan), kemudian redeploy. Jangan commit `.env`, `account.txt`, password, API key, sertifikat CA, atau file upload pengguna.

## Database

Pastikan `DB_HOST` dan host pada `DATABASE_URL` sama-sama menunjuk database lokal yang benar sebelum menjalankan perintah database. Untuk Super Admin lokal, jalankan perintah seed hanya setelah mengisi variabel environment di atas:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Untuk pengembangan schema lokal, gunakan `npx prisma migrate dev`.

Jika Prisma menampilkan peringatan bahwa perubahan dapat menghapus data, hentikan proses dan periksa dampaknya terlebih dahulu. Jangan gunakan opsi reset paksa pada database yang masih berisi data penting.

## Menjalankan Aplikasi

Mode development:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda.

Validasi dan production build:

```bash
npm run lint
npm run build
npm start
```

Project ini menggunakan `next/font` untuk otomatis optimize dan load Geist.

## Checklist Validasi Lokal

Sebelum mengirim perubahan, jalankan pemeriksaan berikut:

```bash
npx tsc --noEmit
npm run build
git diff --check
```

## Push ke GitHub

Project ini cukup memakai satu repository:

```bash
git init
git add .
git status
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

Sebelum `git add .`, pastikan `account.txt`, `.env`, dan upload lokal tidak muncul pada `git status`.

## Dokumentasi Penting

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma ORM](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [GitHub Documentation](https://docs.github.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

For deployment details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Lisensi

Belum ditentukan.
