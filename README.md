# Dokumentasi API Express Blog Kuliner

Project ini adalah backend REST API menggunakan **Express.js + TypeScript** untuk mengelola artikel kuliner. Data disimpan di MySQL, sedangkan gambar artikel disimpan di folder `uploads/`.

## 1. Teknologi yang digunakan

- **Express**: membuat server HTTP dan route API.
- **TypeScript**: memberi tipe pada kode JavaScript.
- **MySQL2**: menghubungkan aplikasi dengan database MySQL.
- **CORS**: mengizinkan aplikasi Flutter atau web mengakses API.
- **Multer**: menerima upload file gambar melalui `multipart/form-data`.
- **Zod**: memvalidasi data yang dikirim client.
- **tsx**: menjalankan TypeScript secara langsung saat development.

## 2. Struktur folder

```text
praktekS1-express/
├── package.json          # Dependensi dan perintah project
├── tsconfig.json         # Konfigurasi TypeScript
├── README.md             # Dokumentasi ini
├── uploads/              # File gambar artikel
└── src/
    ├── app.ts            # Server, middleware, helper, dan semua route
    └── db/
        └── index.ts      # Koneksi ke MySQL
```

## 3. Cara menjalankan project

Pastikan MySQL aktif dan database `db_blogapp_cicipyuk` sudah tersedia.

```bash
npm install
npm run dev
```

Server berjalan pada:

```text
http://localhost:8000
```

Untuk Android Emulator:

```text
http://10.0.2.2:8000
```

Untuk HP fisik, gunakan IP laptop, misalnya:

```text
http://192.168.1.5:8000
```

## 4. Dokumentasi `src/db/index.ts` per baris

```ts
import mysql from "mysql2/promise";
```

Mengimpor versi Promise dari library `mysql2`. Dengan Promise, query dapat dipakai bersama `async` dan `await`.

```ts
const pool = await mysql.createPool({
```

Membuat **connection pool**, yaitu kumpulan koneksi database yang dapat digunakan berulang kali oleh banyak request.

```ts
  host: "localhost",
```

Menentukan lokasi server MySQL. `localhost` berarti MySQL berjalan pada komputer yang sama.

```ts
  user: "root",
```

Menentukan username MySQL yang digunakan aplikasi.

```ts
  database: "db_blogapp_cicipyuk",
```

Menentukan database yang dipakai. Database ini harus sudah dibuat di MySQL.

```ts
});
```

Menutup konfigurasi dan membuat pool koneksi.

```ts
export default pool;
```

Mengekspor pool agar dapat digunakan oleh `src/app.ts`.

> Catatan keamanan: username, password, dan nama database sebaiknya dipindahkan ke environment variable pada project production.

## 5. Dokumentasi `src/app.ts` per bagian kode

### 5.1 Import library

```ts
import express from "express";
```

Mengimpor Express untuk membuat aplikasi server dan endpoint.

```ts
import cors from "cors";
```

Mengimpor middleware CORS agar request dari origin lain, termasuk aplikasi Flutter, tidak diblokir browser.

```ts
import multer from "multer";
```

Mengimpor Multer untuk membaca file upload dari request `multipart/form-data`.

```ts
import path from "path";
import fs from "fs";
```

- `path` membantu membuat path file yang sesuai dengan sistem operasi.
- `fs` digunakan untuk mengecek, membuat, dan menghapus file atau folder.

```ts
import { z } from "zod";
```

Mengimpor Zod untuk membuat aturan validasi body request.

```ts
import pool from "./db/index.ts";
```

Mengambil koneksi database dari file `src/db/index.ts`.

### 5.2 Membuat aplikasi dan middleware dasar

```ts
const app = express();
const port = 8000;
```

- `express()` membuat instance aplikasi Express.
- Server akan menggunakan port `8000`.

```ts
app.use(cors());
```

Mengaktifkan CORS untuk semua route.

```ts
app.use(express.json());
```

Membaca body JSON dan memasukkannya ke `req.body`. Dipakai oleh endpoint kategori dan penerbit.

```ts
app.use(express.urlencoded({ extended: true }));
```

Membaca data teks dari form URL encoded atau form-data. Data artikel tetap diproses bersama Multer.

