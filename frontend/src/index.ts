// TypeScript Module Resolution Test
// This file helps VS Code understand the project structure

export interface TestInterface {
  id: number;
  name: string;
}

// Re-export main modules for better IntelliSense
export * from './app/models/models';
export * from './app/services/auth.service';
export * from './app/services/data.service';

