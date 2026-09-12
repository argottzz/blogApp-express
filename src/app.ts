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

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(null, unique + ext);
    },
});

const allowedMime = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const allowedExt = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
];

const fileFilter: multer.Options["fileFilter"] = (
    _req,
    file,
    cb
) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
        allowedMime.includes(file.mimetype) &&
        allowedExt.includes(ext)
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Hanya file jpg, png, webp yang diperbolehkan"
            )
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
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

function deleteFileIfExists(
    relativePath: string | null | undefined
) {
    if (!relativePath) return;

    try {
        const full = path.join(
            process.cwd(),
            relativePath
        );

        if (fs.existsSync(full)) {
            fs.unlinkSync(full);
        }
    } catch {}
}

app.get("/api/kategori", async (_req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM kategori ORDER BY id_kategori ASC"
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
        const validation = kategoriSchema.safeParse(
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                message: "Data tidak valid",
                error: validation.error.issues,
            });
        }

        const { nama_kategori } = validation.data;

        await pool.query(
            `INSERT INTO kategori
            (nama_kategori)
            VALUES (?)`,
            [nama_kategori]
        );

        res.status(201).json({
            message: "Berhasil menambahkan kategori",
        });
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Nama kategori sudah digunakan",
            });
        }

        res.status(500).json({
            message: "Gagal menambahkan kategori",
        });
    }
});

app.put("/api/kategori/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID kategori tidak valid",
            });
        }

        const validation = kategoriSchema.safeParse(
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                message: "Data tidak valid",
                error: validation.error.issues,
            });
        }

        const { nama_kategori } = validation.data;

        const [result]: any = await pool.query(
            `UPDATE kategori
            SET nama_kategori = ?
            WHERE id_kategori = ?`,
            [
                nama_kategori,
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
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Nama kategori sudah digunakan",
            });
        }

        res.status(500).json({
            message: "Gagal mengubah kategori",
        });
    }
});

app.delete("/api/kategori/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID kategori tidak valid",
            });
        }

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
    } catch (error: any) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message:
                    "Kategori tidak dapat dihapus karena masih digunakan oleh artikel",
            });
        }

        res.status(500).json({
            message: "Gagal menghapus kategori",
        });
    }
});

app.get("/api/penerbit", async (_req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM penerbit ORDER BY id_penerbit ASC"
        );

        res.json({
            message: "Berhasil mengambil data penerbit",
            data: rows,
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data penerbit",
        });
    }
});

app.post("/api/penerbit", async (req, res) => {
    try {
        const validation = penerbitSchema.safeParse(
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                message: "Data tidak valid",
                error: validation.error.issues,
            });
        }

        const { nama_penerbit } = validation.data;

        await pool.query(
            `INSERT INTO penerbit
            (nama_penerbit)
            VALUES (?)`,
            [nama_penerbit]
        );

        res.status(201).json({
            message: "Berhasil menambahkan penerbit",
        });
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Nama penerbit sudah digunakan",
            });
        }

        res.status(500).json({
            message: "Gagal menambahkan penerbit",
        });
    }
});

app.put("/api/penerbit/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID penerbit tidak valid",
            });
        }

        const validation = penerbitSchema.safeParse(
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                message: "Data tidak valid",
                error: validation.error.issues,
            });
        }

        const { nama_penerbit } = validation.data;

        const [result]: any = await pool.query(
            `UPDATE penerbit
            SET nama_penerbit = ?
            WHERE id_penerbit = ?`,
            [
                nama_penerbit,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Penerbit tidak ditemukan",
            });
        }

        res.json({
            message: "Berhasil mengubah penerbit",
        });
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Nama penerbit sudah digunakan",
            });
        }

        res.status(500).json({
            message: "Gagal mengubah penerbit",
        });
    }
});

app.delete("/api/penerbit/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID penerbit tidak valid",
            });
        }

        const [result]: any = await pool.query(
            "DELETE FROM penerbit WHERE id_penerbit = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Penerbit tidak ditemukan",
            });
        }

        res.json({
            message: "Berhasil menghapus penerbit",
        });
    } catch (error: any) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message:
                    "Penerbit tidak dapat dihapus karena masih digunakan oleh artikel",
            });
        }

        res.status(500).json({
            message: "Gagal menghapus penerbit",
        });
    }
});

app.get("/api/artikel", async (_req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                artikel.*,
                kategori.nama_kategori,
                penerbit.nama_penerbit
            FROM artikel
            JOIN kategori
                ON artikel.id_kategori = kategori.id_kategori
            JOIN penerbit
                ON artikel.id_penerbit = penerbit.id_penerbit
            ORDER BY artikel.id_artikel DESC
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

app.get("/api/artikel/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID artikel tidak valid",
            });
        }

        const [rows]: any = await pool.query(
            `
            SELECT
                artikel.*,
                kategori.nama_kategori,
                penerbit.nama_penerbit
            FROM artikel
            JOIN kategori
                ON artikel.id_kategori = kategori.id_kategori
            JOIN penerbit
                ON artikel.id_penerbit = penerbit.id_penerbit
            WHERE artikel.id_artikel = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Artikel tidak ditemukan",
            });
        }

        res.json({
            message: "Berhasil mengambil detail artikel",
            data: rows[0],
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil detail artikel",
        });
    }
});

app.post(
    "/api/artikel",
    upload.single("gambar_artikel"),
    async (req, res) => {
        try {
            const validation = artikelSchema.safeParse(
                req.body
            );

            if (!validation.success) {
                if (req.file) {
                    deleteFileIfExists(
                        path.join(
                            "uploads",
                            req.file.filename
                        )
                    );
                }

                return res.status(400).json({
                    message: "Data tidak valid",
                    error: validation.error.issues,
                });
            }

            const {
                id_kategori,
                id_penerbit,
                judul_artikel,
                isi_artikel,
                penulis_artikel,
            } = validation.data;

            const gambarPath = req.file
                ? `uploads/${req.file.filename}`
                : null;

            await pool.query(
                `INSERT INTO artikel
                (
                    id_kategori,
                    id_penerbit,
                    judul_artikel,
                    isi_artikel,
                    penulis_artikel,
                    gambar_artikel
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    id_kategori,
                    id_penerbit,
                    judul_artikel,
                    isi_artikel,
                    penulis_artikel,
                    gambarPath,
                ]
            );

            res.status(201).json({
                message: "Berhasil menambahkan artikel",
            });
        } catch (error: any) {
            if (req.file) {
                deleteFileIfExists(
                    path.join(
                        "uploads",
                        req.file.filename
                    )
                );
            }

            if (
                error.code === "ER_NO_REFERENCED_ROW_2"
            ) {
                return res.status(400).json({
                    message:
                        "Kategori atau penerbit tidak ditemukan",
                });
            }

            res.status(500).json({
                message: "Gagal menambahkan artikel",
            });
        }
    }
);

