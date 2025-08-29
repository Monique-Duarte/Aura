import { test, expect } from '@playwright/test';

test.describe('Funcionalidades da Tela de Renda', () => {
  // Antes de cada teste, garantimos que o robô está logado
  // e na página correta. O Playwright pode reutilizar o estado de login.
  test.beforeEach(async ({ page }) => {
    // Para simplificar, navegamos direto para a página de Renda.
    // Assumimos que o login já foi feito em um passo anterior (configurável no Playwright).
    await page.goto('http://localhost:8100/app/renda'); 
  });

  test('deve permitir ao usuário adicionar uma nova renda com sucesso', async ({ page }) => {
    // 1. AÇÃO: Clicar no botão de adicionar (FAB)
    // O Playwright procura um botão flutuante que tenha um ícone 'add'.
    await page.locator('ion-fab-button').click();

    // 2. VERIFICAÇÃO: O modal de "Nova Renda" deve estar visível
    // Esperamos que um cabeçalho com o texto "Nova Renda" apareça.
    await expect(page.locator('h1', { hasText: 'Nova Renda' })).toBeVisible();

    // 3. AÇÃO: Preencher o formulário
    // Procura o campo pelo placeholder e digita a descrição.
    await page.getByPlaceholder('Ex: Salário, Freelance').fill('Salário do Mês');
    
    // Procura o campo pelo label e digita o valor.
    // A função 'pressSequentially' simula a digitação humana, o que é ótimo para campos de moeda.
    await page.getByLabel('Valor (R$)').pressSequentially('500000');

    // 4. AÇÃO: Clicar no botão de salvar
    // Procura um botão com o texto "Salvar Renda".
    await page.getByRole('button', { name: 'Salvar Renda' }).click();

    // 5. VERIFICAÇÃO FINAL: O item deve aparecer na lista
    // Esperamos encontrar um elemento na lista que contenha o texto "Salário do Mês".
    const novoItem = page.locator('ion-item', { hasText: /Salário do Mês/ });
    await expect(novoItem).toBeVisible();

    // E também verificamos se o valor formatado "R$ 5.000,00" está visível dentro desse item.
    await expect(novoItem.locator('text=R$ 5.000,00')).toBeVisible();
  });
});
