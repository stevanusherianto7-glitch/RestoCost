# 📘 Pedoman Pengisian Data PSRestoCost ERP

Selamat datang di **PSRestoCost ERP Engine**. Dokumen ini dirancang sebagai panduan standar bagi karyawan dalam memasukkan data ke dalam sistem untuk memastikan perhitungan HPP, stok, dan laba rugi akurat 100%.

---

## 1. Modul: Dashboard (ERP Engine Control)

Dashboard adalah pusat kendali operasi harian. Pastikan data dimasukkan setiap kali ada transaksi atau perubahan stok.

> [!IMPORTANT]
> Gunakan fitur **Sales Sync Engine** setiap akhir shift atau saat ada penjualan untuk memotong stok bahan baku secara otomatis.

| Fitur | Perintah Sistem | Kegunaan |
| :--- | :--- | :--- |
| **Input Penjualan** | `[SALES_SYNC]` | Memilih menu yang laku dan jumlah porsinya untuk memotong stok gudang. |
| **Cek Stok Habis** | `[STOCK_CHECK]` | Memperbarui tampilan peringatan bahan yang sudah mencapai batas aman (*Safety Stock*). |
| **Laporan Harian** | `[PROFIT_LOSS]` | Melihat omzet dan total HPP yang terjadi pada hari tersebut. |

---

## 2. Modul: Database Bahan Baku (Master Data)

Ini adalah fondasi dari seluruh perhitungan. Kesalahan input di sini akan merusak perhitungan harga jual menu.

### Aturan Penulisan Nama

- Gunakan **Title Case** (Huruf Kapital di Awal Kata). Contoh: `Bawang Merah`, bukan `bawang merah`.
- Spesifik: Sebutkan merk jika perlu. Contoh: `Minyak Goreng Bimoli 2L`.

### Konversi Satuan (Crucial!)

Sistem menghitung modal per porsi menggunakan **Satuan Pakai (G/Ml/Pcs)**.

| Input Field | Penjelasan | Contoh |
| :--- | :--- | :--- |
| **Harga Beli** | Total harga yang dibayar ke supplier. | `Rp 150.000` |
| **Satuan Beli** | Satuan kemasan saat membeli barang. | `Karung` |
| **Isi per Satuan** | Berat/volume bersih di dalam satuan beli. | `25` (jika karung 25kg) |
| **Satuan Pakai** | Satuan terkecil yang digunakan di resep. | `kg` (atau `g` jika ingin lebih detail) |

> [!TIP]
> Jika Anda membeli 1 Karung beras 25kg dan di resep menggunakan gram, maka isi per satuan adalah **25000** dan satuan pakainya adalah **g**.

---

## 3. Modul: Katalog Resep & BOM (Costing)

Modul ini digunakan untuk menghitung biaya modal (COGS) piringan.

1. **Tambah Bahan**: Masukkan semua komponen termasuk bumbu kecil (garam, penyedap) agar HPP akurat.
2. **Waste Buffer (%)**: Masukkan estimasi bahan yang terbuang (kulit, air, tulang). Standar umum adalah **5% - 10%**.
3. **Target Portions**: Masukkan 1 jika resep untuk 1 porsi, atau lebih jika resep untuk batch besar (misal: 1 panci bumbu).
4. **Target Margin**: Gunakan slider hingga **150%**. Sistem akan merekomendasikan harga jual berdasarkan nilai ini.

---

## 4. Modul: Biaya Operasional (OPEX)

Biaya di luar bahan baku yang harus ditanggung oleh menu tersebut.

- **Beban Tenaga Kerja**: Masukkan total gaji staf yang terlibat dibagi dengan target porsi per periode.
- **Biaya Overhead**: Masukkan biaya listrik, air, gas, dan internet bulanan. Sistem akan membagi biaya ini secara otomatis per porsi berdasarkan **Target Porsi / Bulan**.

---

## 🚨 Peringatan Penting

> [!CAUTION]
> **Jangan Menghapus Bahan Baku** yang sedang digunakan di dalam resep aktif. Hal ini akan menyebabkan error pada perhitungan HPP resep tersebut.
> [!NOTE]
> Jika harga bahan baku naik dari supplier, segera update di **Database Bahan Baku**. Seluruh resep yang menggunakan bahan tersebut akan otomatis memperbarui harga modalnya secara real-time.
