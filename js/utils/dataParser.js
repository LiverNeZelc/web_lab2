// === Утилиты для работы с данными ===
const DataParser = {
  // Форматирование даты
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  },

  // Обрезание текста
  truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Форматирование авторов
  formatAuthors(authors) {
    if (!Array.isArray(authors)) return 'Unknown';
    if (authors.length === 0) return 'Unknown';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} и ${authors[1]}`;
    return `${authors[0]} и др.`;
  },

  // Парсинг ID статьи
  extractArticleId(urlOrId) {
    if (typeof urlOrId === 'string') {
      return urlOrId.split('/').pop() || urlOrId;
    }
    return urlOrId;
  },

  // Генерация уникального ID
  generateId(prefix = 'article') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Валидация статьи
  isValidArticle(article) {
    return article && 
           article.title && 
           (article.id || article.url) &&
           article.authors;
  },

  // Преобразование статьи в цитату
  toCitation(article) {
    const authors = this.formatAuthors(article.authors);
    const year = new Date(article.published || Date.now()).getFullYear();
    return `${authors} (${year}). "${article.title}"`;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataParser;
}
