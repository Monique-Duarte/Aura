import { defineConfig, devices } from '@playwright/test';

// O caminho para o arquivo onde a sessão de login será salva
const authFile = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests', // Corrigido para a pasta 'tests'
  fullyParallel: true,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8100', // Definimos a base da URL aqui
    trace: 'on-first-retry',
  },

  projects: [
    // 1. Projeto de Setup: Roda PRIMEIRO e APENAS uma vez para fazer login
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // 2. Projeto para testes no Desktop Chrome
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Usa o estado de login salvo pelo projeto 'setup'
        storageState: authFile,
      },
      // Diz que este projeto depende que o 'setup' termine com sucesso
      dependencies: ['setup'],
    },

    // 3. Projeto para testes no Emulador Android
    {
      name: 'Android Emulator',
      use: {
        ...devices['Pixel 5'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],
});
