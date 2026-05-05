import { cloudinary } from '../config/cloudinary';
import { logger } from '../config/logger';

export class CloudinaryService {
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string,
  ): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `uniexo/${folder}`,
            resource_type: 'image',
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
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      logger.error('Image upload error:', error);
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
