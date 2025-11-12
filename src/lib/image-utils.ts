/**
 * Utilitários para trabalhar com imagens de produtos
 */

/**
 * Obtém a URL da imagem, retornando fallback apenas se a URL estiver vazia
 * Não modifica URLs válidas - usa exatamente como foi salva no banco
 */
export function getImageUrl(url: string | null | undefined, fallback: string = '/image.jpg'): string {
  // Se não houver URL ou estiver vazia, retorna o fallback
  if (!url || url.trim() === '') {
    return fallback;
  }

  // Retorna a URL exatamente como está (pode ser URL externa ou relativa)
  return url.trim();
}

/**
 * Verifica se uma URL é válida
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    // URLs relativas são válidas
    if (url.startsWith('/')) {
      return true;
    }

    // Tenta criar um objeto URL para validar
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

