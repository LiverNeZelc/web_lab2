// Модальное окно авторизации
const initAuthModal = () => {
  const modal = document.getElementById('auth-modal');
  const openBtns = document.querySelectorAll('[data-open-auth]');
  const closeBtn = document.querySelector('.modal__close');
  const form = document.getElementById('auth-form');

  if (!modal || openBtns.length === 0) return;

  // Открытие модального окна
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Закрытие модального окна
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Закрытие при клике на фон
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Закрытие при нажатии Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Обработка формы
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]')?.value;
      const password = form.querySelector('[name="password"]')?.value;
      
      if (email && password) {
        console.log('Login attempted:', { email });
        closeModal();
        form.reset();
      }
    });
  }
};
