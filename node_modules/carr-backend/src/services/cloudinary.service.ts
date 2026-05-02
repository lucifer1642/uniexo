import { cloudinary } from '../config/cloudinary';
import { logger } from '../config/logger';
import sharp from 'sharp';

export class CloudinaryService {
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string,
  ): Promise<string> {
    try {
      // Compress and convert image to WebP (binary reduction)
      const processedBuffer = await sharp(fileBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `carr/${folder}`,
            resource_type: 'image',
            // No need for cloudinary auto format since we send optimized webp
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          },
        );
        uploadStream.end(processedBuffer);
      });
    } catch (error) {
      logger.error('Image compression error:', error);
      throw error;
    }
  }

  static async uploadMultiple(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    const uploads = files.map((file) =>
      CloudinaryService.uploadImage(file.buffer, folder),
    );
    return Promise.all(uploads);
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
    }
  }
}
