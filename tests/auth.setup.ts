import { test as setup, expect } from '@playwright/test';

// O caminho para o arquivo onde a sessão de login será salva
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Navega para a página de login
  await page.goto('http://localhost:8100/login');

  await page.getByPlaceholder('E-mail').fill('aura.contato.app@gmail.com');
  await page.getByPlaceholder('Senha').fill('Marinha*1');

  // 3. Clica no botão de entrar de forma específica
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  // 4. Espera até que a navegação para o dashboard seja concluída
  await page.waitForURL('**/app/dashboard');

  // 5. Verifica se o login foi bem-sucedido (opcional, mas recomendado)
  //    Isso garante que o teste falhe aqui se o login não funcionar, em vez de dar timeout.
  await expect(page.getByText('Resumo Mensal')).toBeVisible({ timeout: 10000 });

  // 6. Salva o estado da sessão (cookies, local storage, etc.) no arquivo
  await page.context().storageState({ path: authFile });
});

