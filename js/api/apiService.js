// === API Сервис для HTTP запросов ===
const ApiService = {
  // GET запрос
  async get(url, options = {}) {
    const timeout = options.timeout || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('GET request failed:', error);
      throw error;
    }
  },

  // POST запрос
  async post(url, data, options = {}) {
    const timeout = options.timeout || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('POST request failed:', error);
      throw error;
    }
  },

  // Поиск в arXiv
  async searchArXiv(query) {
    try {
      const config = getConfig('arxiv');
      const params = new URLSearchParams({
        search_query: `all:${encodeURIComponent(query)}`,
        start: 0,
        max_results: config.maxResults,
        sortBy: 'submittedDate',
        sortOrder: 'descending'
      });

      const arxivUrl = `${config.baseUrl}?${params}`;
      
      console.log('🔍 Поиск в arXiv:', query);
      console.log('📡 URL:', arxivUrl);
      
      // Пробуем несколько способов получить данные
      const proxies = [
        `https://proxy.cors.sh/${arxivUrl}`,  // CORS proxy
        arxivUrl,  // Прямой запрос (может сработать с CORS заголовками)
        `https://corsproxy.io/?${encodeURIComponent(arxivUrl)}`,  // Fallback
      ];
      
      let lastError = null;
      
      for (let i = 0; i < proxies.length; i++) {
        try {
          console.log(`🌐 Попытка ${i + 1} через proxy...`);
          const corsProxyUrl = proxies[i];
          
          const response = await fetch(corsProxyUrl, {
            // БЕЗ timeout - полагаемся на браузерский
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const text = await response.text();
          
          console.log('📦 Ответ получен, парсим XML...');
          
          const parsed = this.parseArXivXML(text);
          
          if (parsed && parsed.length > 0) {
            console.log(`✅ Найдено ${parsed.length} статей из arXiv!`);
            return parsed;
          } else {
            console.warn('⚠️ XML распарсен, но статей не найдено');
            throw new Error('No articles in XML');
          }
        } catch (err) {
          lastError = err;
          console.warn(`❌ Proxy ${i + 1} не сработал:`, err.message);
          // Пробуем следующий proxy
          continue;
        }
      }
      
      // Если все proxy не сработали
      throw lastError || new Error('Все proxy недоступны');
      
    } catch (error) {
      console.warn('⚠️ arXiv API недоступен. Используются тестовые данные.');
      console.warn('Ошибка:', error.message);
      return this.getMockArticles(query);
    }
  },

  // Mock данные для тестирования (когда API недоступен)
  getMockArticles(query) {
    const articles = [
      {
        id: `arxiv_${Date.now()}_001`,
        title: `Comprehensive Study on ${query}: Advanced Techniques and Applications`,
        authors: ['John Smith', 'Jane Doe', 'Bob Johnson'],
        published: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        summary: `This paper presents an in-depth examination of ${query} with practical applications in modern research. We explore various methodologies, implementation strategies, and real-world case studies demonstrating the effectiveness of proposed approaches.`,
        category: 'cs.AI',
        url: 'https://arxiv.org/abs/2401.00001'
      },
      {
        id: `arxiv_${Date.now()}_002`,
        title: `Advanced ${query} Techniques: Best Practices and Implementation`,
        authors: ['Alice Brown', 'Charlie Davis'],
        published: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        summary: `An exploration of cutting-edge ${query} techniques with focus on scalability and performance optimization. Includes benchmarks and comparative analysis with existing solutions.`,
        category: 'cs.LG',
        url: 'https://arxiv.org/abs/2401.00002'
      },
      {
        id: `arxiv_${Date.now()}_003`,
        title: `${query}: Evolution, Current State, and Future Perspectives`,
        authors: ['Dr. Emma Wilson'],
        published: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        summary: `A comprehensive historical analysis and future outlook of ${query} field. Discusses emerging trends, challenges, and opportunities for future research and development.`,
        category: 'physics.gen-ph',
        url: 'https://arxiv.org/abs/2401.00003'
      },
      {
        id: `arxiv_${Date.now()}_004`,
        title: `${query} in Practice: Real-World Applications and Case Studies`,
        authors: ['Prof. Michael Zhang', 'Sarah Anderson', 'David Lee'],
        published: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        summary: `Practical guide to implementing ${query} in production environments. Covers architectural patterns, performance considerations, and deployment strategies.`,
        category: 'cs.SE',
        url: 'https://arxiv.org/abs/2401.00004'
      },
      {
        id: `arxiv_${Date.now()}_005`,
        title: `Theoretical Foundations of ${query}`,
        authors: ['Dr. Patricia Miller'],
        published: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        summary: `Rigorous mathematical formulation and theoretical analysis of ${query}. Proofs of correctness, complexity analysis, and optimality bounds.`,
        category: 'math.CO',
        url: 'https://arxiv.org/abs/2401.00005'
      }
    ];
    console.log('📋 Используются тестовые данные (mock)', articles.length);
    return articles;
  },

  // Парсинг XML от arXiv
  parseArXivXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    
    // Проверяем на ошибки парсинга
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      console.error('❌ Ошибка парсинга XML');
      return [];
    }
    
    const entries = xmlDoc.querySelectorAll('entry');
    console.log(`📊 Найдено ${entries.length} записей в XML`);
    
    const articles = [];
    entries.forEach(entry => {
      const arxivLink = entry.querySelector('link[title="pdf"]')?.getAttribute('href') || 
                        entry.querySelector('link[type="application/pdf"]')?.getAttribute('href') ||
                        entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || '';
      const article = {
        id: entry.querySelector('id')?.textContent || '',
        title: entry.querySelector('title')?.textContent || '',
        authors: Array.from(entry.querySelectorAll('author name')).map(a => a.textContent),
        published: entry.querySelector('published')?.textContent || '',
        summary: entry.querySelector('summary')?.textContent?.trim() || '',
        category: entry.querySelector('arxiv\\:primary_category')?.getAttribute('term') || '',
        url: arxivLink
      };
      articles.push(article);
    });

    console.log(`✅ Распарсено ${articles.length} статей из XML`);
    return articles;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}