### 5.3 Menyiapkan folder gambar

```ts
const uploadDir = path.join(process.cwd(), "uploads");
```

Membuat lokasi absolut folder `uploads` berdasarkan folder utama project.

```ts
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

Jika folder `uploads` belum ada, folder dibuat otomatis. Opsi `recursive: true` juga membuat folder induk jika diperlukan.

```ts
app.use("/uploads", express.static(uploadDir));
```

Membuat file di folder `uploads` dapat diakses melalui URL `/uploads/nama-file`.

Contoh:

```text
http://localhost:8000/uploads/contoh.jpg
```

### 5.4 Konfigurasi Multer

```ts
const upload = multer({
```

Membuat konfigurasi upload file.

```ts
  storage: multer.diskStorage({
```

Menentukan bahwa file akan disimpan langsung ke disk, bukan hanya di memory.

```ts
    destination: (_req, _file, cb) => cb(null, uploadDir),
```

Menentukan folder tujuan file. Tanda `_` berarti parameter request dan file tidak digunakan di fungsi tersebut.

```ts
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const namaUnik = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, namaUnik + ext);
    },
```

- Mengambil ekstensi file asli, misalnya `.jpg`.
- Membuat nama baru dari waktu sekarang dan angka acak.
- Menghindari bentrokan nama file.
- `cb(null, namaFile)` berarti proses penyimpanan berhasil.

```ts
  limits: { fileSize: 5 * 1024 * 1024 },
```

Membatasi ukuran file sampai 5 MB.

```ts
  fileFilter: (_req, file, cb) => {
```

Membuat filter sebelum file disimpan.

```ts
const ext = path.extname(file.originalname).toLowerCase();
const boleh = [".jpg", ".jpeg", ".png", ".webp"];
```

Mengambil ekstensi file dan menentukan daftar ekstensi yang diperbolehkan.

```ts
if (boleh.includes(ext)) {
  cb(null, true);
} else {
  cb(new Error("Hanya file jpg, png, webp yang diperbolehkan"));
}
```

Jika ekstensi ada di daftar, upload diterima. Jika tidak, upload ditolak dengan error.

### 5.5 Schema validasi Zod

```ts
const kategoriSchema = z.object({
  nama_kategori: z.string().min(1).max(100),
});
```

Body kategori harus memiliki `nama_kategori` berupa string dengan panjang 1 sampai 100 karakter.

```ts
const penerbitSchema = z.object({
  nama_penerbit: z.string().min(1).max(100),
});
```

Body penerbit harus memiliki `nama_penerbit` berupa string dengan panjang 1 sampai 100 karakter.

```ts
const artikelSchema = z.object({
  id_kategori: z.coerce.number().int().positive(),
  id_penerbit: z.coerce.number().int().positive(),
  judul_artikel: z.string().min(1).max(200),
  isi_artikel: z.string().min(1),
  penulis_artikel: z.string().min(1).max(100),
});
```

Aturan data artikel:

- ID kategori dan ID penerbit diubah ke number, harus bilangan bulat positif.
- Judul wajib diisi dan maksimal 200 karakter.
- Isi wajib diisi.
- Penulis wajib diisi dan maksimal 100 karakter.
- Field gambar tidak ada di schema karena diproses oleh Multer sebagai file.

### 5.6 Helper `hapusFile`

```ts
function hapusFile(pathRelatif: string | null | undefined) {
```

Membuat fungsi untuk menghapus file berdasarkan path relatif. Nilai `null` atau `undefined` diperbolehkan.

```ts
if (!pathRelatif) return;
```

Menghentikan fungsi jika tidak ada path file.

```ts
try {
  const full = path.join(process.cwd(), pathRelatif);
  if (fs.existsSync(full)) fs.unlinkSync(full);
} catch {}
```

- Mengubah path relatif menjadi path lengkap.
- Mengecek apakah file ada.
- Menghapus file jika ditemukan.
- Error penghapusan diabaikan agar response API tidak gagal hanya karena file lama bermasalah.

### 5.7 Helper `hapusFileBaru`

```ts
function hapusFileBaru(req: any) {
  if (req.file) {
    hapusFile(path.join("uploads", req.file.filename));
  }
}
```

Menghapus file yang baru di-upload ketika validasi atau penyimpanan database gagal. Ini mencegah file yatim yang tidak memiliki data artikel.

### 5.8 Helper `cekId`

```ts
const id = Number(req.params.id);
```

Mengubah nilai `:id` dari URL, yang awalnya berupa string, menjadi number.

```ts
if (!Number.isInteger(id) || id <= 0) {
```

Mengecek bahwa ID adalah bilangan bulat positif.

```ts
res.status(400).json({ message: `ID ${nama} tidak valid` });
return null;
```

Mengirim status `400 Bad Request` jika ID tidak valid dan menghentikan proses route.

```ts
return id;
```

Mengembalikan ID yang sudah valid kepada route.

### 5.9 Helper `cekValidasi`

```ts
const hasil = schema.safeParse(body);
```

Memeriksa body menggunakan schema tanpa langsung melempar exception.

```ts
if (!hasil.success) {
  res.status(400).json({
    message: "Data tidak valid",
    error: hasil.error.issues,
  });
  return null;
}
```

Jika data salah, server mengirim status `400` dan detail error validasi.

```ts
return hasil.data;
```

Jika valid, data yang sudah diproses Zod dikembalikan ke route.

## 6. Endpoint kategori

Semua endpoint kategori menggunakan tabel `kategori` dan kolom `id_kategori` serta `nama_kategori`.

### `GET /api/kategori`

Mengambil seluruh kategori dan mengurutkannya berdasarkan ID naik.

Query yang digunakan:

```sql
SELECT * FROM kategori ORDER BY id_kategori ASC
```

Response sukses: `200`

```json
{
  "message": "Berhasil mengambil data kategori",
  "data": []
}
```

### `POST /api/kategori`

Menambahkan kategori baru.

Header:

```text
Content-Type: application/json
```

Body:

```json
{
  "nama_kategori": "Makanan Tradisional"
}
```

Response sukses: `201`.

Jika nama sudah digunakan, response `409`. Jika body tidak valid, response `400`.

### `PUT /api/kategori/:id`

Mengubah kategori berdasarkan ID.

Contoh URL:

```text
PUT /api/kategori/3
```

Body:

```json
{
  "nama_kategori": "Dessert"
}
```

Jika ID tidak ditemukan, response `404`. Jika kategori masih dipakai artikel saat dihapus, response `409`.

### `DELETE /api/kategori/:id`

Menghapus kategori berdasarkan ID. Kategori yang masih digunakan oleh artikel tidak dapat dihapus karena foreign key database.

## 7. Endpoint penerbit

Endpoint penerbit memiliki pola yang sama dengan kategori, tetapi menggunakan tabel `penerbit`.

### `GET /api/penerbit`

Mengambil semua penerbit.

### `POST /api/penerbit`

Body JSON:

```json
{
  "nama_penerbit": "Kuliner Nusantara"
}
```

### `PUT /api/penerbit/:id`

Mengubah nama penerbit berdasarkan ID.

### `DELETE /api/penerbit/:id`

Menghapus penerbit jika belum digunakan artikel.

## 8. Endpoint artikel

### `GET /api/artikel`

Mengambil semua artikel sekaligus nama kategori dan penerbitnya.

Query memakai `JOIN`:

```sql
FROM artikel
JOIN kategori ON artikel.id_kategori = kategori.id_kategori
JOIN penerbit ON artikel.id_penerbit = penerbit.id_penerbit
```

Hasil diurutkan dari artikel terbaru berdasarkan `id_artikel DESC`.

### `GET /api/artikel/:id`

Mengambil satu artikel berdasarkan ID. Jika tidak ada, response `404`.

Contoh:

```text
GET /api/artikel/5
```

### `POST /api/artikel`

Menambahkan artikel dan boleh meng-upload gambar.

Header:

```text
Content-Type: multipart/form-data
```

Field teks:

```text
id_kategori=1
id_penerbit=2
judul_artikel=Resep Seblak Pedas
isi_artikel=Seblak adalah makanan...
penulis_artikel=Andi
```

Field file:

```text
gambar_artikel=<file jpg/png/webp maksimal 5MB>
```

Gambar bersifat opsional. Jika ada gambar, path seperti `uploads/12345.jpg` disimpan di database.

Alur route:

1. Multer menerima dan menyimpan file.
2. `cekValidasi` memvalidasi field teks.
3. Jika validasi gagal, `hapusFileBaru` menghapus file yang sudah terlanjur disimpan.
4. Data artikel dimasukkan ke database.
5. Jika foreign key kategori atau penerbit tidak ada, file baru juga dihapus.
6. Server mengirim response `201`.

### `PUT /api/artikel/:id`

Mengubah data artikel. File gambar boleh dikirim, tetapi boleh juga tidak.

Jika tidak ada file baru, gambar lama dipertahankan. Jika ada file baru:

1. Server mencari gambar lama.
2. Server meng-update semua data dan path gambar dalam satu query.
3. Jika update gagal, file baru dihapus.
4. Jika update berhasil, file lama dihapus.

### `DELETE /api/artikel/:id`

Menghapus artikel berdasarkan ID.

Alurnya:

1. Validasi ID.
2. Ambil path gambar artikel.
3. Hapus data artikel dari database.
4. Hapus file gambar dari folder `uploads` jika ada.
5. Kirim response sukses.

## 9. Error handler upload

Error handler ini harus diletakkan setelah semua route dan sebelum `app.listen`.

```ts
if (err instanceof multer.MulterError) {
```

Mendeteksi error khusus dari Multer.

```ts
if (err.code === "LIMIT_FILE_SIZE") {
  return res.status(400).json({ message: "Ukuran file maksimal 5MB" });
}
```

Mengubah error ukuran file menjadi response JSON yang mudah dibaca client.

```ts
if (err?.message === "Hanya file jpg, png, webp yang diperbolehkan") {
```

Menangani file dengan ekstensi yang tidak diizinkan.

```ts
if (err) {
  console.error(err);
  return res.status(500).json({ message: "Terjadi kesalahan server" });
}
```

Menangani error lain sebagai `500 Internal Server Error`.

## 10. Menjalankan server

```ts
app.listen(port, "0.0.0.0", () => {
```

Menjalankan server pada port `8000` dan semua interface jaringan. Penggunaan `0.0.0.0` membuat server dapat diakses dari emulator atau perangkat lain dalam jaringan yang sama.

```ts
console.log(
  `Server berjalan di http://0.0.0.0:${port} dan http://localhost:${port}`,
);
```

Menampilkan alamat server di terminal saat server berhasil dijalankan.

## 11. Ringkasan status HTTP

| Status | Arti                          | Contoh penggunaan                              |
| ------ | ----------------------------- | ---------------------------------------------- |
| `200`  | Berhasil                      | GET, PUT, DELETE berhasil                      |
| `201`  | Berhasil membuat data         | POST berhasil                                  |
| `400`  | Request atau data tidak valid | ID salah, body salah, file terlalu besar       |
| `404`  | Data tidak ditemukan          | ID artikel tidak ada                           |
| `409`  | Konflik data                  | Nama duplikat atau foreign key masih digunakan |
| `500`  | Kesalahan server/database     | Query gagal atau error tak terduga             |

## 12. Daftar endpoint singkat

| Method | Endpoint            | Fungsi                           |
| ------ | ------------------- | -------------------------------- |
| GET    | `/api/kategori`     | Ambil semua kategori             |
| POST   | `/api/kategori`     | Tambah kategori                  |
| PUT    | `/api/kategori/:id` | Ubah kategori                    |
| DELETE | `/api/kategori/:id` | Hapus kategori                   |
| GET    | `/api/penerbit`     | Ambil semua penerbit             |
| POST   | `/api/penerbit`     | Tambah penerbit                  |
| PUT    | `/api/penerbit/:id` | Ubah penerbit                    |
| DELETE | `/api/penerbit/:id` | Hapus penerbit                   |
| GET    | `/api/artikel`      | Ambil semua artikel              |
| GET    | `/api/artikel/:id`  | Ambil detail artikel             |
| POST   | `/api/artikel`      | Tambah artikel dan gambar        |
| PUT    | `/api/artikel/:id`  | Ubah artikel dan opsional gambar |
| DELETE | `/api/artikel/:id`  | Hapus artikel dan gambar         |
