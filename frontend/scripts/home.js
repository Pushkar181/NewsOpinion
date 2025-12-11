document.addEventListener('DOMContentLoaded', function() {
    const recommendationsContainer = document.getElementById('recommendations');
    const summaryContent = document.getElementById('summaryContent');
    const token = localStorage.getItem('jwt_token');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const dynamicBg = document.getElementById('dynamicBg');
    const backBtn = document.getElementById('backBtn');
    let showingSearchResults = false;
    let historyStack = [];
    let allArticles = [];
    let articlesShown = 0;
    const PAGE_SIZE = 14;

    const DEFAULT_BG = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";
    const UNSPLASH_KEY = "Uo18RC39n8npil5ADJmVu3xhKff_5zn5D641jrNmY2A"; // <-- Set your Unsplash API key here

    async function setDynamicBackground(query) {
        if (!query) {
            dynamicBg.style.backgroundImage = `url('${DEFAULT_BG}')`;
            return;
        }
        try {
            const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_KEY}&orientation=landscape&per_page=1`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    dynamicBg.style.backgroundImage = `url('${data.results[0].urls.regular}')`;
                    return;
                }
            }
        } catch (err) {}
        dynamicBg.style.backgroundImage = `url('${DEFAULT_BG}')`;
    }

    async function fetchRecommendations() {
        await setDynamicBackground();
        if (!token) {
            recommendationsContainer.innerHTML = '<p>Please log in to see recommendations.</p>';
            return;
        }
        try {
            const res = await fetch('http://localhost:8000/api/user/recommendations', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok && data.recommendations && data.recommendations.length > 0) {
                allArticles = data.recommendations;
                articlesShown = 0;
                renderRecommendations(allArticles.slice(0, PAGE_SIZE), false);
                articlesShown = PAGE_SIZE;
                renderLoadMoreButton();
            } else {
                recommendationsContainer.innerHTML = '<p>No recommendations found.</p>';
            }
        } catch (err) {
            recommendationsContainer.innerHTML = '<p>Failed to load recommendations.</p>';
        }
    }

    async function fetchSearchResults(query) {
        await setDynamicBackground(query);
        if (!token) {
            recommendationsContainer.innerHTML = '<p>Please log in to search.</p>';
            return;
        }
        try {
            recommendationsContainer.innerHTML = '<p>Searching...</p>';
            const res = await fetch('http://localhost:8000/api/search', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if (res.ok && data.articles && data.articles.length > 0) {
                allArticles = data.articles; // Store all search results
                articlesShown = 0;
                renderRecommendations(allArticles.slice(0, PAGE_SIZE), true, query);
                articlesShown = PAGE_SIZE;
                renderLoadMoreButton();
            } else {
                recommendationsContainer.innerHTML = '<p>No results found for "' + query + '".</p>';
            }
        } catch (err) {
            recommendationsContainer.innerHTML = '<p>Failed to search articles.</p>';
        }
    }

    async function fetchAndShowSummary(articles) {
        const summaryContent = document.getElementById('summaryContent');
        summaryContent.textContent = 'Loading summary...';
        const token = localStorage.getItem('jwt_token');
        try {
            const res = await fetch('http://localhost:8000/api/summarize', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ articles })
            });
            const data = await res.json();
            if (res.ok && data.summary) {
                // Convert Markdown bold to HTML bold
                let html = data.summary.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                summaryContent.innerHTML = html;
            } else {
                summaryContent.textContent = 'Could not generate summary.';
            }
        } catch (err) {
            summaryContent.textContent = 'Failed to load summary.';
        }
    }

    function renderLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        loadMoreContainer.innerHTML = '';
        if (articlesShown < allArticles.length) {
            const btn = document.createElement('button');
            btn.id = 'loadMoreBtn';
            btn.textContent = 'Load More';
            btn.className = 'load-more-btn';
            btn.onclick = function() {
                const nextArticles = allArticles.slice(articlesShown, articlesShown + PAGE_SIZE);
                appendRecommendations(nextArticles);
                articlesShown += nextArticles.length;
                renderLoadMoreButton();
            };
            loadMoreContainer.appendChild(btn);
        }
    }

    function appendRecommendations(articles) {
        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.innerHTML = `
                <div class="article-topic" style="background:${getTopicColor(article.topic)};">${article.topic || 'General'}</div>
                <div class="article-title">${article.title || ''}</div>
                <div class="article-meta">${formatDate(article.publishedAt)} | ${article.source || ''}</div>
                <div class="article-desc">${article.description || ''}</div>
                <a href="${article.url}" class="article-link" target="_blank">Read More</a>
            `;
            recommendationsContainer.appendChild(card);
        });
    }

    function renderRecommendations(articles, isSearch = false, query = '') {
        recommendationsContainer.innerHTML = '';
        // Also clear load more container on new render
        document.getElementById('loadMoreContainer').innerHTML = '';
        showingSearchResults = isSearch;
        // Show/hide summary panel and adjust layout
        const summaryPanel = document.getElementById('summaryPanel');
        const resultsHeading = document.getElementById('resultsHeading');
        const mainContent = document.getElementById('mainContent');
        if (isSearch) {
            summaryPanel.style.display = 'flex';
            resultsHeading.textContent = `Results for "${query}"`;
            mainContent.classList.add('with-summary');
            fetchAndShowSummary(articles);
        } else {
            summaryPanel.style.display = 'none';
            resultsHeading.textContent = '';
            mainContent.classList.remove('with-summary');
        }
        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.innerHTML = `
                <div class="article-topic" style="background:${getTopicColor(article.topic)};">${article.topic || (isSearch ? 'Search' : 'General')}</div>
                <div class="article-title">${article.title || ''}</div>
                <div class="article-meta">${formatDate(article.publishedAt)} | ${article.source || ''}</div>
                <div class="article-desc">${article.description || ''}</div>
                <a href="${article.url}" class="article-link" target="_blank">Read More</a>
            `;
            recommendationsContainer.appendChild(card);
        });
        if (!isSearch) renderLoadMoreButton();
    }

    function getTopicColor(topic) {
        switch ((topic || '').toLowerCase()) {
            case 'politics': return '#ffd700';
            case 'sports': return '#4caf50';
            case 'technology': return '#2196f3';
            case 'entertainment': return '#e91e63';
            case 'health': return '#ff9800';
            case 'business': return '#9c27b0';
            case 'religion': return '#ff5722';
            case 'search': return '#607d8b';
            default: return '#14203c';
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Search form handler
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            historyStack.push({ type: showingSearchResults ? 'search' : 'home', query: searchInput.value });
            fetchSearchResults(query);
        }
    });

    // Back button handler
    backBtn.addEventListener('click', function() {
        if (historyStack.length === 0) {
            // Already at home
            searchInput.value = '';
            setDynamicBackground();
            fetchRecommendations();
            return;
        }
        const last = historyStack.pop();
        if (last.type === 'search' && last.query) {
            searchInput.value = last.query;
            fetchSearchResults(last.query);
        } else {
            searchInput.value = '';
            setDynamicBackground();
            fetchRecommendations();
        }
    });

    // Initial load
    fetchRecommendations();
}); 