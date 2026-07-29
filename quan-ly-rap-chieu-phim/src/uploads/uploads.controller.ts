import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { imageUploadOptions, sanitizeFolder } from './upload.config';

// POST /uploads/image?folder=movies  (multipart/form-data, field "file")
// Dùng cho mọi chỗ cần "vừa cho dán URL, vừa cho tải ảnh từ máy lên" (poster
// phim, ảnh sản phẩm...). Chỉ admin/nhân viên được upload — khớp với quyền
// tạo/sửa phim, sản phẩm hiện có. Trả về đường dẫn TƯƠNG ĐỐI (vd.
// "/uploads/movies/xxx.jpg"), không phải URL tuyệt đối, để không bị gắn
// chết vào 1 domain backend cụ thể — phía FE tự ghép với API_BASE lúc hiển thị.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'employee')
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn 1 file ảnh để tải lên.');
    }
    const safeFolder = sanitizeFolder(folder);
    return {
      url: `/uploads/${safeFolder}/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
