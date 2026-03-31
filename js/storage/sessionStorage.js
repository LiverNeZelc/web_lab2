// === SessionStorage Сервис (временное хранилище сессии) ===
const SessionStorageService = {
  // Сохранить данные сессии
  set(key, data) {
    sessionStorage.setItem(`session_${key}`, JSON.stringify({
      data,
      timestamp: new Date().getTime()
    }));
  },

  // Получить данные сессии
  get(key) {
    const item = sessionStorage.getItem(`session_${key}`);
    return item ? JSON.parse(item).data : null;
  },

  // Сохранить состояние поиска
  setSearchState(query, results) {
    this.set('lastSearch', {
      query,
      results,
      timestamp: new Date().toISOString()
    });
  },

  // Получить состояние последнего поиска
  getSearchState() {
    return this.get('lastSearch');
  },

  // Сохранить активный фильтр
  setActiveFilter(filterName) {
    this.set('activeFilter', filterName);
  },

  // Получить активный фильтр
  getActiveFilter() {
    return this.get('activeFilter');
  },

  // Сохранить позицию скролла
  setScrollPosition(position) {
    this.set('scrollPosition', position);
  },

  // Получить позицию скролла
  getScrollPosition() {
    return this.get('scrollPosition') || 0;
  },

  // Сохранить состояние UI (открытые модалки, вкладки)
  setUIState(state) {
    this.set('uiState', state);
  },

  getUIState() {
    return this.get('uiState') || {};
  },

  // Очистить все данные сессии
  clearAll() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('session_')) {
        sessionStorage.removeItem(key);
      }
    });
  },

  // Проверить время жизни сессии
  getSessionDuration() {
    let startTime = sessionStorage.getItem('session_startTime');
    if (!startTime) {
      startTime = new Date().getTime().toString();
      sessionStorage.setItem('session_startTime', startTime);
      return 0;
    }
    return new Date().getTime() - parseInt(startTime);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionStorageService;
}
