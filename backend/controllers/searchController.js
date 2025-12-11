const axios = require('axios');
const User = require('../models/User');

exports.searchNews = async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }
    try {
        const apiKey = process.env.NEWS_API_KEY;
        let articles = [];
        let page = 1;
        const pageSize = 20; // NewsAPI max is 100, but 20 is safe for free tier
        while (articles.length < 50 && page <= 3) { // Try up to 3 pages (60 articles max)
            const response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: query,
                    apiKey: apiKey,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize,
                    page
                }
            });
            const newArticles = response.data.articles.filter(article => {
                const qLower = query.toLowerCase();
                const title = (article.title || '').toLowerCase();
                const desc = (article.description || '').toLowerCase();
                return title.includes(qLower) || desc.includes(qLower);
            }).map(article => ({
                title: article.title,
                url: article.url,
                publishedAt: article.publishedAt,
                source: article.source.name,
                description: article.description
            }));
            articles = articles.concat(newArticles);
            if (newArticles.length < pageSize) break; // No more articles available
            page++;
        }
        // Sort by publishedAt (most recent first)
        articles = articles.filter(a => a.publishedAt).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        articles = articles.slice(0, 50);

        // Save search term to user's history
        await User.findByIdAndUpdate(
            req.user.userId,
            { $push: { searchHistory: query } },
            { new: true }
        );

        return res.status(200).json({ articles });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch articles', details: error.message });
    }
}; 