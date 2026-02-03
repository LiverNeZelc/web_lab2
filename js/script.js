document.addEventListener('DOMContentLoaded', () => {
  const heading = document.querySelector('h1');
  
  heading.style.opacity = '0';
  heading.style.transition = 'opacity 1.2s ease-in-out';
  
  setTimeout(() => {
    heading.style.opacity = '1';
  }, 300);
  
  console.log('Добро пожаловать в ScienceJournal!');
});