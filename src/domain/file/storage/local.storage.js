import fs from "fs";
import path from "path";
import sharp from "sharp";

const uploadsDir = path.join(process.cwd(), "uploads");

const ensureUploadsDir = async () => {
    await fs.promises.mkdir(uploadsDir, { recursive: true });
};

export default class LocalStorage {
    async upload(file, docId, isImage) {
        await ensureUploadsDir();
        let storageKey = file.filename;
        let mime = file.mimetype || "application/octet-stream";
        let size = file.size;
        
        if (isImage) {
            const imageKey = `${docId}.webp`;
            const imagePath = path.join(uploadsDir, imageKey);

            await sharp(file.path).webp({ quality: 80 }).toFile(imagePath);
            await fs.promises.unlink(file.path).catch(() => { });

            const stat = await fs.promises.stat(imagePath);
            storageKey = imageKey;
            mime = "image/webp";
            size = stat.size;
        } else {
            // Move file if not image, assuming file.path is in some temp dir or already in uploads?
            // Actually multer usually saves to uploadsDir already.
        }

        return { storageKey, mime, size };
    }
    
    async delete(filename) {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath).catch(() => { });
        }
    }
    
    getUrl(filename) {
        return `/uploads/${filename}`;
    }
}
