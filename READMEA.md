# KISI-KISI UJIAN KELAS XI RPL

Dokumen ini berisi ringkasan materi dan kompetensi yang perlu dipahami untuk ujian. Contoh-contoh di bawah disesuaikan dengan project backend CicipYuk yang menggunakan Node.js, Express.js, TypeScript, MySQL, dan JSON.

## 1. REST API

### Materi

REST API adalah aturan atau pendekatan untuk membuat komunikasi antara client dan server melalui protokol HTTP. REST API memungkinkan client, seperti aplikasi Flutter, untuk meminta atau mengirim data ke server.

### Kompetensi yang Harus Dipahami

Siswa dapat:

- Menjelaskan pengertian REST API.
- Menjelaskan fungsi REST API sebagai penghubung antara client dan server.
- Memahami bahwa data API pada project ini digunakan untuk mengelola kategori, penerbit, dan artikel.

Contoh komunikasi:

```text
Aplikasi Flutter (client)
        |
        | Request HTTP
        v
REST API Express.js (server)
        |
        | Query SQL
        v
Database MySQL
```

## 2. Endpoint

### Materi

Endpoint adalah alamat atau URL tertentu yang disediakan API untuk mengakses suatu resource atau menjalankan fungsi tertentu.

### Kompetensi yang Harus Dipahami

Siswa dapat:

- Menjelaskan pengertian endpoint.
- Memahami struktur endpoint yang terdiri dari method HTTP, URL, dan parameter jika diperlukan.
- Membaca fungsi endpoint berdasarkan alamat dan method-nya.

Contoh:

```text
GET /api/artikel/:id
```

Keterangan:

- `GET` adalah method HTTP.
- `/api/artikel` adalah resource artikel.
- `:id` adalah parameter untuk menentukan artikel tertentu.

## 3. HTTP Method

### Materi

HTTP method menunjukkan jenis operasi yang ingin dilakukan client terhadap resource pada server.

### Kompetensi yang Harus Dipahami

| Method   | Fungsi                                       | Contoh                     |
| -------- | -------------------------------------------- | -------------------------- |
| `GET`    | Mengambil data                               | `GET /api/kategori`        |
| `POST`   | Menambahkan data baru                        | `POST /api/kategori`       |
| `PUT`    | Mengubah seluruh data atau data yang dikirim | `PUT /api/kategori/:id`    |
| `PATCH`  | Mengubah sebagian data                       | `PATCH /api/kategori/:id`  |
| `DELETE` | Menghapus data                               | `DELETE /api/kategori/:id` |

Siswa harus dapat membedakan method sesuai operasi yang dilakukan.

## 4. HTTP Status Code

### Materi

HTTP status code adalah kode yang dikirim server untuk menjelaskan hasil request dari client.

### Kompetensi yang Harus Dipahami

| Status Code                 | Arti                          | Contoh penggunaan                                    |
| --------------------------- | ----------------------------- | ---------------------------------------------------- |
| `200 OK`                    | Request berhasil              | Berhasil mengambil, mengubah, atau menghapus data    |
| `201 Created`               | Data berhasil dibuat          | Berhasil menambahkan kategori atau artikel           |
| `400 Bad Request`           | Request atau data tidak valid | ID tidak valid atau field wajib belum diisi          |
| `404 Not Found`             | Data tidak ditemukan          | ID artikel atau kategori tidak ada                   |
| `409 Conflict`              | Terjadi konflik data          | Nama sudah digunakan atau data masih memiliki relasi |
| `500 Internal Server Error` | Terjadi kesalahan pada server | Database atau proses server mengalami masalah        |

## 5. JSON

### Materi

JSON adalah format data berbentuk teks yang sering digunakan untuk komunikasi antara client dan server. JSON memiliki pasangan key dan value.

### Kompetensi yang Harus Dipahami

Siswa dapat:

- Memahami struktur object JSON.
- Membaca JSON sebagai request dari client.
- Membaca JSON sebagai response dari server.

