import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share'; // Importar a API de Partilha

// Função para salvar ou partilhar o arquivo CSV
export const exportToCsv = async (csvContent: string, filename: string) => {
  // Verifica se a app está a correr numa plataforma nativa (iOS/Android)
  if (Capacitor.isNativePlatform()) {
    try {
      // Escreve o arquivo no diretório de cache do dispositivo
      const result = await Filesystem.writeFile({
        path: filename,
        data: `\uFEFF${csvContent}`, // BOM para compatibilidade com Excel
        directory: Directory.Cache, // Usar Cache para arquivos temporários
        encoding: Encoding.UTF8,
      });

      // Usa a API de Partilha para abrir o menu nativo "Partilhar"
      await Share.share({
        title: 'Relatório de Renda',
        text: 'Segue em anexo o seu relatório de rendimentos.',
        url: result.uri, // Passa o caminho do arquivo criado
      });

    } catch (e) {
      console.error('Não foi possível salvar ou partilhar o arquivo', e);
      alert('Erro ao partilhar o arquivo.');
    }
  } else {
    // Mantém o método de download para browsers de desktop
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};