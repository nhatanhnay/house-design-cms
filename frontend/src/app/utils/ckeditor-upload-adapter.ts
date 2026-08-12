import { DataService } from '../services/data.service';
import { LoggerService } from '../services/logger.service';
import { UrlConverter } from './url-converter.util';

// Lớp này do CKEditor khởi tạo trực tiếp nên không đi qua DI của Angular.
// LoggerService không có phụ thuộc nào nên tạo thẳng một instance là đủ, và
// nhờ vậy log tự hạ mức khi chạy ngoài localhost.
const logger = new LoggerService();

export class CKEditorUploadAdapter {
  private loader: any;
  private dataService: DataService;

  constructor(loader: any, dataService: DataService) {
    this.loader = loader;
    this.dataService = dataService;
  }

  upload(): Promise<{ default: string }> {
    return this.loader.file.then((file: File) => {
      return new Promise((resolve, reject) => {
        this.dataService.uploadImage(file).subscribe({
          next: (response) => {
            // Ensure the response has the correct format for CKEditor
            if (response && response.url) {
              resolve({ default: UrlConverter.convertImageUrl(response.url) });
            } else {
              logger.error('CKEditor: phản hồi upload sai định dạng', response, 'Editor');
              reject(`Invalid response format: ${JSON.stringify(response)}`);
            }
          },
          error: (error) => {
            logger.error('CKEditor: upload thất bại', error, 'Editor');
            // Convert error to string to avoid [object Object] display
            let errorMessage = 'Upload failed';
            if (error?.error?.error) {
              errorMessage = error.error.error;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            }
            reject(errorMessage);
          }
        });
      });
    });
  }

  abort(): void {
    // Implement abort logic if needed
  }
}

export function CKEditorUploadAdapterPlugin(dataService: DataService) {
  return function(editor: any) {
    try {
      const fileRepository = editor.plugins.get('FileRepository');
      if (fileRepository) {
        fileRepository.createUploadAdapter = (loader: any) => {
          return new CKEditorUploadAdapter(loader, dataService);
        };
      } else {
        logger.error('CKEditor: thiếu plugin FileRepository', undefined, 'Editor');
      }
    } catch (error) {
      logger.error('CKEditor: không khởi tạo được upload adapter', error, 'Editor');
    }
  };
}