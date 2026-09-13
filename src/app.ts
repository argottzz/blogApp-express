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

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const namaUnik = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, namaUnik + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
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

function hapusFile(pathRelatif: string | null | undefined) {
  if (!pathRelatif) return;
  try {
    const full = path.join(process.cwd(), pathRelatif);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {}
}

function hapusFileBaru(req: any) {
  if (req.file) {
    hapusFile(path.join("uploads", req.file.filename));
  }
}

function cekId(req: any, res: any, nama: string): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: `ID ${nama} tidak valid` });
    return null;
  }
  return id;
}

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

app.get("/api/kategori", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM kategori ORDER BY id_kategori ASC",
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
      [data.nama_kategori, id],
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
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }
    res.json({ message: "Berhasil menghapus kategori" });
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Kategori tidak dapat dihapus karena masih digunakan oleh artikel",
      });
    }
    res.status(500).json({ message: "Gagal menghapus kategori" });
  }
});

app.get("/api/penerbit", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM penerbit ORDER BY id_penerbit ASC",
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
      [data.nama_penerbit, id],
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
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Penerbit tidak ditemukan" });
    }
    res.json({ message: "Berhasil menghapus penerbit" });
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Penerbit tidak dapat dihapus karena masih digunakan oleh artikel",
      });
    }
    res.status(500).json({ message: "Gagal menghapus penerbit" });
  }
});

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
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }
    res.json({ message: "Berhasil mengambil detail artikel", data: rows[0] });
  } catch {
    res.status(500).json({ message: "Gagal mengambil detail artikel" });
  }
});

app.post("/api/artikel", upload.single("gambar_artikel"), async (req, res) => {
  try {
    const data = cekValidasi(artikelSchema, req.body, res);
    if (!data) {
      hapusFileBaru(req);
      return;
    }

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
      ],
    );
    res.status(201).json({ message: "Berhasil menambahkan artikel" });
  } catch (error: any) {
    hapusFileBaru(req);
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Kategori atau penerbit tidak ditemukan" });
    }
    res.status(500).json({ message: "Gagal menambahkan artikel" });
  }
});

app.put(
  "/api/artikel/:id",
  upload.single("gambar_artikel"),
  async (req, res) => {
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

      const [oldRows]: any = await pool.query(
        "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
        [id],
      );
      if (oldRows.length === 0) {
        hapusFileBaru(req);
        return res.status(404).json({ message: "Artikel tidak ditemukan" });
      }
      const gambarLama = oldRows[0].gambar_artikel;
      const gambarBaru = req.file ? `uploads/${req.file.filename}` : gambarLama;

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
          ],
        );
      } catch (error) {
        hapusFileBaru(req);
        throw error;
      }

      if (req.file && gambarLama) hapusFile(gambarLama);

      res.json({ message: "Berhasil mengubah artikel" });
    } catch (error: any) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res
          .status(400)
          .json({ message: "Kategori atau penerbit tidak ditemukan" });
      }
      if (res.headersSent) return;
      res.status(500).json({ message: "Gagal mengubah artikel" });
    }
  },
);

app.delete("/api/artikel/:id", async (req, res) => {
  try {
    const id = cekId(req, res, "artikel");
    if (!id) return;

    const [rows]: any = await pool.query(
      "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    const [result]: any = await pool.query(
      "DELETE FROM artikel WHERE id_artikel = ?",
      [id],
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

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Ukuran file maksimal 5MB" });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err?.message === "Hanya file jpg, png, webp yang diperbolehkan") {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  },
);

app.listen(port, "0.0.0.0", () => {
  console.log(
    `Server berjalan di http://0.0.0.0:${port} dan http://localhost:${port}`,
  );
});
