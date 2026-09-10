import express from "express";
import cors from "cors";
import { z } from "zod";
import pool from "./db/index.ts";

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const kategoriSchema = z.object({
  nama_kategori: z.string().min(1).max(100),
  deskripsi_kategori: z.string().min(1),
});

const artikelSchema = z.object({
  id_kategori: z.number().int().positive(),
  judul_artikel: z.string().min(1).max(200),
  isi_artikel: z.string().min(1),
  penulis_artikel: z.string().min(1).max(100),
  lokasi_artikel: z.string().max(150).optional(),
  rating_artikel: z.number().min(0).max(5).optional(),
});

app.get("/api/kategori", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM kategori"
    );

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

    const {
      nama_kategori,
      deskripsi_kategori,
    } = validation.data;

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

    const {
      nama_kategori,
      deskripsi_kategori,
    } = validation.data;

    const [result]: any = await pool.query(
      `UPDATE kategori
      SET nama_kategori = ?,
          deskripsi_kategori = ?
      WHERE id_kategori = ?`,
      [
        nama_kategori,
        deskripsi_kategori,
        id,
      ]
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

app.post("/api/artikel", async (req, res) => {
  try {
    const validation = artikelSchema.safeParse(req.body);

    if (!validation.success) {
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

    await pool.query(
      `INSERT INTO artikel
      (id_kategori, judul_artikel, isi_artikel, penulis_artikel, lokasi_artikel, rating_artikel)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_kategori,
        judul_artikel,
        isi_artikel,
        penulis_artikel,
        lokasi_artikel,
        rating_artikel,
      ]
    );

    res.status(201).json({
      message: "Berhasil menambahkan artikel",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menambahkan artikel",
    });
  }
});

app.put("/api/artikel/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const validation = artikelSchema.safeParse(req.body);

    if (!validation.success) {
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

    const [result]: any = await pool.query(
      `UPDATE artikel
      SET id_kategori = ?,
          judul_artikel = ?,
          isi_artikel = ?,
          penulis_artikel = ?,
          lokasi_artikel = ?,
          rating_artikel = ?
      WHERE id_artikel = ?`,
      [
        id_kategori,
        judul_artikel,
        isi_artikel,
        penulis_artikel,
        lokasi_artikel,
        rating_artikel,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    res.json({
      message: "Berhasil mengubah artikel",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengubah artikel",
    });
  }
});

app.delete("/api/artikel/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result]: any = await pool.query(
      "DELETE FROM artikel WHERE id_artikel = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    res.json({
      message: "Berhasil menghapus artikel",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus artikel",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server berjalan di http://0.0.0.0:${port} dan http://localhost:${port}`);
}); 