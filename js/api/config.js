// API Конфигурация
const API_CONFIG = {
  arxiv: {
    baseUrl: 'https://export.arxiv.org/api/query',
    maxResults: 10,
    timeout: 30000  // Увеличено до 30 сек для CORS proxy
  },
  crossref: {
    baseUrl: 'https://api.crossref.org/works',
    timeout: 10000
  }
};

const getConfig = (apiName) => API_CONFIG[apiName] || null;

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, getConfig };
}
