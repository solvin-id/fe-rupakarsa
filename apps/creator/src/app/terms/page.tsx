import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";
import type { LegalSection } from "@/components/legal/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "Definisi layanan",
    paragraphs: [
      "Rupakarsa adalah ruang produksi visual berbasis kecerdasan artifisial yang memungkinkan tim menyusun brief, membuat plan atau prompt akhir, menjalankan render melalui penyedia model pihak ketiga, dan mengelola aset yang dihasilkan dalam satu workspace.",
      "Layanan mencakup aplikasi Creator, konsol CMS untuk operator, penyimpanan media, serta integrasi opsional ke Google Drive milik workspace. Dengan membuat akun atau menggunakan layanan, Anda menyetujui ketentuan pada halaman ini.",
    ],
  },
  {
    heading: "Akun dan kredensial",
    paragraphs: [
      "Akun dibuat oleh Superadmin Rupakarsa. Password awal dikirim ke email yang terdaftar pada akun tersebut, dan Anda wajib menggantinya segera setelah masuk pertama kali melalui menu keamanan di Creator.",
      "Anda bertanggung jawab menjaga kerahasiaan password, kode verifikasi dua langkah, dan perangkat yang dipakai untuk mengakses layanan. Setiap aktivitas yang dilakukan melalui akun Anda dianggap sebagai aktivitas Anda sendiri.",
      "Segera hubungi operator apabila Anda mencurigai akses tidak sah. Operator dapat menonaktifkan akun, mencabut sesi aktif, atau meminta penggantian password demi keamanan workspace.",
    ],
  },
  {
    heading: "Token, paket, dan kebijakan refund",
    paragraphs: [
      "Setiap render memakai token sesuai model dan parameter yang dipilih. Jumlah plan gratis, harga paket token, dan biaya plan mode mengikuti halaman harga yang berlaku pada saat transaksi.",
      "Token dikembalikan secara otomatis apabila render gagal diproses oleh penyedia model, termasuk kegagalan koneksi, batas waktu, atau penolakan dari penyedia. Plan mode yang berhasil dibuat tetap memakai kuota atau token plan sesuai ketentuan yang ditampilkan di antarmuka sebelum eksekusi.",
      "Paket token yang sudah dibeli tidak dapat diuangkan kembali. Refund dalam bentuk pengembalian dana hanya diberikan bila layanan tidak dapat diakses secara material dalam jangka waktu lama akibat kesalahan di pihak Rupakarsa, dan diselesaikan secara tertulis dengan operator.",
    ],
  },
  {
    heading: "Konten pengguna dan lisensi terbatas",
    paragraphs: [
      "Anda tetap memiliki hak atas brief, teks, gambar, video, dan materi lain yang Anda unggah ke workspace. Anda menyatakan memiliki hak atau izin yang memadai untuk menggunakan seluruh materi tersebut.",
      "Dengan mengunggah materi, Anda memberikan Rupakarsa lisensi terbatas, non-eksklusif, dan dapat dicabut untuk menyimpan, menyalin, mengubah format, menganalisis, dan meneruskan materi kepada penyedia model yang dikonfigurasi operator semata-mata untuk memproses render yang Anda minta.",
      "Lisensi tersebut berakhir ketika aset dihapus dari penyimpanan, kecuali salinan yang masih diperlukan untuk pemenuhan kewajiban hukum, penyelesaian sengketa, atau catatan audit.",
    ],
  },
  {
    heading: "Retensi media",
    paragraphs: [
      "Penyimpanan default Rupakarsa menghapus aset media secara otomatis setelah 10 hari sejak dibuat. Unduh hasil render yang masih Anda butuhkan sebelum masa retensi berakhir, karena aset yang sudah dibersihkan tidak dapat dipulihkan.",
      "Apabila workspace Anda menghubungkan Google Drive sendiri, seluruh lampiran dan hasil render workspace tersebut disimpan di Drive milik workspace Anda dan tidak mengikuti retensi otomatis 10 hari. Penghapusan aset pada mode ini hanya dilakukan melalui tindakan pengguna di halaman Penyimpanan atau langsung di Google Drive.",
      "Metadata aset, catatan penggunaan token, dan log audit dapat disimpan lebih lama untuk keperluan operasional dan kepatuhan.",
    ],
  },
  {
    heading: "Larangan konten",
    paragraphs: [
      "Anda dilarang mengunggah atau menghasilkan konten yang melanggar hukum, menyesatkan, meniru identitas orang lain tanpa izin, melanggar hak kekayaan intelektual, mengandung kekerasan seksual, eksploitasi anak, ujaran kebencian, atau materi lain yang dilarang oleh hukum yang berlaku.",
      "Anda juga dilarang menggunakan layanan untuk menyalahgunakan penyedia model pihak ketiga, melewati batas kuota, melakukan rekayasa balik terhadap sistem, atau mengganggu ketersediaan layanan bagi pengguna lain.",
      "Rupakarsa dapat menolak, menghentikan, atau menghapus konten dan akun yang melanggar ketentuan ini, termasuk melaporkan konten tertentu kepada pihak berwenang bila diwajibkan hukum.",
    ],
  },
  {
    heading: "Pembatasan tanggung jawab",
    paragraphs: [
      "Hasil model generatif bersifat probabilistik dan dapat berbeda dari brief. Rupakarsa tidak menjamin bahwa hasil render bebas dari kesalahan, sesuai ekspektasi estetika tertentu, atau layak dipakai untuk tujuan komersial tertentu tanpa peninjauan manusia.",
      "Sejauh diizinkan hukum, tanggung jawab Rupakarsa atas kerugian yang timbul dari penggunaan layanan dibatasi pada nilai token yang dibayarkan untuk transaksi yang menimbulkan kerugian tersebut. Rupakarsa tidak bertanggung jawab atas kehilangan keuntungan, kehilangan data akibat pengguna tidak mengunduh aset sebelum retensi berakhir, atau kegagalan penyedia pihak ketiga di luar kendali wajar operator.",
    ],
  },
  {
    heading: "Perubahan ketentuan",
    paragraphs: [
      "Ketentuan ini dapat diperbarui seiring perubahan fitur, penyedia model, atau kewajiban hukum. Tanggal pembaruan tercantum di bagian atas halaman dan versi terbaru selalu tersedia di alamat ini.",
      "Perubahan material akan diinformasikan melalui email terdaftar atau pemberitahuan di dalam aplikasi sebelum berlaku. Dengan tetap menggunakan layanan setelah tanggal berlaku, Anda dianggap menyetujui ketentuan yang diperbarui.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Ketentuan penggunaan layanan Rupakarsa: akun dan kredensial, token dan refund, lisensi konten, retensi media, larangan konten, dan pembatasan tanggung jawab.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Syarat & Ketentuan" updatedAt="16 November 2026" sections={SECTIONS} />
  );
}
