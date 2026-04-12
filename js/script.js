document.addEventListener('DOMContentLoaded', () => {
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

 
  const burger = document.querySelector('.burger');
  const navMobile = document.querySelector('.nav--mobile');
  const navMobileLinks = document.querySelectorAll('.nav-mobile__link');

  if (burger && navMobile) {
    // бургер
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navMobile.classList.toggle('active');
      burger.setAttribute('aria-expanded', burger.classList.contains('active'));
    });

    // Закрытие меню и обработка действий
    navMobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Специальная обработка для кнопки закладок
        if (link.id === 'mobile-menu-bookmarks') {
          const sidebar = document.querySelector('.bookmarks-sidebar');
          if (sidebar) {
            sidebar.classList.add('open');
          }
        }
        
        const navType = link.getAttribute('data-nav');
        
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        
        // скролл к статье
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

    // Закрытие меню (мимо модалки)
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !navMobile.contains(e.target)) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
    });

  
    window.addEventListener('resize', () => {
      if (window.innerWidth > 767) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  //скроллинг к статье
  const authorsLink = document.querySelector('[data-nav="authors"]');
  if (authorsLink) {
    authorsLink.addEventListener('click', (e) => {
      e.preventDefault();
      
     
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

 
  document.querySelectorAll('[data-nav]:not([data-nav="authors"])').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      

      if (burger && navMobile) {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      }
      
      window.scrollTo(0, 0);
      window.location.href = window.location.pathname;
    });
  });

  // Интеграция API
  LocalStorageService.clearExpiredCache();


  const migrateBookmarkIds = () => {
    const bookmarks = LocalStorageService.getBookmarks();
    
   
    const articles = Array.from(document.querySelectorAll('.scientific-article__card')).map(article => ({
      id: article.getAttribute('data-article-id'),
      title: article.querySelector('.scientific-article__title')?.textContent || '',
      authors: article.querySelector('[itemprop="name"]')?.textContent || ''
    }));
    

    const updated = bookmarks.map(bookmark => {

      if (bookmark.id && bookmark.id.match(/^article_[a-z0-9]{9}$/)) {
        const matchingArticle = articles.find(a => a.title === bookmark.title);
        if (matchingArticle && matchingArticle.id !== bookmark.id) {
          console.log('✓ Обновлена закладка:', bookmark.id, '→', matchingArticle.id, '(' + bookmark.title.substring(0, 30) + '...)');
          return { ...bookmark, id: matchingArticle.id };
        }
      }
      return bookmark;
    });
    
    // сохранение обновленные закладки если что-то изменилось
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

  // позицию скролла перед закрытием страницы сохраняется
  window.addEventListener('beforeunload', () => {
    SessionStorageService.setScrollPosition(window.scrollY);
  });

  // Функция добавления закладки к статье
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

  // Функция для поиска в arXiv
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

  // использования в консоли (не используем)
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


  
  const renderSidebarBookmarks = () => {
    const sidebarList = document.getElementById('bookmarks-sidebar-list');
    const bookmarksBadge = document.getElementById('bookmarks-badge');
    const bookmarks = LocalStorageService.getBookmarks();
    const showSearchBtn = document.getElementById('show-search-btn');

    bookmarksBadge.textContent = bookmarks.length;
    
    if (bookmarks.length === 0) {
      sidebarList.innerHTML = '<div class="sidebar__bookmarks-header"><p class="sidebar__empty">Нет сохраненных статей</p></div>';
      if (showSearchBtn) showSearchBtn.style.display = 'none';
      return;
    }
    
    const bookmarksHTML = bookmarks.map(bookmark => `
      <div class="sidebar-bookmark-item" data-article-id="${bookmark.id}">
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
            title="Открыть"
          >
            📖
          </button>
          <button 
            class="sidebar-bookmark-btn sidebar-bookmark-btn--delete"
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>
    `).join('');
    
    sidebarList.innerHTML = `<div class="sidebar__bookmarks-header">${bookmarksHTML}</div>`;
    
    // Слушатели для кнопок открытия и удаления
    sidebarList.querySelectorAll('.sidebar-bookmark-btn--read').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const articleId = btn.getAttribute('data-article-id');
        const bookmark = bookmarks.find(b => b.id === articleId);
        if (bookmark) {
          window.openArticle(bookmark);
        }
      });
    });
    
    sidebarList.querySelectorAll('.sidebar-bookmark-btn--delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.sidebar-bookmark-item');
        const articleId = item.getAttribute('data-article-id');
        LocalStorageService.removeBookmark(articleId);
        window.renderSidebarBookmarks();
      });
    });
    
    // Показываем кнопку поиска если есть закладки
    if (showSearchBtn) {
      showSearchBtn.style.display = 'inline-block';
    }
  };

  // Открытие статьи с отображением в главной области
  window.openArticle = (article) => {
    window.displayArticle(article);
    
    // Закрыть боковую панель на мобильных
    const sidebar = document.querySelector('.bookmarks-sidebar');
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
    
    // Скролл к контейнеру статьи (вместо скролла к началу страницы)
    setTimeout(() => {
      const articleContainer = document.getElementById('article-container');
      if (articleContainer) {
        articleContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Функция для отображения одной статьи
  window.displayArticle = (article) => {
    const container = document.getElementById('article-container');
    if (!container) return;
    
    console.log('📖 Открыта статья:', article);  // Логирование
    
    const imageUrl = `https://picsum.photos/800/400?random=${Math.random()}`;
    const authorsList = Array.isArray(article.authors) 
      ? DataParser.formatAuthors(article.authors)
      : article.authors || 'Unknown';
    const publishDate = article.published 
      ? DataParser.formatDate(article.published)
      : article.date || 'Unknown';
    
    container.innerHTML = `
      <article class="scientific-article__card article-single" itemscope itemtype="https://schema.org/ScholarlyArticle">
        <header class="scientific-article__header">
          <span class="scientific-article__tag">Scientific Article</span>
          <h2 id="article-title" class="scientific-article__title" itemprop="headline">
            ${article.title}
          </h2>
          <div class="scientific-article__meta">
            <time datetime="${article.published}" itemprop="datePublished">
              ${publishDate}
            </time>
            <span class="scientific-article__separator">•</span>
            <span itemprop="author" itemscope itemtype="https://schema.org/Person">
              <span itemprop="name">${authorsList}</span>
            </span>
          </div>
        </header>
        
        <div class="scientific-article__body" itemprop="articleBody">
          <h3>Аннотация</h3>
          <p itemprop="abstract">
            ${article.summary || 'Описание недоступно'}
          </p>
        </div>
        
        <figure class="scientific-article__figure" itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
          ${article.url ? `<a href="${article.url}" target="_blank" rel="noopener noreferrer" class="scientific-article__image-link" title="Открыть статью в arXiv" id="article-image-link">` : ''}
          <img class="scientific-article__image" src="${imageUrl}" alt="${article.title}" loading="eager" ${article.url ? 'style="cursor: pointer;"' : ''}>
          ${article.url ? '</a>' : ''}
          <figcaption itemprop="caption">Иллюстрация к статье</figcaption>
        </figure>
        
        <footer class="scientific-article__footer">
          <div class="article__actions">
            <button class="article__action-btn article__action-btn--bookmark" id="article-bookmark-btn" title="В закладки">
              ☆ В закладки
            </button>
            <button class="article__action-btn article__action-btn--cite" id="article-cite-btn" title="Цитировать">
              📋 Цитировать
            </button>
          </div>
        </footer>
      </article>
    `;
    
    // Слушатели для кнопок
    const bookmarkBtn = document.getElementById('article-bookmark-btn');
    const citeBtn = document.getElementById('article-cite-btn');
    
    // Проверим, закладка ли это
    const isBookmarked = LocalStorageService.isBookmarked(article.id);
    if (isBookmarked) {
      bookmarkBtn.classList.add('bookmarked');
      bookmarkBtn.textContent = '⭐ В закладках';
    }
    
    // Кнопка закладки
    bookmarkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (LocalStorageService.isBookmarked(article.id)) {
        LocalStorageService.removeBookmark(article.id);
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkBtn.textContent = '☆ В закладки';
      } else {
        LocalStorageService.addBookmark({
          id: article.id,
          title: article.title,
          authors: authorsList,
          url: article.url,  // Сохраняем URL статьи
          source: article.source || 'arxiv',
          addedAt: new Date().toISOString()
        });
        bookmarkBtn.classList.add('bookmarked');
        bookmarkBtn.textContent = '⭐ В закладках';
      }
      window.renderSidebarBookmarks();
    });
    
    // Кнопка цитирования
    citeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const citation = `${authorsList}. "${article.title}", ${publishDate}.`;
      navigator.clipboard.writeText(citation).then(() => {
        const original = citeBtn.textContent;
        citeBtn.textContent = '✓ Скопировано!';
        citeBtn.classList.add('cited');
        
        setTimeout(() => {
          citeBtn.textContent = original;
          citeBtn.classList.remove('cited');
        }, 2000);
      });
    });
  };


  window.renderSidebarBookmarks = renderSidebarBookmarks;


  const initSidebar = () => {
    const sidebar = document.querySelector('.bookmarks-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const mobileToggleBtn = document.getElementById('mobile-bookmarks-toggle');
    const desktopToggleBtn = document.getElementById('desktop-bookmarks-toggle');
    const showSearchBtn = document.getElementById('show-search-btn');
    const backBtn = document.getElementById('back-to-bookmarks');
    const bookmarksSection = document.getElementById('bookmarks-sidebar-list');
    const resultsSection = document.getElementById('search-results-section');
    
    if (!toggleBtn) return;
    
    // Функция для переключения между закладками и результатами
    const switchToBookmarks = () => {
      bookmarksSection.style.display = 'block';
      resultsSection.style.display = 'none';
      if (showSearchBtn) showSearchBtn.style.display = 'block';
      if (backBtn) backBtn.style.display = 'none';
    };
    
    const switchToResults = () => {
      bookmarksSection.style.display = 'none';
      resultsSection.style.display = 'block';
      if (showSearchBtn) showSearchBtn.style.display = 'none';
      if (backBtn) backBtn.style.display = 'block';
    };
    
    // Кнопка для свернуть/развернуть (на боковой панели)
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
    });

    // Кнопка для открытия панели (в навигации - десктоп)
    if (desktopToggleBtn) {
      desktopToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.remove('collapsed');
        if (toggleBtn) toggleBtn.textContent = '✕';
      });
    }

    // Кнопка для переключения на результаты поиска
    if (showSearchBtn) {
      showSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToResults();
      });
    }
    
    // Кнопка возврата к закладкам
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToBookmarks();
      });
    }
 
    if (mobileToggleBtn) {
      mobileToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('open');
      });
    }
    
    // Закрыть панель при клике 
    if (window.innerWidth <= 768) {
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
    
    // Обновляем закладки
    renderSidebarBookmarks();
    
    // Экспортируем функции для использования в других местах
    window.switchToBookmarks = switchToBookmarks;
    window.switchToResults = switchToResults;
  };

  initSidebar();

  // === ФУНКЦИОНАЛ ПОИСКА В ARXIV ===
  const initArxivSearch = () => {
    const searchForm = document.getElementById('arxiv-search-form');
    const searchInput = document.getElementById('arxiv-search-input');
    const searchStatus = document.getElementById('search-status');
    const resultsSection = document.getElementById('search-results-section');
    const bookmarksSection = document.getElementById('bookmarks-sidebar-list');
    const backBtn = document.getElementById('back-to-bookmarks');
    const resultsContainer = document.getElementById('arxiv-search-results');

    if (!searchForm) return;

    // Обработка отправки формы поиска
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();

      if (!query) {
        searchStatus.textContent = '⚠️ Введите запрос';
        searchStatus.style.color = '#ff6b6b';
        return;
      }

      searchStatus.textContent = '🔄 Поиск...';
      searchStatus.style.color = '#888';

      try {
        // Проверяем sessionStorage для быстрого поиска
        const cachedSearch = SessionStorageService.getSearchState();
        let results;

        if (cachedSearch && cachedSearch.query === query) {
          results = cachedSearch.results;
          searchStatus.textContent = '✓ Результаты из кеша';
        } else {
          // Ищем в arXiv
          results = await ApiService.searchArXiv(query);
          
          // Сохраняем в sessionStorage для текущей сессии
          SessionStorageService.setSearchState(query, results);
          
          // Сохраняем в localStorage для персистентного кеша
          LocalStorageService.setCache(`arxiv_${query}`, results, 604800000); // 7 дней
          
          // Проверяем используются ли mock данные
          const isMocked = results.every(r => r.title?.includes('Comprehensive Study on') || r.title?.includes('Advanced Techniques') || r.title?.includes('Evolution, Current State') || r.title?.includes('Real-World Applications') || r.title?.includes('Theoretical Foundations'));
          
          if (isMocked) {
            searchStatus.textContent = `⚠️ Тестовые данные (${results.length} примеров)`;
            searchStatus.style.color = '#ffa500';
          } else {
            searchStatus.textContent = `✓ Найдено ${results.length} статей из arXiv`;
            searchStatus.style.color = '#51cf66';
          }
        }

        // Отображаем результаты
        displaySearchResults(results);
        
        // Переключаемся на просмотр результатов
        window.switchToResults();
      } catch (error) {
        console.error('Ошибка поиска:', error);
        searchStatus.textContent = '❌ Ошибка поиска';
        searchStatus.style.color = '#ff6b6b';
      }
    });

    // Функция отображения результатов поиска
    const displaySearchResults = (articles) => {
      console.log('📺 Отображение результатов поиска:', articles);
      
      if (!articles || articles.length === 0) {
        resultsContainer.innerHTML = '<p class="sidebar__empty">Статьи не найдены</p>';
        console.warn('⚠️ Нет статей для отображения');
        return;
      }
      
      console.log(`✅ Отображаем ${articles.length} статей`);

      // Сохраняем статьи для использования в слушателях
      window.currentSearchResults = articles;

      resultsContainer.innerHTML = articles.map(article => {
        const articleId = article.id || DataParser.generateId('arxiv');
        article.id = articleId; // Убедимся что у статьи есть ID
        const isBookmarked = LocalStorageService.isBookmarked(articleId);
        const authorsList = DataParser.formatAuthors(article.authors);
        const title = DataParser.truncateText(article.title, 100);
        const publishDate = DataParser.formatDate(article.published);

        return `
          <div class="search-result-item" data-article-id="${articleId}" style="cursor: pointer;">
            <div class="search-result-item__header">
              <h5 class="search-result-item__title" title="${article.title}">
                ${title}
              </h5>
              <button 
                class="search-result-item__bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                data-article-id="${articleId}"
                title="${isBookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}"
                aria-label="Добавить в закладки"
              >
                ${isBookmarked ? '⭐' : '☆'}
              </button>
            </div>
            <div class="search-result-item__authors" title="${authorsList}">
              ${authorsList}
            </div>
            <div class="search-result-item__date">
              ${publishDate}
            </div>
            <div class="search-result-item__summary" title="${article.summary}">
              ${DataParser.truncateText(article.summary, 120)}
            </div>
            <div class="search-result-item__actions">
              <button 
                class="search-result-item__action search-result-item__action--cite" 
                data-article-id="${articleId}"
                data-title="${article.title}"
                data-authors="${authorsList}"
                data-date="${publishDate}"
                title="Скопировать цитату"
              >
                📋 Цитировать
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Добавляем слушатели для кнопок в результатах
      addSearchResultsListeners(articles);
    };

    // Слушатели для результатов поиска
    const addSearchResultsListeners = (articles) => {
      // Клики на сами результаты для открытия статьи
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          // Не открываем если клик на кнопку
          if (e.target.closest('button')) return;
          
          e.preventDefault();
          const articleId = item.getAttribute('data-article-id');
          const article = articles.find(a => a.id === articleId);
          
          if (article) {
            window.openArticle(article);
          }
        });
      });

      // Кнопки добавления в закладки
      resultsContainer.querySelectorAll('.search-result-item__bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const articleId = btn.getAttribute('data-article-id');
          const resultItem = btn.closest('.search-result-item');
          const title = resultItem.querySelector('.search-result-item__title').textContent;
          const authors = resultItem.querySelector('.search-result-item__authors').textContent;
          
          // Находим статью в текущих результатах чтобы получить её URL
          const article = window.currentSearchResults?.find(a => a.id === articleId);

          if (LocalStorageService.isBookmarked(articleId)) {
            LocalStorageService.removeBookmark(articleId);
            btn.classList.remove('bookmarked');
            btn.textContent = '☆';
            btn.title = 'Добавить в закладки';
          } else {
            LocalStorageService.addBookmark({
              id: articleId,
              title,
              authors,
              url: article?.url || window.location.href,  // Сохраняем URL статьи
              source: 'arxiv',
              addedAt: new Date().toISOString()
            });
            btn.classList.add('bookmarked');
            btn.textContent = '⭐';
            btn.title = 'Удалить из закладок';
          }

          // Обновляем боковую панель
          window.renderSidebarBookmarks();
        });
      });

      // Кнопки цитирования
      resultsContainer.querySelectorAll('.search-result-item__action--cite').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const title = btn.getAttribute('data-title');
          const authors = btn.getAttribute('data-authors');
          const date = btn.getAttribute('data-date');

          const citation = `${authors}. "${title}", ${date}.`;

          navigator.clipboard.writeText(citation).then(() => {
            const original = btn.textContent;
            btn.textContent = '✓ Скопировано!';
            btn.classList.add('cited');
            
            setTimeout(() => {
              btn.textContent = original;
              btn.classList.remove('cited');
            }, 2000);
          });
        });
      });
    };

    // Кнопка возврата к закладкам
    backBtn.addEventListener('click', () => {
      bookmarksSection.style.display = 'block';
      resultsSection.style.display = 'none';
      searchInput.value = '';
      searchStatus.textContent = '';
    });
  };

  initArxivSearch();

  // Обновляем боковую панель
  window.addEventListener('storage', () => {
    renderSidebarBookmarks();
  });
});


