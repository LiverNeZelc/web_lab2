// === LocalStorage Сервис ===
const LocalStorageService = {
  // Кэширование данных
  setCache(key, data, duration = 86400000) {
    const item = {
      data,
      timestamp: new Date().getTime(),
      duration
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },

  getCache(key) {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;

    const cached = JSON.parse(item);
    const now = new Date().getTime();
    const isExpired = (now - cached.timestamp) > cached.duration;

    if (isExpired) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return cached.data;
  },

  // Закладки (избранное)
  addBookmark(article) {
    const bookmarks = this.getBookmarks();
    const exists = bookmarks.some(b => b.id === article.id);
    
    if (!exists) {
      bookmarks.push({
        ...article,
        savedAt: new Date().toISOString()
      });
      console.log('💾 Закладка сохранена:', article);  // Логирование
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      return true;
    }
    return false;
  },

  removeBookmark(articleId) {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== articleId);
    localStorage.setItem('bookmarks', JSON.stringify(filtered));
  },

  getBookmarks() {
    const data = localStorage.getItem('bookmarks');
    return data ? JSON.parse(data) : [];
  },

  isBookmarked(articleId) {
    return this.getBookmarks().some(b => b.id === articleId);
  },

  // Оффлайн данные
  setOfflineData(key, data) {
    localStorage.setItem(`offline_${key}`, JSON.stringify(data));
  },

  getOfflineData(key) {
    const data = localStorage.getItem(`offline_${key}`);
    return data ? JSON.parse(data) : null;
  },

  clearExpiredCache() {
    const now = new Date().getTime();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cache_')) {
        const item = JSON.parse(localStorage.getItem(key));
        if ((now - item.timestamp) > item.duration) {
          localStorage.removeItem(key);
        }
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalStorageService;
}
