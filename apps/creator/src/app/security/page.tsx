import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";
import type { LegalSection } from "@/components/legal/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "Enkripsi secret",
    paragraphs: [
      "API key penyedia model, kredensial SMTP, server key pembayaran, dan private key service account Google Drive disimpan dalam bentuk terenkripsi AES-256-GCM dengan kunci aplikasi yang hanya tersedia di server.",
      "Secret tidak pernah dikirim kembali ke antarmuka. Formulir pengaturan hanya menampilkan nilai tersamar, dan pengosongan field berarti nilai lama dipertahankan.",
    ],
  },
  {
    heading: "Password dan sesi",
    paragraphs: [
      "Password di-hash dengan scrypt beserta salt acak per akun. Password asli tidak disimpan, tidak dicatat di log, dan tidak pernah dikirim melalui respons API.",
      "Sesi disimpan pada cookie httpOnly yang tidak dapat dibaca skrip halaman. Setiap permintaan non-GET yang memakai cookie sesi wajib menyertakan token CSRF double-submit pada header x-csrf-token.",
      "Logout, penggantian password, dan reset password mencabut seluruh sesi aktif akun tersebut sehingga perangkat lain harus masuk kembali.",
    ],
  },
  {
    heading: "Isolasi workspace dan kontrol akses",
    paragraphs: [
      "Setiap entitas data terikat pada workspace. Permintaan API memvalidasi keanggotaan dan peran pengguna pada workspace aktif sebelum membaca atau mengubah data.",
      "Peran owner dan admin dapat mengelola anggota, kredensial Drive, dan aset workspace. Peran member hanya dapat memakai fitur produksi sesuai izin yang diberikan. Akses CMS diberikan terpisah per akun oleh Superadmin.",
    ],
  },
  {
    heading: "Autentikasi dua faktor",
    paragraphs: [
      "Setiap akun dapat mengaktifkan verifikasi dua langkah berbasis TOTP melalui aplikasi authenticator. Setelah aktif, login memerlukan password dan kode enam digit yang berlaku singkat.",
      "Secret TOTP disimpan terenkripsi dan tidak ditampilkan kembali setelah aktivasi. Operator dapat mewajibkan TOTP untuk seluruh akun yang memiliki akses CMS melalui pengaturan keamanan.",
    ],
  },
  {
    heading: "Pelaporan kerentanan",
    paragraphs: [
      "Jika Anda menemukan potensi kerentanan pada layanan Rupakarsa, laporkan secara bertanggung jawab melalui alamat email kontak resmi di bawah halaman ini. Sertakan langkah reproduksi dan dampak yang Anda amati.",
      "Kami akan mengonfirmasi penerimaan laporan, menilai dampaknya, dan menginformasikan perbaikan tanpa mempublikasikan detail teknis sebelum perbaikan tersedia. Mohon jangan mengakses, mengubah, atau menyebarkan data pengguna lain saat melakukan pengujian.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Keamanan",
  description:
    "Praktik keamanan Rupakarsa: enkripsi secret AES-256-GCM, password scrypt, cookie httpOnly dan CSRF, isolasi workspace, 2FA TOTP, dan pelaporan kerentanan.",
};

export default function SecurityPage() {
  return <LegalLayout title="Keamanan" updatedAt="16 November 2026" sections={SECTIONS} />;
}
