// Vercel Serverless Function for Search

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { query } = req.body;
        
        // Clean the search query
        let searchTerm = query.toLowerCase()
            .replace(/search for/g, '')
            .replace(/search/g, '')
            .replace(/find/g, '')
            .replace(/google/g, '')
            .replace(/look up/g, '')
            .trim();
        
        // Use DuckDuckGo Instant Answer API (free, no key needed)
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}&format=json&no_html=1`;
        
        const response = await fetch(ddgUrl);
        const data = await response.json();
        
        const results = [];
        
        // Abstract (main answer)
        if (data.Abstract) {
            results.push({
                title: data.Heading || searchTerm,
                snippet: data.Abstract,
                url: data.AbstractURL || ''
            });
        }
        
        // Related topics
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 5).forEach(topic => {
                if (topic.Text) {
                    results.push({
                        title: topic.Text.split(' - ')[0] || 'Related',
                        snippet: topic.Text,
                        url: topic.FirstURL || ''
                    });
                }
            });
        }
        
        // If no results, provide helpful response
        if (results.length === 0) {
            results.push({
                title: `Search: ${searchTerm}`,
                snippet: `I searched for "${searchTerm}" but couldn't find detailed results. Try asking me a more specific question!`,
                url: ''
            });
        }
        
        return res.status(200).json({ results });
        
    } catch (error) {
        console.error('Search API Error:', error);
        return res.status(200).json({ 
            results: [{
                title: 'Search Error',
                snippet: 'I had trouble searching. Please try again with different words.',
                url: ''
            }]
        });
    }
}
