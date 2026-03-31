document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем все модули
  initReadingProgress();
  initCitations();
  initAuthModal();

  const heading = document.querySelector('h1');
  
  heading.style.opacity = '0';
  heading.style.transition = 'opacity 1.2s ease-in-out';
  
  setTimeout(() => {
    heading.style.opacity = '1';
  }, 300);
  
  console.log('Добро пожаловать в Fyrre!');

  // === Бургер-меню ===
  const burger = document.querySelector('.burger');
  const navMobile = document.querySelector('.nav--mobile');
  const navMobileLinks = document.querySelectorAll('.nav-mobile__link');

  if (burger && navMobile) {
    // Открытие/закрытие меню при клике на бургер
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navMobile.classList.toggle('active');
      burger.setAttribute('aria-expanded', burger.classList.contains('active'));
    });

    // Закрытие меню при клике на ссылку и обработка action
    navMobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const navType = link.getAttribute('data-nav');
        
        // Закрыть меню в любом случае
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        
        // Если это кнопка Authors - скроллить к статье
        if (navType === 'authors') {
          setTimeout(() => {
            const target = document.getElementById('authors-section');
            if (target) {
              target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 100);
        }
      });
    });

    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !navMobile.contains(e.target)) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
    });

    // Закрытие меню при изменении размера окна
    window.addEventListener('resize', () => {
      if (window.innerWidth > 767) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Обработка кнопки Authors - скроллинг к статье
  const authorsLink = document.querySelector('[data-nav="authors"]');
  if (authorsLink) {
    authorsLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Закрыть мобильное меню если оно открыто
      if (burger && navMobile) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
      
      const target = document.getElementById('authors-section');
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  // Обработка остальных кнопок - обновление страницы
  document.querySelectorAll('[data-nav]:not([data-nav="authors"])').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Закрыть мобильное меню если оно открыто
      if (burger && navMobile) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
      
      window.scrollTo(0, 0);
      window.location.href = window.location.pathname;
    });
  });

  // === Интеграция API и закладок ===
  LocalStorageService.clearExpiredCache();

  // === МИГРАЦИЯ ЗАКЛАДОК (обновить старые ID на новые) ===
  const migrateBookmarkIds = () => {
    const bookmarks = LocalStorageService.getBookmarks();
    
    // Получаем все текущие статьи с их ID и названиями
    const articles = Array.from(document.querySelectorAll('.scientific-article__card')).map(article => ({
      id: article.getAttribute('data-article-id'),
      title: article.querySelector('.scientific-article__title')?.textContent || '',
      authors: article.querySelector('[itemprop="name"]')?.textContent || ''
    }));
    
    // Обновляем закладки - ищем статью по названию
    const updated = bookmarks.map(bookmark => {
      // Если ID выглядит как старый случайный ID
      if (bookmark.id && bookmark.id.match(/^article_[a-z0-9]{9}$/)) {
        // Ищем статью с похожим названием
        const matchingArticle = articles.find(a => a.title === bookmark.title);
        if (matchingArticle && matchingArticle.id !== bookmark.id) {
          console.log('✓ Обновлена закладка:', bookmark.id, '→', matchingArticle.id, '(' + bookmark.title.substring(0, 30) + '...)');
          return { ...bookmark, id: matchingArticle.id };
        }
      }
      return bookmark;
    });
    
    // Сохраняем обновленные закладки если что-то изменилось
    const hasChanges = JSON.stringify(bookmarks) !== JSON.stringify(updated);
    if (hasChanges) {
      localStorage.setItem('bookmarks', JSON.stringify(updated));
    }
  };

  migrateBookmarkIds();
  const savedPosition = SessionStorageService.getScrollPosition();
  if (savedPosition > 0) {
    setTimeout(() => {
      window.scrollTo(0, savedPosition);
    }, 100);
  }

  // Сохранять позицию скролла перед закрытием страницы
  window.addEventListener('beforeunload', () => {
    SessionStorageService.setScrollPosition(window.scrollY);
  });

  // Функция для добавления закладки к статье
  document.querySelectorAll('.scientific-article__card').forEach(article => {
    const footer = article.querySelector('.scientific-article__footer');
    if (footer) {
      const bookmarkBtn = document.createElement('button');
      bookmarkBtn.className = 'bookmark-btn';
      bookmarkBtn.innerHTML = 'В закладки';
      bookmarkBtn.type = 'button';

      const articleId = article.getAttribute('data-article-id') || `article_${Math.random().toString(36).substr(2, 9)}`;
      article.setAttribute('data-article-id', articleId);

      const updateBookmarkBtn = () => {
        if (LocalStorageService.isBookmarked(articleId)) {
          bookmarkBtn.classList.add('bookmarked');
          bookmarkBtn.innerHTML = '⭐ В закладках';
        } else {
          bookmarkBtn.classList.remove('bookmarked');
          bookmarkBtn.innerHTML = '☆ В закладки';
        }
      };

      bookmarkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const title = article.querySelector('.scientific-article__title')?.textContent || 'Unknown';
        const authors = article.querySelector('[itemprop="name"]')?.textContent || 'Unknown';

        if (LocalStorageService.isBookmarked(articleId)) {
          LocalStorageService.removeBookmark(articleId);
        } else {
          LocalStorageService.addBookmark({
            id: articleId,
            title,
            authors,
            url: window.location.href,
            addedAt: new Date().toISOString()
          });
        }
        updateBookmarkBtn();
        if (window.renderSidebarBookmarks) window.renderSidebarBookmarks();  // ← Обновляем боковую панель
        console.log('Закладка обновлена:', articleId);
      });

      updateBookmarkBtn();
      footer.appendChild(bookmarkBtn);
    }
  });

  // Функция для поиска в arXiv (если понадобится)
  const searchArticles = async (query) => {
    try {
      // Сначала проверяем результаты в sessionStorage (текущая сессия)
      const sessionResults = SessionStorageService.getSearchState();
      if (sessionResults && sessionResults.query === query) {
        console.log('Результаты из сессии:', sessionResults);
        return sessionResults.results;
      }

      const cached = LocalStorageService.getCache(`arxiv_${query}`);
      if (cached) {
        console.log('Статьи из кэша (localStorage):', cached);
        SessionStorageService.setSearchState(query, cached);
        return cached;
      }

      console.log('Поиск статей в arXiv:', query);
      const results = await ApiService.searchArXiv(query);
      LocalStorageService.setCache(`arxiv_${query}`, results);
      SessionStorageService.setSearchState(query, results);
      return results;
    } catch (error) {
      console.error('Ошибка поиска:', error);
      return [];
    }
  };

  // Экспортируем функции для использования в консоли
  window.AppAPI = {
    searchArticles,
    getBookmarks: () => LocalStorageService.getBookmarks(),
    clearBookmarks: () => localStorage.removeItem('bookmarks'),
    cacheStatus: () => {
      const bookmarks = LocalStorageService.getBookmarks();
      console.log('Закладок:', bookmarks.length);
      console.log('Закладки:', bookmarks);
    },
    // SessionStorage методы
    getSearchState: () => SessionStorageService.getSearchState(),
    getScrollPosition: () => SessionStorageService.getScrollPosition(),
    getUIState: () => SessionStorageService.getUIState(),
    setUIState: (state) => SessionStorageService.setUIState(state),
    getSessionDuration: () => {
      const duration = SessionStorageService.getSessionDuration();
      console.log(`Время сессии: ${Math.round(duration / 1000)} сек`);
      return duration;
    },
    clearSession: () => {
      SessionStorageService.clearAll();
      console.log('Сессия очищена');
    }
  };

  console.log('API интегрирован. Используйте window.AppAPI');

  // === БОКОВАЯ ПАНЕЛЬ ЗАКЛАДОК ===
  
  const renderSidebarBookmarks = () => {
    const sidebarList = document.getElementById('bookmarks-sidebar-list');
    const bookmarksBadge = document.getElementById('bookmarks-badge');
    const bookmarks = LocalStorageService.getBookmarks();
    
    // Обновляем значок (бейдж)
    bookmarksBadge.textContent = bookmarks.length;
    
    if (bookmarks.length === 0) {
      sidebarList.innerHTML = '<p class="sidebar__empty">Нет сохраненных статей</p>';
      return;
    }
    
    sidebarList.innerHTML = bookmarks.map(bookmark => `
      <div class="sidebar-bookmark-item">
        <div class="sidebar-bookmark-item__title" title="${bookmark.title}">
          ${bookmark.title}
        </div>
        <div class="sidebar-bookmark-item__authors" title="${bookmark.authors}">
          ${bookmark.authors || 'Автор'}
        </div>
        <div class="sidebar-bookmark-item__actions">
          <button 
            class="sidebar-bookmark-btn sidebar-bookmark-btn--read"
            data-article-id="${bookmark.id}"
            onclick="scrollToArticle('${bookmark.id}')"
            title="Прочитать"
          >
            📖
          </button>
          <button 
            class="sidebar-bookmark-btn sidebar-bookmark-btn--delete"
            onclick="LocalStorageService.removeBookmark('${bookmark.id}'); window.renderSidebarBookmarks()"
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>
    `).join('');
  };

  // Функция для скроллинга к конкретной статье по ID
  window.scrollToArticle = (articleId) => {
    // Ищем статью по data-article-id
    const article = document.querySelector(`[data-article-id="${articleId}"]`);
    
    if (article) {
      article.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('✓ Найдена статья с ID:', articleId);
      
      // На мобильных - закрываем боковую панель после клика
      const sidebar = document.querySelector('.bookmarks-sidebar');
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('open');
      }
    } else {
      console.warn('✗ Статья не найдена с ID:', articleId);
      // Fallback - скроллим к первой статье
      const firstArticle = document.querySelector('.scientific-article__card');
      if (firstArticle) {
        firstArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Делаем функцию доступной глобально
  window.renderSidebarBookmarks = renderSidebarBookmarks;

  // Инициализация боковой панели
  const initSidebar = () => {
    const sidebar = document.querySelector('.bookmarks-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const mobileToggleBtn = document.getElementById('mobile-bookmarks-toggle');
    
    if (!toggleBtn) return;
    
    // Кнопка для свернуть/развернуть (десктоп)
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
    });

    // Кнопка для открыть/закрыть (мобильная)
    if (mobileToggleBtn) {
      mobileToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('open');
      });
    }
    
    // Закрыть панель при клике вне её (только на мобильных)
    if (window.innerWidth <= 768) {
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
    
    // Обновляем закладки при загрузке
    renderSidebarBookmarks();
  };

  initSidebar();

  // Обновляем боковую панель когда меняются закладки
  window.addEventListener('storage', () => {
    renderSidebarBookmarks();
  });
});