Contoh request JSON:

```json
{
  "nama_kategori": "Resep"
}
```

Contoh response JSON:

```json
{
  "message": "Berhasil mengambil data kategori",
  "data": [
    {
      "id_kategori": 1,
      "nama_kategori": "Resep"
    }
  ]
}
```

## 6. Express.js Basic

### Materi

Express.js adalah framework Node.js yang digunakan untuk membuat server dan REST API.

### Kompetensi yang Harus Dipahami

Siswa dapat memahami:

- Pembuatan object server dengan `express()`.
- Penggunaan `app.listen()` untuk menjalankan server.
- Pembuatan routing dengan `app.get()`, `app.post()`, `app.put()`, dan `app.delete()`.
- Penggunaan middleware dasar.
- Penggunaan request dan response.

Contoh dasar:

```ts
import express from "express";

const app = express();
const port = 8000;

app.use(express.json());

app.get("/api/contoh", (_req, res) => {
  res.json({ message: "Berhasil" });
});

app.listen(port, () => {
  console.log(`Server berjalan pada port ${port}`);
});
```

## 7. Routing

### Materi

Routing adalah proses menentukan response berdasarkan URL dan HTTP method yang diterima server.

### Kompetensi yang Harus Dipahami

Siswa dapat membaca dan memahami fungsi route berdasarkan endpoint dan HTTP method.

Contoh route pada project:

```ts
app.get("/api/artikel", async (_req, res) => {
  // Mengambil seluruh data artikel
});

app.post("/api/artikel", async (req, res) => {
  // Menambahkan artikel baru
});
```

Route pertama digunakan untuk membaca artikel, sedangkan route kedua digunakan untuk membuat artikel baru.

## 8. Request & Response

### Materi

Request adalah data atau permintaan yang dikirim client ke server. Response adalah balasan yang dikirim server kepada client.

### Kompetensi yang Harus Dipahami

Siswa dapat memahami penggunaan `req` dan `res` dalam endpoint.

Bagian request yang umum digunakan:

- `req.body`: mengambil data yang dikirim dalam body request.
- `req.params`: mengambil parameter dari URL, misalnya `:id`.
- `req.query`: mengambil parameter query pada URL.
- `req.file`: mengambil file yang diunggah dengan Multer.

Bagian response yang umum digunakan:

- `res.json()`: mengirim response dalam format JSON.
- `res.status()`: menentukan HTTP status code.

Contoh:

```ts
app.get("/api/kategori/:id", (req, res) => {
  const id = req.params.id;
  res.status(200).json({ id });
});
```

## 9. CRUD

### Materi

CRUD adalah empat operasi utama dalam pengelolaan data:

- **Create**: membuat atau menambahkan data.
- **Read**: membaca atau mengambil data.
- **Update**: mengubah data.
- **Delete**: menghapus data.

### Kompetensi yang Harus Dipahami

Siswa dapat menjelaskan dan memahami penerapan CRUD dalam aplikasi.

Contoh CRUD pada data kategori:

| Operasi | Kegiatan                  |
| ------- | ------------------------- |
| Create  | Menambahkan kategori baru |
| Read    | Mengambil daftar kategori |
| Update  | Mengubah nama kategori    |
| Delete  | Menghapus kategori        |

## 10. CRUD pada REST API

### Materi

CRUD diterapkan pada REST API menggunakan HTTP method yang sesuai.

### Kompetensi yang Harus Dipahami

| Operasi CRUD | HTTP Method        | Endpoint contoh    |
| ------------ | ------------------ | ------------------ |
| Create       | `POST`             | `/api/artikel`     |
| Read         | `GET`              | `/api/artikel`     |
| Read detail  | `GET`              | `/api/artikel/:id` |
| Update       | `PUT` atau `PATCH` | `/api/artikel/:id` |
| Delete       | `DELETE`           | `/api/artikel/:id` |

Siswa harus dapat menentukan method yang tepat untuk setiap operasi CRUD.

