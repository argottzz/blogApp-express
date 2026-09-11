import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import pool from "./db/index.ts";

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

// Multer config: 1 gambar, 5MB, jpg/png/webp
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file jpg, png, webp yang diperbolehkan"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const kategoriSchema = z.object({
  nama_kategori: z.string().min(1).max(100),
  deskripsi_kategori: z.string().min(1),
});

const artikelSchema = z.object({
  id_kategori: z.coerce.number().int().positive(),
  judul_artikel: z.string().min(1).max(200),
  isi_artikel: z.string().min(1),
  penulis_artikel: z.string().min(1).max(100),
  lokasi_artikel: z.string().max(150).optional().or(z.literal("")),
  rating_artikel: z.coerce.number().min(0).max(5).optional(),
});

function deleteFileIfExists(relativePath: string | null | undefined) {
  if (!relativePath) return;
  try {
    const full = path.join(process.cwd(), relativePath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {}
}

app.get("/api/kategori", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM kategori");

    res.json({
      message: "Berhasil mengambil data kategori",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data kategori",
    });
  }
});

app.post("/api/kategori", async (req, res) => {
  try {
    const validation = kategoriSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Data tidak valid",
        error: validation.error.issues,
      });
    }

    const { nama_kategori, deskripsi_kategori } = validation.data;

    await pool.query(
      `INSERT INTO kategori
      (nama_kategori, deskripsi_kategori)
      VALUES (?, ?)`,
      [nama_kategori, deskripsi_kategori]
    );

    res.status(201).json({
      message: "Berhasil menambahkan kategori",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menambahkan kategori",
    });
  }
});

app.put("/api/kategori/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const validation = kategoriSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Data tidak valid",
        error: validation.error.issues,
      });
    }

    const { nama_kategori, deskripsi_kategori } = validation.data;

    const [result]: any = await pool.query(
      `UPDATE kategori
      SET nama_kategori = ?,
          deskripsi_kategori = ?
      WHERE id_kategori = ?`,
      [nama_kategori, deskripsi_kategori, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan",
      });
    }

    res.json({
      message: "Berhasil mengubah kategori",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengubah kategori",
    });
  }
});

app.delete("/api/kategori/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result]: any = await pool.query(
      "DELETE FROM kategori WHERE id_kategori = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan",
      });
    }

    res.json({
      message: "Berhasil menghapus kategori",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus kategori",
    });
  }
});

app.get("/api/artikel", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT artikel.*, kategori.nama_kategori
      FROM artikel
      JOIN kategori
      ON artikel.id_kategori = kategori.id_kategori
    `);

    res.json({
      message: "Berhasil mengambil data artikel",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data artikel",
    });
  }
});

app.post("/api/artikel", upload.single("gambar_artikel"), async (req, res) => {
  try {
    const validation = artikelSchema.safeParse(req.body);

    if (!validation.success) {
      if (req.file) deleteFileIfExists(path.join("uploads", req.file.filename));
      return res.status(400).json({
        message: "Data tidak valid",
        error: validation.error.issues,
      });
    }

    const {
      id_kategori,
      judul_artikel,
      isi_artikel,
      penulis_artikel,
      lokasi_artikel,
      rating_artikel,
    } = validation.data;

    const gambarPath = req.file ? `uploads/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO artikel
      (id_kategori, judul_artikel, isi_artikel, penulis_artikel, lokasi_artikel, rating_artikel, gambar_artikel)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_kategori,
        judul_artikel,
        isi_artikel,
        penulis_artikel,
        lokasi_artikel || null,
        rating_artikel ?? null,
        gambarPath,
      ]
    );

    res.status(201).json({
      message: "Berhasil menambahkan artikel",
    });
  } catch (error: any) {
    if (req.file) deleteFileIfExists(path.join("uploads", req.file.filename));
    res.status(500).json({
      message: "Gagal menambahkan artikel",
    });
  }
});

app.put("/api/artikel/:id", upload.single("gambar_artikel"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const validation = artikelSchema.safeParse(req.body);

    if (!validation.success) {
      if (req.file) deleteFileIfExists(path.join("uploads", req.file.filename));
      return res.status(400).json({
        message: "Data tidak valid",
        error: validation.error.issues,
      });
    }

    const {
      id_kategori,
      judul_artikel,
      isi_artikel,
      penulis_artikel,
      lokasi_artikel,
      rating_artikel,
    } = validation.data;

    // Ambil gambar lama untuk hapus jika ada file baru
    let oldGambar: string | null = null;
    if (req.file) {
      const [rows]: any = await pool.query(
        "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
        [id]
      );
      if (rows.length > 0) oldGambar = rows[0].gambar_artikel;
    }

    let query: string;
    let params: any[];

    if (req.file) {
      const gambarPath = `uploads/${req.file.filename}`;
      query = `UPDATE artikel
      SET id_kategori = ?,
          judul_artikel = ?,
          isi_artikel = ?,
          penulis_artikel = ?,
          lokasi_artikel = ?,
          rating_artikel = ?,
          gambar_artikel = ?
      WHERE id_artikel = ?`;
      params = [
        id_kategori,
        judul_artikel,
        isi_artikel,
        penulis_artikel,
        lokasi_artikel || null,
        rating_artikel ?? null,
        gambarPath,
        id,
      ];
    } else {
      query = `UPDATE artikel
      SET id_kategori = ?,
          judul_artikel = ?,
          isi_artikel = ?,
          penulis_artikel = ?,
          lokasi_artikel = ?,
          rating_artikel = ?
      WHERE id_artikel = ?`;
      params = [
        id_kategori,
        judul_artikel,
        isi_artikel,
        penulis_artikel,
        lokasi_artikel || null,
        rating_artikel ?? null,
        id,
      ];
    }

    const [result]: any = await pool.query(query, params);

    if (result.affectedRows === 0) {
      if (req.file) deleteFileIfExists(path.join("uploads", req.file.filename));
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    if (req.file && oldGambar) deleteFileIfExists(oldGambar);

    res.json({
      message: "Berhasil mengubah artikel",
    });
  } catch (error) {
    if (req.file) deleteFileIfExists(path.join("uploads", req.file.filename));
    res.status(500).json({
      message: "Gagal mengubah artikel",
    });
  }
});

app.delete("/api/artikel/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [rows]: any = await pool.query(
      "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
      [id]
    );
    const gambarToDelete = rows.length > 0 ? rows[0].gambar_artikel : null;

    const [result]: any = await pool.query(
      "DELETE FROM artikel WHERE id_artikel = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    if (gambarToDelete) deleteFileIfExists(gambarToDelete);

    res.json({
      message: "Berhasil menghapus artikel",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus artikel",
    });
  }
});

// Multer error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Ukuran file maksimal 5MB" });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err && err.message === "Hanya file jpg, png, webp yang diperbolehkan") {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server berjalan di http://0.0.0.0:${port} dan http://localhost:${port}`);
});
