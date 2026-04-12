// бар чтения статьи
const initReadingProgress = () => {
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  document.body.insertBefore(progressBar, document.body.firstChild);

  let currentArticle = null;

  const updateProgress = () => {
    if (!currentArticle) {
      progressBar.style.opacity = '0';
      return;
    }

    const rect = currentArticle.getBoundingClientRect();
    const articleStart = currentArticle.offsetTop;
    const articleEnd = articleStart + currentArticle.offsetHeight;
    const scrollTop = window.scrollY;

    let progress;
    if (scrollTop < articleStart) {
      progress = 0;
    } else if (scrollTop > articleEnd) {
      progress = 100;
    } else {
      progress = ((scrollTop - articleStart) / currentArticle.offsetHeight) * 100;
    }

    progressBar.style.width = progress + '%';
  };

  // слушатели каждой статьи
  document.querySelectorAll('.scientific-article__card').forEach(article => {
    article.addEventListener('mouseenter', () => {
      currentArticle = article;
      progressBar.style.opacity = '1';
      updateProgress();
    });

    article.addEventListener('mouseleave', () => {
      currentArticle = null;
      progressBar.style.opacity = '0';
    });
  });

  window.addEventListener('scroll', updateProgress);
};
