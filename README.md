# CicipYuk Backend

Backend REST API untuk aplikasi mobile **CicipYuk**, yaitu aplikasi blog kuliner yang digunakan untuk menampilkan dan mengelola artikel makanan.

Backend ini dibuat menggunakan **Node.js**, **Express.js**, dan **MySQL**. API digunakan oleh aplikasi Flutter untuk mengambil dan mengelola data kategori, penerbit, dan artikel.

## Teknologi yang Digunakan

* Node.js
* Express.js
* TypeScript
* MySQL
* Zod
* Multer
* CORS

## Struktur Data

Backend mengelola tiga data utama:

### Kategori

Digunakan untuk menyimpan kategori artikel.

Contoh kategori:

* Resep
* Teknik & Tips Dapur
* Panduan Bahan
* Peralatan Dapur
* Wawasan Kuliner

### Penerbit

Digunakan untuk menyimpan nama penerbit yang digunakan pada artikel.

### Artikel

Digunakan untuk menyimpan informasi artikel kuliner seperti:

* Kategori
* Penerbit
* Judul
* Isi artikel
* Penulis
* Gambar artikel
* Waktu pembuatan
* Waktu perubahan

## Fitur Backend

Backend CicipYuk memiliki beberapa fitur utama:

* Mengambil data kategori
* Menambahkan kategori
* Mengubah kategori
* Menghapus kategori
* Mengambil data penerbit
* Menambahkan penerbit
* Mengubah penerbit
* Menghapus penerbit
* Mengambil seluruh artikel
* Mengambil detail artikel
* Menambahkan artikel
* Mengubah artikel
* Menghapus artikel
* Upload gambar artikel
* Validasi data menggunakan Zod
* Validasi ID pada endpoint
* Penghapusan file gambar yang sudah tidak digunakan
* Penanganan error API

## Validasi Data

Validasi request dilakukan menggunakan **Zod**.

### Kategori

Field `nama_kategori`:

* Wajib diisi
* Berupa string
* Minimal 1 karakter
* Maksimal 100 karakter

### Penerbit

Field `nama_penerbit`:

* Wajib diisi
* Berupa string
* Minimal 1 karakter
* Maksimal 100 karakter

### Artikel

Field yang divalidasi:

* `id_kategori` harus berupa bilangan bulat positif
* `id_penerbit` harus berupa bilangan bulat positif
* `judul_artikel` wajib diisi dan maksimal 200 karakter
* `isi_artikel` wajib diisi
* `penulis_artikel` wajib diisi dan maksimal 100 karakter

Gambar artikel ditangani oleh **Multer** sehingga tidak divalidasi menggunakan Zod.

## Upload Gambar

Gambar artikel disimpan di folder:

```text
uploads/
```

Format gambar yang diperbolehkan:

```text
.jpg
.jpeg
.png
.webp
```

Ukuran maksimal file:

```text
5 MB
```

Nama file akan dibuat secara unik agar tidak terjadi bentrok dengan file lain.

Gambar yang berada di folder `uploads` dapat diakses melalui:

```text
http://localhost:8000/uploads/nama-file.jpg
```

## API Endpoint

### Kategori

| Method | Endpoint            | Fungsi                   |
| ------ | ------------------- | ------------------------ |
| GET    | `/api/kategori`     | Mengambil semua kategori |
| POST   | `/api/kategori`     | Menambahkan kategori     |
| PUT    | `/api/kategori/:id` | Mengubah kategori        |
| DELETE | `/api/kategori/:id` | Menghapus kategori       |

### Penerbit

| Method | Endpoint            | Fungsi                   |
| ------ | ------------------- | ------------------------ |
| GET    | `/api/penerbit`     | Mengambil semua penerbit |
| POST   | `/api/penerbit`     | Menambahkan penerbit     |
| PUT    | `/api/penerbit/:id` | Mengubah penerbit        |
| DELETE | `/api/penerbit/:id` | Menghapus penerbit       |

### Artikel

