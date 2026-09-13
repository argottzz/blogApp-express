// =====================================================
// Backend Artikel - versi sederhana untuk pemula
// -----------------------------------------------------
// CARA JALAN:
//   1. npm install
//   2. npm run dev
//   3. Buka http://localhost:8000
//
// CATATAN FLUTTER:
//   - HP/emulator tidak bisa pakai "localhost".
//     Emulator Android pakai: http://10.0.2.2:8000
//     HP asli pakai IP laptop, contoh: http://192.168.1.5:8000
//   - Semua jawaban dari server bentuknya JSON:
//     Sukses GET  -> { "message": "...", "data": [...] }
//     Sukses POST -> { "message": "..." }
//     Gagal      -> { "message": "..." }
//
// DAFTAR ENDPOINT (jangan diubah biar Flutter tidak error):
//   GET    /api/kategori
//   POST   /api/kategori          body JSON: { nama_kategori }
//   PUT    /api/kategori/:id      body JSON: { nama_kategori }
//   DELETE /api/kategori/:id
//
//   GET    /api/penerbit
//   POST   /api/penerbit          body JSON: { nama_penerbit }
//   PUT    /api/penerbit/:id      body JSON: { nama_penerbit }
//   DELETE /api/penerbit/:id
//
//   GET    /api/artikel
//   GET    /api/artikel/:id
//   POST   /api/artikel           body form-data + file kunci: gambar_artikel
//   PUT    /api/artikel/:id       body form-data + file kunci: gambar_artikel (boleh tanpa file)
//   DELETE /api/artikel/:id
//
//   Gambar bisa dibuka di: /uploads/namafile.jpg
//   Contoh: http://localhost:8000/uploads/12345.jpg
// =====================================================

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import pool from "./db/index.ts";

const app = express();
const port = 8000;

// Izinkan Flutter / web mengakses server ini
app.use(cors());

// Baca body JSON (untuk kategori & penerbit)
// dan form-data teks (untuk artikel)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Folder uploads ----
// Semua gambar disimpan di folder "uploads"
// dan bisa dibuka lewat http://localhost:8000/uploads/...
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// ---- Upload gambar (multer) ----
// Aturan: hanya jpg/jpeg/png/webp, maksimal 5MB
// Nama file dibuat unik biar tidak bentrok
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const namaUnik = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, namaUnik + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const boleh = [".jpg", ".jpeg", ".png", ".webp"];
    if (boleh.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file jpg, png, webp yang diperbolehkan"));
    }
  },
});

// ---- Aturan validasi (zod) ----
// Sama seperti streamerSchema di belajarExpress2,
// hanya beda nama field-nya saja.
const kategoriSchema = z.object({
  nama_kategori: z.string().min(1).max(100),
});

const penerbitSchema = z.object({
  nama_penerbit: z.string().min(1).max(100),
});

const artikelSchema = z.object({
  id_kategori: z.coerce.number().int().positive(),
  id_penerbit: z.coerce.number().int().positive(),
  judul_artikel: z.string().min(1).max(200),
  isi_artikel: z.string().min(1),
  penulis_artikel: z.string().min(1).max(100),
});

// =====================================================
// HELPER KECIL (biar tidak tulis kode yang sama berulang)
// =====================================================

// Hapus 1 file kalau ada. Dipakai saat artikel dihapus / diganti gambarnya.
function hapusFile(pathRelatif: string | null | undefined) {
  if (!pathRelatif) return;
  try {
    const full = path.join(process.cwd(), pathRelatif);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {}
}

// Hapus file yang baru di-upload kalau ternyata datanya gagal.
// Contoh: user upload gambar tapi judulnya kosong -> gambar sisa harus dibuang.
function hapusFileBaru(req: any) {
  if (req.file) {
    hapusFile(path.join("uploads", req.file.filename));
  }
}

// Cek ID di URL, contoh: /api/kategori/3 -> 3
// Kalau ID-nya aneh (huruf, 0, minus) langsung balas 400.
function cekId(req: any, res: any, nama: string): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: `ID ${nama} tidak valid` });
    return null;
  }
  return id;
}

// Cek body pakai zod. Kalau gagal langsung balas 400.
// Cara pakai: const data = cekValidasi(kategoriSchema, req.body, res); if (!data) return;
function cekValidasi(schema: any, body: any, res: any): any | null {
  const hasil = schema.safeParse(body);
  if (!hasil.success) {
    res.status(400).json({
      message: "Data tidak valid",
      error: hasil.error.issues,
    });
    return null;
  }
  return hasil.data;
}