## 11. Database

### Materi

Database digunakan untuk menyimpan data secara terstruktur. API menjadi penghubung antara client dan database.

### Kompetensi yang Harus Dipahami

Siswa dapat memahami bahwa API dapat:

- Mengambil data dari database dengan `SELECT`.
- Menambahkan data dengan `INSERT`.
- Mengubah data dengan `UPDATE`.
- Menghapus data dengan `DELETE`.

Pada project ini, koneksi database dikelola melalui `src/db/index.ts` dan query dijalankan menggunakan MySQL.

Contoh query:

```ts
const [rows] = await pool.query(
  "SELECT * FROM kategori ORDER BY id_kategori ASC",
);
```

## 12. Validasi Data

### Materi

Validasi data adalah proses memeriksa data yang diterima API sebelum data diproses atau disimpan ke database.

### Kompetensi yang Harus Dipahami

Siswa dapat memahami proses pengecekan data sebelum diproses oleh server.

Pada project ini, validasi dilakukan menggunakan Zod. Contoh schema kategori:

```ts
const kategoriSchema = z.object({
  nama_kategori: z.string().min(1).max(100),
});
```

Artinya, `nama_kategori` wajib berupa string, minimal memiliki 1 karakter, dan maksimal 100 karakter. Jika data tidak sesuai, server mengirim status `400`.

## 13. Pemahaman Kode

### Materi

Siswa perlu memahami kode program yang telah dibuat, bukan hanya menghafal sintaksnya.

### Kompetensi yang Harus Dipahami

Siswa dapat menjelaskan:

- Fungsi import seperti Express, CORS, Multer, Zod, dan koneksi database.
- Fungsi `express.json()` untuk membaca request JSON.
- Fungsi route dan perbedaan setiap HTTP method.
- Fungsi validasi data menggunakan schema.
- Fungsi query database.
- Alasan server mengirim status code tertentu.
- Fungsi `try...catch` untuk menangani error.

Contoh alur satu endpoint:

```ts
app.post("/api/kategori", async (req, res) => {
  const data = cekValidasi(kategoriSchema, req.body, res);
  if (!data) return;

  await pool.query("INSERT INTO kategori (nama_kategori) VALUES (?)", [
    data.nama_kategori,
  ]);

  res.status(201).json({ message: "Berhasil menambahkan kategori" });
});
```

Endpoint tersebut menerima request, memvalidasi body, menyimpan data ke database, lalu mengirim response `201`.

## 14. Alur Program

### Materi

Alur program API menjelaskan perjalanan request dari client sampai menjadi response.

### Kompetensi yang Harus Dipahami

Siswa dapat menjelaskan alur:

```text
Client
  -> Endpoint
  -> Server Express.js
  -> Validasi data
  -> Database MySQL
  -> Response
  -> Client
```

Contoh alur menambahkan kategori:

1. Client mengirim `POST /api/kategori` dengan data JSON.
2. Express menerima request melalui route yang sesuai.
3. Server mengambil data dari `req.body`.
4. Data diperiksa menggunakan validasi Zod.
5. Jika valid, server menjalankan query `INSERT` ke database.
6. Server mengirim response dengan status `201`.
7. Client menerima response dari server.

Jika validasi gagal, proses dihentikan dan server mengirim status `400`. Jika terjadi masalah pada server atau database, server mengirim status `500`.

## Ringkasan yang Perlu Diingat

- REST API menghubungkan client dan server.
- Endpoint adalah alamat untuk mengakses resource API.
- HTTP method menentukan jenis operasi yang dilakukan.
- Status code menjelaskan hasil request.
- JSON digunakan sebagai format data request dan response.
- Express.js menyediakan server, route, middleware, request, dan response.
- CRUD terdiri dari Create, Read, Update, dan Delete.
- Database menyimpan data yang dikelola oleh API.
- Validasi mencegah data yang salah diproses server.
- Alur umum API adalah `Client -> Endpoint -> Server -> Database -> Response`.
