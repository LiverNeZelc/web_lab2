
const initCitations = () => {
  // кнопки цитирования к каждой статье
  document.querySelectorAll('.scientific-article__card').forEach(article => {
    const footer = article.querySelector('.scientific-article__footer');
    if (footer) {
      const citationBtn = document.createElement('button');
      citationBtn.className = 'citation-btn';
      citationBtn.setAttribute('aria-label', 'Скопировать цитату');
      citationBtn.innerHTML = 'Цитировать';
      citationBtn.type = 'button';
      
      footer.appendChild(citationBtn);

      citationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleCitation(article, citationBtn);
      });
    }
  });
};

const handleCitation = (article, btn) => {
  const title = article.querySelector('.scientific-article__title')?.textContent || 'Unknown';
  const authors = article.querySelector('[itemprop="author"] [itemprop="name"]')?.textContent || 'Unknown Author';
  const date = article.querySelector('[datetime]')?.getAttribute('datetime') || 'Unknown Date';
  const journal = article.querySelector('[itemprop="name"]')?.textContent || 'Fyrre Journal';

  const citation = `${authors}. "${title}" ${journal}, ${date}.`;
  
  navigator.clipboard.writeText(citation).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Скопировано!';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 2000);
  });
};
