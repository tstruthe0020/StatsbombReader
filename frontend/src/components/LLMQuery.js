import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MessageCircle, Brain, Clock } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const LLMQuery = () => {
  const [queryInput, setQueryInput] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLLMQuery = async () => {
    if (!queryInput.trim()) return;
    
    try {
      setQueryLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/api/query`, {
        query: queryInput,
        context: 'Soccer analytics query'
      });
      
      if (response.data.success) {
        const newQuery = {
          id: Date.now(),
          query: queryInput,
          response: response.data.data.response,
          timestamp: new Date().toLocaleTimeString(),
          model_used: response.data.data.model_used || 'AI Assistant'
        };
        
        setQueryHistory(prev => [newQuery, ...prev]);
        setQueryInput('');
      }
    } catch (err) {
      setError('Failed to process query. Please try again.');
      console.error('LLM Query error:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🤖 AI-Powered Soccer Analytics
        </h2>
        <p className="text-gray-600 mt-2">Ask questions in natural language about soccer statistics and referee patterns</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Query Input Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <MessageCircle className="w-5 h-5" />
            Ask the AI Assistant
          </CardTitle>
          <CardDescription className="text-purple-600">
            Ask questions like "Which referee gives the most cards?" or "Show me foul patterns in La Liga"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !queryLoading && handleLLMQuery()}
                placeholder="e.g., What are the most common foul types in European competitions?"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={queryLoading}
              />
            </div>
            <Button 
              onClick={handleLLMQuery}
              disabled={queryLoading || !queryInput.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {queryLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Ask AI'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Sample Questions
          </CardTitle>
          <CardDescription>Try these example queries to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Which referee gives the most cards?",
              "What are the most common foul types?",
              "How do referee decisions vary by competition?",
              "Show me patterns in La Liga vs Champions League",
              "Which positions get the most fouls?",
              "Are referees biased towards home teams?"
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left h-auto p-3 hover:bg-purple-50"
                onClick={() => setQueryInput(question)}
              >
                <span className="text-sm">{question}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Query History
            </CardTitle>
            <CardDescription>Your recent AI conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {queryHistory.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700">You asked:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.model_used}
                      </Badge>
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-3 bg-gray-50 p-3 rounded">{item.query}</p>
                  
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-purple-500 mt-1" />
                    <div>
                      <span className="font-medium text-purple-700">AI Response:</span>
                      <div className="mt-2 text-gray-700 prose prose-sm max-w-none">
                        {item.response.split('\n').map((line, idx) => (
                          <p key={idx} className="mb-2">{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🚀 AI-Powered Analytics</CardTitle>
          <CardDescription className="text-blue-600">
            Our AI assistant has access to comprehensive StatsBomb data and advanced analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-500">GPT-4 Powered</Badge>
            <Badge className="bg-green-500">Live Data Access</Badge>
            <Badge className="bg-purple-500">13 Analytics Endpoints</Badge>
            <Badge className="bg-red-500">Professional Insights</Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default LLMQuery;