| Method | Endpoint           | Fungsi                   |
| ------ | ------------------ | ------------------------ |
| GET    | `/api/artikel`     | Mengambil semua artikel  |
| GET    | `/api/artikel/:id` | Mengambil detail artikel |
| POST   | `/api/artikel`     | Menambahkan artikel      |
| PUT    | `/api/artikel/:id` | Mengubah artikel         |
| DELETE | `/api/artikel/:id` | Menghapus artikel        |

## HTTP Status Code

Backend menggunakan beberapa HTTP status code untuk menunjukkan hasil request.

| Status | Keterangan                                                           |
| ------ | -------------------------------------------------------------------- |
| `200`  | Request berhasil                                                     |
| `201`  | Data berhasil dibuat                                                 |
| `400`  | Data atau request tidak valid                                        |
| `404`  | Data tidak ditemukan                                                 |
| `409`  | Terjadi konflik dengan data yang sudah ada atau data masih digunakan |
| `500`  | Terjadi kesalahan pada server                                        |

## Relasi Database

Data artikel memiliki hubungan dengan kategori dan penerbit.

```text
kategori
   |
   | 1
   |
   | N
artikel
   |
   | N
   |
   | 1
penerbit
```

Artinya:

* Satu kategori dapat digunakan oleh banyak artikel.
* Satu artikel memiliki satu kategori.
* Satu penerbit dapat digunakan oleh banyak artikel.
* Satu artikel memiliki satu penerbit.

Relasi tersebut menggunakan foreign key:

```text
artikel.id_kategori
        ↓
kategori.id_kategori

artikel.id_penerbit
        ↓
penerbit.id_penerbit
```

## Alur Tambah Artikel

Proses penambahan artikel berjalan dengan urutan:

```text
Client
  ↓
POST /api/artikel
  ↓
Multer menerima gambar
  ↓
Validasi data dengan Zod
  ↓
Validasi berhasil?
  ├── Tidak → Hapus gambar → Response 400
  │
  └── Ya
       ↓
    Simpan data ke MySQL
       ↓
    Response 201
```

Jika gambar tidak sesuai format atau ukurannya lebih dari 5 MB, proses upload akan ditolak.

## Penanganan Gambar Saat Update

Ketika artikel diubah, gambar baru bersifat opsional.

Jika pengguna mengirim gambar baru:

```text
Gambar lama
     ↓
Gambar baru diupload
     ↓
Database menggunakan gambar baru
     ↓
Gambar lama dihapus
```

Jika pengguna tidak mengirim gambar baru, gambar lama tetap digunakan.

## Penanganan Saat Menghapus Artikel

Ketika artikel dihapus, backend terlebih dahulu mengambil lokasi gambar dari database.

Setelah data artikel berhasil dihapus, file gambar juga dihapus dari folder `uploads`.

Hal ini dilakukan agar file gambar yang sudah tidak digunakan tidak memenuhi penyimpanan server.

## Menjalankan Project

Install dependency terlebih dahulu:

```bash
npm install
```

Kemudian jalankan server:

```bash
npm run dev
```

Jika berhasil, server berjalan pada:

```text
http://localhost:8000
```

## Akses dari Android Emulator

Jika menggunakan Android Emulator, gunakan:

```text
http://10.0.2.2:8000
```

`10.0.2.2` digunakan oleh Android Emulator untuk mengakses `localhost` pada komputer.

## Akses dari HP Fisik

Jika aplikasi Flutter dijalankan pada HP fisik, gunakan alamat IP komputer yang berada pada jaringan yang sama.

Contoh:

```text
http://192.168.1.5:8000
```

Alamat IP disesuaikan dengan IP komputer yang menjalankan backend.

## Struktur Folder Sederhana

```text
project/
├── src/
│   ├── app.ts
│   └── db/
│       └── index.ts
├── uploads/
├── package.json
├── tsconfig.json
└── README.md
```

## Kesimpulan

`src/app.ts` merupakan bagian utama backend CicipYuk yang bertugas menyediakan REST API untuk aplikasi Flutter.

Backend menangani proses CRUD kategori, penerbit, dan artikel, serta menyediakan fitur upload gambar, validasi data, koneksi database MySQL, dan penanganan error.

Dengan adanya REST API ini, aplikasi Flutter dapat berkomunikasi dengan database melalui backend Express.js tanpa mengakses database secara langsung.
