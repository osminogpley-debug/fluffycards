import axios from 'axios';

class AISuggestionService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async getDefinitionSuggestion(term) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides clear, concise definitions for educational terms. Provide definitions that are easy to understand and remember."
            },
            {
              role: "user",
              content: `Provide a clear definition for the term: "${term}"`
            }
          ],
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI suggestion error:', error);
      return null;
    }
  }

  async getImageSuggestion(term) {
    try {
      // Use Unsplash API for image suggestions
      const response = await axios.get(
        `https://api.unsplash.com/search/photos`,
        {
          params: {
            query: term,
            per_page: 1,
            orientation: 'landscape'
          },
          headers: {
            'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (response.data.results.length > 0) {
        return {
          url: response.data.results[0].urls.small,
          alt: response.data.results[0].alt_description || term
        };
      }
      
      return null;
    } catch (error) {
      console.error('Image suggestion error:', error);
      return null;
    }
  }

  async getStudyTips(cards) {
    try {
      const cardList = cards.map(card => `${card.term}: ${card.definition}`).join('\n');
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert educational assistant. Provide personalized study tips based on the flashcards provided. Suggest effective learning strategies."
            },
            {
              role: "user",
              content: `Here are my flashcards:\n${cardList}\n\nProvide personalized study tips and learning strategies.`
            }
          ],
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Study tips error:', error);
      return null;
    }
  }
}

export default new AISuggestionService();
