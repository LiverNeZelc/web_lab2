document.addEventListener('DOMContentLoaded', () => {
  const heading = document.querySelector('h1');
  
  heading.style.opacity = '0';
  heading.style.transition = 'opacity 1.2s ease-in-out';
  
  setTimeout(() => {
    heading.style.opacity = '1';
  }, 300);
  
  console.log('Добро пожаловать в ScienceJournal!');

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
});


