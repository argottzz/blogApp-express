  import express from "express";
  import cors from "cors";
  import { z } from "zod";
  import pool from "./db/index.ts";

  const app = express();
  const port = 8000;

  app.use(cors());
  app.use(express.json());

  const kategoriSchema = z.object({
    namast: z.string().min(1).max(50),
    kategorist: z.string().min(1).max(50),
    subscriber: z.number().int().min(0),
    views: z.number().int().min(0),
  });


  app.get("/api/kategori", async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM kategori"
      );

      res.json({
        message: "Berhasil mengambil data streamer",
        data: rows,
      });

    } catch (error) {
      res.status(500).json({
        message: "Gagal mengambil data streamer",
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
        namast,
        kategorist,
        subscriber,
        views
      } = validation.data;

      await pool.query(
        `INSERT INTO kategori
        (nama_kategori, deskripsi_kategori)
        VALUES (?, ?)`,
        [namast, kategorist, subscriber, views]
      );

      res.status(201).json({
        message: "Berhasil menambahkan streamer",
      });

    } catch (error) {
      res.status(500).json({
        message: "Gagal menambahkan streamer",
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
        namast,
        kategorist,
        subscriber,
        views
      } = validation.data;

      const [result]: any = await pool.query(
        `UPDATE kategori
        SET nama_kategori = ?,
            deskripsi_Kategori = ?,
        WHERE id = ?`,
        [namast, kategorist, subscriber, views, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Streamer tidak ditemukan",
        });
      }

      res.json({
        message: "Berhasil mengubah streamer",
      });

    } catch (error) {
      res.status(500).json({
        message: "Gagal mengubah streamer",
      });
    }
  });


  app.delete("/api/kategori/:id", async (req, res) => {
    try {

      const id = Number(req.params.id);

      const [result]: any = await pool.query(
        "DELETE FROM kategori WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Streamer tidak ditemukan",
        });
      }

      res.json({
        message: "Berhasil menghapus streamer",
      });

    } catch (error) {
      res.status(500).json({
        message: "Gagal menghapus streamer",
      });
    }
  });


  app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
  });