// =====================================================
// KATEGORI
// =====================================================

app.get("/api/kategori", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM kategori ORDER BY id_kategori ASC"
    );
    res.json({ message: "Berhasil mengambil data kategori", data: rows });
  } catch {
    res.status(500).json({ message: "Gagal mengambil data kategori" });
  }
});

app.post("/api/kategori", async (req, res) => {
  try {
    const data = cekValidasi(kategoriSchema, req.body, res);
    if (!data) return;

    await pool.query("INSERT INTO kategori (nama_kategori) VALUES (?)", [
      data.nama_kategori,
    ]);
    res.status(201).json({ message: "Berhasil menambahkan kategori" });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama kategori sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal menambahkan kategori" });
  }
});

app.put("/api/kategori/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "kategori");
    if (!id) return;

    const data = cekValidasi(kategoriSchema, req.body, res);
    if (!data) return;

    const [result]: any = await pool.query(
      "UPDATE kategori SET nama_kategori = ? WHERE id_kategori = ?",
      [data.nama_kategori, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }
    res.json({ message: "Berhasil mengubah kategori" });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama kategori sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal mengubah kategori" });
  }
});

app.delete("/api/kategori/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "kategori");
    if (!id) return;

    const [result]: any = await pool.query(
      "DELETE FROM kategori WHERE id_kategori = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }
    res.json({ message: "Berhasil menghapus kategori" });
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Kategori tidak dapat dihapus karena masih digunakan oleh artikel",
      });
    }
    res.status(500).json({ message: "Gagal menghapus kategori" });
  }
});

// =====================================================
// PENERBIT (polanya sama persis dengan kategori)
// =====================================================

app.get("/api/penerbit", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM penerbit ORDER BY id_penerbit ASC"
    );
    res.json({ message: "Berhasil mengambil data penerbit", data: rows });
  } catch {
    res.status(500).json({ message: "Gagal mengambil data penerbit" });
  }
});

app.post("/api/penerbit", async (req, res) => {
  try {
    const data = cekValidasi(penerbitSchema, req.body, res);
    if (!data) return;

    await pool.query("INSERT INTO penerbit (nama_penerbit) VALUES (?)", [
      data.nama_penerbit,
    ]);
    res.status(201).json({ message: "Berhasil menambahkan penerbit" });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama penerbit sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal menambahkan penerbit" });
  }
});

app.put("/api/penerbit/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "penerbit");
    if (!id) return;

    const data = cekValidasi(penerbitSchema, req.body, res);
    if (!data) return;

    const [result]: any = await pool.query(
      "UPDATE penerbit SET nama_penerbit = ? WHERE id_penerbit = ?",
      [data.nama_penerbit, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Penerbit tidak ditemukan" });
    }
    res.json({ message: "Berhasil mengubah penerbit" });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama penerbit sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal mengubah penerbit" });
  }
});

app.delete("/api/penerbit/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "penerbit");
    if (!id) return;

    const [result]: any = await pool.query(
      "DELETE FROM penerbit WHERE id_penerbit = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Penerbit tidak ditemukan" });
    }
    res.json({ message: "Berhasil menghapus penerbit" });
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Penerbit tidak dapat dihapus karena masih digunakan oleh artikel",
      });
    }
    res.status(500).json({ message: "Gagal menghapus penerbit" });
  }
});

// =====================================================
// ARTIKEL
// =====================================================

// Ambil semua artikel + nama kategori & penerbitnya (JOIN)
app.get("/api/artikel", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT artikel.*, kategori.nama_kategori, penerbit.nama_penerbit
      FROM artikel
      JOIN kategori ON artikel.id_kategori = kategori.id_kategori
      JOIN penerbit ON artikel.id_penerbit = penerbit.id_penerbit
      ORDER BY artikel.id_artikel DESC
    `);
    res.json({ message: "Berhasil mengambil data artikel", data: rows });
  } catch {
    res.status(500).json({ message: "Gagal mengambil data artikel" });
  }
});

// Ambil 1 artikel berdasarkan ID
app.get("/api/artikel/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "artikel");
    if (!id) return;

    const [rows]: any = await pool.query(
      `
      SELECT artikel.*, kategori.nama_kategori, penerbit.nama_penerbit
      FROM artikel
      JOIN kategori ON artikel.id_kategori = kategori.id_kategori
      JOIN penerbit ON artikel.id_penerbit = penerbit.id_penerbit
      WHERE artikel.id_artikel = ?
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }
    res.json({ message: "Berhasil mengambil detail artikel", data: rows[0] });
  } catch {
    res.status(500).json({ message: "Gagal mengambil detail artikel" });
  }
});