app.put(
    "/api/artikel/:id",
    upload.single("gambar_artikel"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                if (req.file) {
                    deleteFileIfExists(
                        path.join(
                            "uploads",
                            req.file.filename
                        )
                    );
                }

                return res.status(400).json({
                    message: "ID artikel tidak valid",
                });
            }

            const validation = artikelSchema.safeParse(
                req.body
            );

            if (!validation.success) {
                if (req.file) {
                    deleteFileIfExists(
                        path.join(
                            "uploads",
                            req.file.filename
                        )
                    );
                }

                return res.status(400).json({
                    message: "Data tidak valid",
                    error: validation.error.issues,
                });
            }

            const {
                id_kategori,
                id_penerbit,
                judul_artikel,
                isi_artikel,
                penulis_artikel,
            } = validation.data;

            const [oldRows]: any = await pool.query(
                "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
                [id]
            );

            if (oldRows.length === 0) {
                if (req.file) {
                    deleteFileIfExists(
                        path.join(
                            "uploads",
                            req.file.filename
                        )
                    );
                }

                return res.status(404).json({
                    message: "Artikel tidak ditemukan",
                });
            }

            const oldGambar =
                oldRows[0].gambar_artikel;

            let query: string;
            let params: any[];

            if (req.file) {
                const gambarPath =
                    `uploads/${req.file.filename}`;

                query = `
                    UPDATE artikel
                    SET id_kategori = ?,
                        id_penerbit = ?,
                        judul_artikel = ?,
                        isi_artikel = ?,
                        penulis_artikel = ?,
                        gambar_artikel = ?
                    WHERE id_artikel = ?
                `;

                params = [
                    id_kategori,
                    id_penerbit,
                    judul_artikel,
                    isi_artikel,
                    penulis_artikel,
                    gambarPath,
                    id,
                ];
            } else {
                query = `
                    UPDATE artikel
                    SET id_kategori = ?,
                        id_penerbit = ?,
                        judul_artikel = ?,
                        isi_artikel = ?,
                        penulis_artikel = ?
                    WHERE id_artikel = ?
                `;

                params = [
                    id_kategori,
                    id_penerbit,
                    judul_artikel,
                    isi_artikel,
                    penulis_artikel,
                    id,
                ];
            }

            try {
                await pool.query(query, params);
            } catch (error) {
                if (req.file) {
                    deleteFileIfExists(
                        path.join(
                            "uploads",
                            req.file.filename
                        )
                    );
                }

                throw error;
            }

            if (req.file && oldGambar) {
                deleteFileIfExists(oldGambar);
            }

            res.json({
                message: "Berhasil mengubah artikel",
            });
        } catch (error: any) {
            if (
                error.code === "ER_NO_REFERENCED_ROW_2"
            ) {
                return res.status(400).json({
                    message:
                        "Kategori atau penerbit tidak ditemukan",
                });
            }

            res.status(500).json({
                message: "Gagal mengubah artikel",
            });
        }
    }
);

app.delete(
    "/api/artikel/:id",
    async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    message: "ID artikel tidak valid",
                });
            }

            const [rows]: any =
                await pool.query(
                    "SELECT gambar_artikel FROM artikel WHERE id_artikel = ?",
                    [id]
                );

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Artikel tidak ditemukan",
                });
            }

            const gambarToDelete =
                rows[0].gambar_artikel;

            const [result]: any =
                await pool.query(
                    "DELETE FROM artikel WHERE id_artikel = ?",
                    [id]
                );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Artikel tidak ditemukan",
                });
            }

            if (gambarToDelete) {
                deleteFileIfExists(
                    gambarToDelete
                );
            }

            res.json({
                message: "Berhasil menghapus artikel",
            });
        } catch (error) {
            res.status(500).json({
                message: "Gagal menghapus artikel",
            });
        }
    }
);

app.use(
    (
        err: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "Ukuran file maksimal 5MB",
                });
            }

            return res.status(400).json({
                message: err.message,
            });
        }

        if (
            err &&
            err.message ===
                "Hanya file jpg, png, webp yang diperbolehkan"
        ) {
            return res.status(400).json({
                message: err.message,
            });
        }

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Terjadi kesalahan server",
            });
        }
    }
);

app.listen(
    port,
    "0.0.0.0",
    () => {
        console.log(
            `Server berjalan di http://0.0.0.0:${port} dan http://localhost:${port}`
        );
    }
);