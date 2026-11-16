import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";
import type { LegalSection } from "@/components/legal/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "Data yang dikumpulkan",
    paragraphs: [
      "Data akun: nama lengkap, alamat email, password yang disimpan dalam bentuk hash scrypt, peran dan keanggotaan workspace, serta status verifikasi dua langkah. Kami tidak pernah menyimpan password dalam bentuk teks asli.",
      "Data produksi: brief atau prompt yang Anda tulis, pre-context proyek, lampiran gambar dan video, hasil analisis lampiran, plan yang dihasilkan model, serta parameter render yang dipilih.",
      "Metadata render: model dan penyedia yang dipakai, jumlah token, durasi proses, status keberhasilan atau kegagalan, dan informasi teknis lain yang diperlukan untuk penagihan serta diagnosa.",
      "Data teknis: alamat IP, waktu permintaan, jenis perangkat, dan log kesalahan yang dipakai untuk keamanan dan pemeliharaan layanan.",
    ],
  },
  {
    heading: "Dasar pemrosesan",
    paragraphs: [
      "Kami memproses data akun dan data produksi untuk melaksanakan perjanjian layanan dengan Anda, yaitu menjalankan render dan menyimpan hasilnya di workspace Anda.",
      "Kami memproses log keamanan, catatan penagihan, dan data audit berdasarkan kepentingan sah Rupakarsa untuk menjaga keamanan layanan, mencegah penyalahgunaan, dan memenuhi kewajiban pembukuan.",
      "Pengiriman email operasional seperti kredensial akun, tautan reset password, dan notifikasi render selesai dilakukan berdasarkan kebutuhan pelaksanaan layanan. Email promosi, apabila ada, hanya dikirim dengan persetujuan Anda dan dapat dihentikan kapan saja.",
    ],
  },
  {
    heading: "Subprosesor",
    paragraphs: [
      "Higgsfield: penyedia model video yang memproses prompt dan gambar referensi untuk menghasilkan video sesuai permintaan render Anda.",
      "Penyedia model yang kompatibel dengan OpenAI dan dikonfigurasi operator, termasuk DeepSeek untuk penyusunan plan dan analisis teks. Daftar penyedia aktif dapat berubah dan ditampilkan pada konfigurasi publik layanan.",
      "Cloudflare: jaringan pengiriman konten, penyimpanan sementara, dan perlindungan lalu lintas untuk situs serta API Rupakarsa.",
      "Google Drive: hanya dipakai apabila workspace Anda menghubungkan Drive sendiri. Pada mode ini lampiran dan hasil render workspace tersebut disimpan di Drive milik workspace Anda dan tunduk pada kebijakan Google.",
      "Penyimpanan objek milik operator Rupakarsa dipakai untuk aset workspace yang tidak menghubungkan Drive sendiri.",
    ],
  },
  {
    heading: "Retensi media",
    paragraphs: [
      "Penyimpanan default menghapus aset media secara otomatis setelah 10 hari sejak aset dibuat. Setelah dibersihkan, aset tidak dapat dipulihkan, sehingga unduh hasil yang masih dibutuhkan sebelum masa retensi berakhir.",
      "Workspace yang menghubungkan Google Drive menyimpan aset di Drive milik workspace tersebut dan tidak mengikuti retensi otomatis 10 hari. Penghapusan pada mode ini dilakukan oleh pengguna melalui halaman Penyimpanan atau langsung di Google Drive.",
      "Baris email outbox yang memuat kredensial akun dibersihkan setelah 30 hari. Catatan token dan log audit dapat disimpan lebih lama untuk keperluan pembukuan dan keamanan.",
    ],
  },
  {
    heading: "Hak subjek data",
    paragraphs: [
      "Anda dapat mengekspor data akun dan data produksi Anda dalam format JSON melalui endpoint /api/creator/account/export, atau meminta salinan kepada operator.",
      "Anda dapat menghapus akun melalui permintaan DELETE /api/creator/account dengan verifikasi password. Akun dinonaktifkan segera dan dihapus permanen setelah masa tenggang 30 hari, kecuali data yang wajib disimpan untuk kepentingan hukum.",
      "Anda dapat meminta pembetulan data, pembatasan pemrosesan, atau informasi lebih lanjut mengenai subprosesor melalui kontak di bawah. Permintaan yang sah akan ditanggapi dalam waktu yang wajar sesuai hukum yang berlaku.",
    ],
  },
  {
    heading: "Kontak",
    paragraphs: [
      "Pertanyaan tentang kebijakan ini, permintaan hak subjek data, atau keluhan privasi dapat dikirim ke alamat email kontak resmi yang tercantum pada bagian Kontak di bawah halaman ini.",
      "Kebijakan ini dapat diperbarui seiring perubahan penyedia model atau kewajiban hukum. Tanggal pembaruan tercantum di bagian atas halaman.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi Rupakarsa: data yang dikumpulkan, dasar pemrosesan, subprosesor, retensi media 10 hari, dan hak subjek data.",
};

export default function PrivacyPage() {
  return <LegalLayout title="Kebijakan Privasi" updatedAt="16 November 2026" sections={SECTIONS} />;
}
