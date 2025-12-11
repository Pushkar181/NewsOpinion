const axios = require('axios');

exports.summarizeArticles = async (req, res) => {
    const { articles } = req.body;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ error: 'Articles array is required' });
    }
    try {
        // Concatenate all article descriptions/texts
        const textToSummarize = articles.map(a => a.description || a.title || '').join(' ');
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that summarizes news articles.' },
                    { role: 'user', content: `Summarize the following news content in a single, well-written paragraph. Bold important facts, numbers, names, or keywords using Markdown (**bold**). Here is the content: ${textToSummarize}` }
                ],
                max_tokens: 250
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const summary = response.data.choices[0].message.content.trim();
        return res.status(200).json({ summary });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to summarize articles', details: error.message });
    }
}; 