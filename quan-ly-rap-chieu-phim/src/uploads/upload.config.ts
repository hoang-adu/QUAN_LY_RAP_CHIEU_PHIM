import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

// Thư mục gốc lưu file upload (nằm ngoài dist/src, ngang cấp package.json) —
// KHÔNG dùng __dirname vì sau khi build (dist/) sẽ trỏ sai chỗ.
export const UPLOAD_ROOT = join(process.cwd(), 'uploads');

// Danh sách thư mục con hợp lệ — chặn client tự đặt tên folder tuỳ ý
// (tránh path traversal như "../../etc").
export const ALLOWED_UPLOAD_FOLDERS = ['movies', 'products', 'misc'] as const;
export type UploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

export function sanitizeFolder(folder?: string): UploadFolder {
  const f = (folder || '').trim().toLowerCase();
  return (ALLOWED_UPLOAD_FOLDERS as readonly string[]).includes(f)
    ? (f as UploadFolder)
    : 'misc';
}

// Chỉ nhận ảnh — chặn sớm ở multer trước khi ghi file xuống đĩa.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const imageUploadOptions = {
  storage: diskStorage({
    destination: (req, _file, cb) => {
      // req.body chưa chắc đã được multer parse field text TRƯỚC file trong
      // multipart/form-data theo thứ tự gửi lên — nên nhận folder qua query
      // string (?folder=movies) thay vì body, để luôn đọc được ngay tại
      // bước này.
      const folder = sanitizeFolder(
        (req.query?.folder as string | undefined) ?? undefined,
      );
      const dir = join(UPLOAD_ROOT, folder);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP, GIF).',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
};
