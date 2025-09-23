import { DataService } from '../services/data.service';

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
            console.log('Upload response:', response);
            // Ensure the response has the correct format for CKEditor
            if (response && response.url) {
              resolve({ default: response.url });
            } else {
              console.error('Invalid response format:', response);
              reject(`Invalid response format: ${JSON.stringify(response)}`);
            }
          },
          error: (error) => {
            console.error('Upload failed:', error);
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
    console.log('Initializing upload adapter plugin');
    try {
      const fileRepository = editor.plugins.get('FileRepository');
      if (fileRepository) {
        fileRepository.createUploadAdapter = (loader: any) => {
          console.log('Creating upload adapter for loader');
          return new CKEditorUploadAdapter(loader, dataService);
        };
      } else {
        console.error('FileRepository plugin not found');
      }
    } catch (error) {
      console.error('Error setting up upload adapter:', error);
    }
  };
}