// Tambah artikel + upload gambar (form-data, kunci file: gambar_artikel)
app.post("/api/artikel", upload.single("gambar_artikel"), async (req, res) => {
  try {
    const data = cekValidasi(artikelSchema, req.body, res);
    if (!data) {
      hapusFileBaru(req); // datanya salah -> buang gambarnya
      return;
    }

    // Kalau tidak upload gambar, simpan NULL. Kalau ada, simpan "uploads/namafile.jpg"
    const gambarPath = req.file ? `uploads/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO artikel
       (id_kategori, id_penerbit, judul_artikel, isi_artikel, penulis_artikel, gambar_artikel)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.id_kategori,
        data.id_penerbit,
        data.judul_artikel,
        data.isi_artikel,
        data.penulis_artikel,
        gambarPath,
      ]
    );
    res.status(201).json({ message: "Berhasil menambahkan artikel" });
  } catch (error: any) {
    hapusFileBaru(req); // gagal simpan ke DB -> buang gambarnya
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Kategori atau penerbit tidak ditemukan" });
    }
    res.status(500).json({ message: "Gagal menambahkan artikel" });
  }
});

// Ubah artikel. Boleh ganti gambar, boleh tidak.
// Trik sederhananya: gambarBaru = file baru kalau ada, kalau tidak pakai gambar lama.
app.put("/api/artikel/:id", upload.single("gambar_artikel"), async (req, res) => {
  try {
    const id = cekId(req, res, "artikel");
    if (!id) {
      hapusFileBaru(req);
      return;
    }

    const data = cekValidasi(artikelSchema, req.body, res);
    if (!data) {
      hapusFileBaru(req);
      return;
    }

    // 1. Cari gambar lama dulu
    const [oldRows]: any = await pool.query(
      "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
      [id]
    );
    if (oldRows.length === 0) {
      hapusFileBaru(req);
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }
    const gambarLama = oldRows[0].gambar_artikel;
    const gambarBaru = req.file ? `uploads/${req.file.filename}` : gambarLama;

    // 2. Update semuanya dalam 1 query (tidak perlu if/else 2 query)
    try {
      await pool.query(
        `UPDATE artikel SET
           id_kategori = ?, id_penerbit = ?, judul_artikel = ?,
           isi_artikel = ?, penulis_artikel = ?, gambar_artikel = ?
         WHERE id_artikel = ?`,
        [
          data.id_kategori,
          data.id_penerbit,
          data.judul_artikel,
          data.isi_artikel,
          data.penulis_artikel,
          gambarBaru,
          id,
        ]
      );
    } catch (error) {
      hapusFileBaru(req); // update gagal -> buang file baru
      throw error;
    }

    // 3. Kalau update sukses dan ada file baru, hapus file lama biar tidak menumpuk
    if (req.file && gambarLama) hapusFile(gambarLama);

    res.json({ message: "Berhasil mengubah artikel" });
  } catch (error: any) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Kategori atau penerbit tidak ditemukan" });
    }
    // Kalau error sudah dibalas di atas (400/404), jangan balas 2x
    if (res.headersSent) return;
    res.status(500).json({ message: "Gagal mengubah artikel" });
  }
});

// Hapus artikel + hapus file gambarnya
app.delete("/api/artikel/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "artikel");
    if (!id) return;

    const [rows]: any = await pool.query(
      "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    const [result]: any = await pool.query(
      "DELETE FROM artikel WHERE id_artikel = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    if (rows[0].gambar_artikel) hapusFile(rows[0].gambar_artikel);
    res.json({ message: "Berhasil menghapus artikel" });
  } catch {
    res.status(500).json({ message: "Gagal menghapus artikel" });
  }
});

// =====================================================
// PENANGAN ERROR UPLOAD (wajib paling bawah, sebelum listen)
// =====================================================
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    // File kebesaran (>5MB)
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Ukuran file maksimal 5MB" });
      }
      return res.status(400).json({ message: err.message });
    }
    // File bukan gambar
    if (err?.message === "Hanya file jpg, png, webp yang diperbolehkan") {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  }
);

app.listen(port, "0.0.0.0", () => {
  console.log(
    `Server berjalan di http://0.0.0.0:${port} dan http://localhost:${port}`
  );
});
