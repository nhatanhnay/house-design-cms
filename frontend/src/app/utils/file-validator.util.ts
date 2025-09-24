import { ADMIN_CONSTANTS } from '../constants/admin.constants';
import { FileValidationResult } from '../interfaces/admin.interfaces';

/**
 * Utility class for file validation
 */
export class FileValidator {

  /**
   * Validate image file type and size
   */
  static validateImage(file: File): FileValidationResult {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'Chỉ chấp nhận file hình ảnh'
      };
    }

    // Check if it's a supported image format
    if (!ADMIN_CONSTANTS.FILE_UPLOAD.SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Chỉ hỗ trợ định dạng JPG, PNG, WEBP'
      };
    }

    // Check file size
    if (file.size > ADMIN_CONSTANTS.FILE_UPLOAD.MAX_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File không được lớn hơn ${ADMIN_CONSTANTS.FILE_UPLOAD.MAX_SIZE_MB}MB`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate video file type and size
   */
  static validateVideo(file: File): FileValidationResult {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return {
        isValid: false,
        error: 'Chỉ chấp nhận file video'
      };
    }

    // Check if it's a supported video format
    if (!ADMIN_CONSTANTS.FILE_UPLOAD.SUPPORTED_VIDEO_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Chỉ hỗ trợ định dạng MP4, WebM, OGG'
      };
    }

    // Check file size (larger limit for videos)
    const maxVideoSize = ADMIN_CONSTANTS.FILE_UPLOAD.MAX_SIZE_BYTES * 10; // 50MB for videos
    if (file.size > maxVideoSize) {
      return {
        isValid: false,
        error: 'File video không được lớn hơn 50MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate any media file (image or video)
   */
  static validateMedia(file: File): FileValidationResult {
    if (file.type.startsWith('image/')) {
      return this.validateImage(file);
    } else if (file.type.startsWith('video/')) {
      return this.validateVideo(file);
    } else {
      return {
        isValid: false,
        error: 'Chỉ chấp nhận file hình ảnh hoặc video'
      };
    }
  }
}