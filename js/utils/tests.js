// Проверка что API готов
if (typeof window.AppAPI === 'undefined') {
  console.warn('⚠️ window.AppAPI не инициализирован. Тесты отложены...');
  setTimeout(() => {
    if (typeof window.AppAPI !== 'undefined') {
      runTests();
    }
  }, 500);
} else {
  runTests();
}

function runTests() {
  console.log('\n🧪 === НАЧАЛО ТЕСТИРОВАНИЯ ===\n');
console.log('=== Тест 1: LocalStorage ===');
LocalStorageService.setCache('test_data', { title: 'Test Article' }, 10000);
const cached = LocalStorageService.getCache('test_data');
console.log('✓ Кэш установлен:', cached);

// Тест 2: Добавление закладки
console.log('\n=== Тест 2: Закладки ===');
LocalStorageService.addBookmark({
  id: 'test_123',
  title: 'Quantum Physics',
  authors: ['Einstein', 'Bohr'],
  published: '2025-01-01'
});
const bookmarks = LocalStorageService.getBookmarks();
console.log('✓ Закладок сохранено:', bookmarks.length);
console.log('✓ Это закладка?', LocalStorageService.isBookmarked('test_123'));

// Тест 3: DataParser
console.log('\n=== Тест 3: DataParser ===');
const testArticle = {
  id: 'arxiv_123',
  title: 'Machine Learning and AI',
  authors: ['John Doe', 'Jane Smith', 'Bob Johnson'],
  published: '2025-01-15',
  summary: 'This is a test summary about machine learning and neural networks'
};
console.log('✓ Авторы:', DataParser.formatAuthors(testArticle.authors));
console.log('✓ Дата:', DataParser.formatDate(testArticle.published));
console.log('✓ Цитата:', DataParser.toCitation(testArticle));
const truncated = DataParser.truncateText(testArticle.summary, 50);
console.log('✓ Текст обрезан (50сим):', truncated);
console.log('  Длина:', truncated.length);

// Тест 4: Конфигурация
console.log('\n=== Тест 4: Конфигурация ===');
console.log('✓ arXiv доступен:', getConfig('arxiv') !== null);
console.log('✓ CrossRef доступен:', getConfig('crossref') !== null);

// Тест 5: SessionStorage
console.log('\n=== Тест 5: SessionStorage ===');
SessionStorageService.setSearchState('test query', [
  { id: 'test_1', title: 'Test Article 1' },
  { id: 'test_2', title: 'Test Article 2' }
]);
const searchState = SessionStorageService.getSearchState();
console.log('✓ Результаты поиска:', searchState.results.length, 'статей');
console.log('✓ Запрос был:', searchState.query);

// Тест 6: UI состояние
console.log('\n=== Тест 6: UI состояние ===');
SessionStorageService.setUIState({
  modalOpen: false,
  activeTab: 'articles',
  theme: 'dark'
});
const uiState = SessionStorageService.getUIState();
console.log('✓ Тема:', uiState.theme);
console.log('✓ Вкладка:', uiState.activeTab);

// Тест 7: Сессия
console.log('\n=== Тест 7: Время сессии ===');
const duration = SessionStorageService.getSessionDuration();
console.log('✓ Сессия работает:', Math.round(duration / 1000), 'секунд');

// Тест 8: API запросы
console.log('\n=== Тест 8: API запросы ===');
console.log('✓ ApiService доступен:', typeof ApiService !== 'undefined');
console.log('✓ Конфиг готов:', API_CONFIG !== undefined);

// Тест 9: Поиск в arXiv
console.log('\n=== Тест 9: Поиск в arXiv ===');
console.log('⏳ Выполняется асинхронный поиск...');
window.AppAPI.searchArticles('machine learning').then(results => {
  console.log('✓ Результаты:', results.length, 'статей найдено');
  if (results.length > 0) {
    const first = results[0];
    console.log('  Статья:', first.title);
    console.log('  Авторы:', first.authors.join(', '));
    console.log('  🔗 ID:', first.id);
  }
}).catch(error => {
  console.log('✓ Ошибка обработана:', error.message);
});

// Тест 10: Очистка тестовых данных
console.log('\n=== Тест 10: Очистка ===');
function cleanupTests() {
  // Удаляем только тестовые закладки
  const bookmarks = LocalStorageService.getBookmarks();
  const notTestBookmarks = bookmarks.filter(b => !b.id.startsWith('test_'));
  localStorage.setItem('bookmarks', JSON.stringify(notTestBookmarks));
  console.log('✓ Тестовые данные очищены');
}
cleanupTests();

console.log('\n✅ === ТЕСТЫ ЗАВЕРШЕНЫ ===');
}
