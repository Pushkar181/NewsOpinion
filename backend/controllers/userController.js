const axios = require('axios');
const User = require('../models/User');

exports.getSearchHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ history: user.searchHistory });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch search history' });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const apiKey = process.env.NEWS_API_KEY;
        // Always include diverse topics
        const diverseTopics = ['politics', 'sports', 'technology', 'entertainment', 'health', 'business'];
        // Get top 2 user topics (if any)
        let userTopics = [];
        if (user.searchHistory && user.searchHistory.length > 0) {
            const freq = {};
            user.searchHistory.forEach(term => { freq[term] = (freq[term] || 0) + 1; });
            userTopics = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 2);
        }
        // Fetch 5 articles per diverse topic, 8 per user topic
        let articles = [];
        for (const topic of diverseTopics) {
            const response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: topic,
                    apiKey: apiKey,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 5
                }
            });
            const topicArticles = response.data.articles.map(article => ({
                title: article.title,
                url: article.url,
                publishedAt: article.publishedAt,
                source: article.source.name,
                description: article.description,
                topic
            }));
            articles = articles.concat(topicArticles);
        }
        for (const topic of userTopics) {
            const response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: topic,
                    apiKey: apiKey,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 8
                }
            });
            const topicArticles = response.data.articles.map(article => ({
                title: article.title,
                url: article.url,
                publishedAt: article.publishedAt,
                source: article.source.name,
                description: article.description,
                topic
            }));
            articles = articles.concat(topicArticles);
        }
        // Sort by publishedAt (most recent first)
        articles = articles.filter(a => a.publishedAt).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        // Return top 50 articles
        articles = articles.slice(0, 50);
        return res.status(200).json({ recommendations: articles });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
    }
}; 