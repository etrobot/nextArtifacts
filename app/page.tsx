'use client';
import React, { useState, useEffect } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CodeSnippet {
  language: 'jsx' | 'js' | 'html' | 'tsx';
  code: string;
}

const Coding: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [language, setLanguage] = useState<'jsx' | 'js' | 'html' | 'tsx'>('jsx');
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(0);

  // New state variables for API base URL, key, and model
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const handleSendMessage = async () => {
    const userMessage = { role: 'user' as const, content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    setIsStreaming(true);

    const response = await fetch(`/api/coding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        apiKey,
        model, 
        apiBaseUrl
      }),
    });

    const reader = response.body?.getReader();
    const textDecoder = new TextDecoder();
    let buffer = '';
    let reply = '';

    if (reader) {
      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: reply }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += textDecoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const json = line.trim().substring(6);
            try {
              const parsedMessage = JSON.parse(json);

              if (parsedMessage.choices[0].delta) {
                reply += parsedMessage.choices[0].delta.content ?? '';
                setMessages((prevMessages) => [...prevMessages.slice(0, -1), { role: 'assistant', content: reply }]);
              }else{
                setIsStreaming(false);
                break;
              }
              if (parsedMessage.choices[0].finish_reason === 'stop') {
                setIsStreaming(false);
                break;
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
    } else {
      setIsStreaming(false);
    }
  };

  const extractCodeSnippets = (content: string): CodeSnippet[] => {
    const regex = /```(\w+)?\s*([\s\S]*?)```/g;
    const snippets: CodeSnippet[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lang = (match[1] || 'jsx') as 'jsx' | 'js' | 'html';
      snippets.push({ language: lang, code: match[2].trim() });
    }

    return snippets;
  };

  const handleCodeSelection = (index: number) => {
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    if (assistantMessages[index]) {
      var snippets: CodeSnippet[]  = [{code:assistantMessages[index].content,language}];
      if(assistantMessages[index].content.includes('```')){
        snippets = extractCodeSnippets(assistantMessages[index].content);
      }
      if (snippets.length > 0) {
        setSelectedCode(snippets[0].code);
        setLanguage(snippets[0].language);
        setSelectedMessageIndex(index);
      }
    }
  };

  useEffect(() => {
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length > 0) {
      const lastMessageIndex = assistantMessages.length - 1;
      var snippets: CodeSnippet[]  = [{code:assistantMessages[lastMessageIndex].content,language}];
      if(assistantMessages[lastMessageIndex].content.includes('```')){
        snippets = extractCodeSnippets(assistantMessages[lastMessageIndex].content);
      }
      if (snippets.length > 0) {
        handleCodeSelection(lastMessageIndex);
      }
    }
  }, [messages]);

  const assistantMessages = messages.filter(msg => msg.role === 'assistant');

  return (
    <div className="flex flex-col h-screen p-2">
      <div className="flex-1">
        <SandpackProvider
          template="react"
          theme="dark"
          files={{
            '/App.js': {
              code: selectedCode,
              active: true,
            },
          }}
          customSetup={{
            entry: '/index.js',
            environment: language === 'html' ? 'static' : 'create-react-app',
          }}
        >
          <SandpackLayout>
            <SandpackCodeEditor />
            <SandpackPreview />
          </SandpackLayout>
        </SandpackProvider>
        {assistantMessages.length > 0 && (
          <select
          value={selectedMessageIndex}
          onChange={(e) => handleCodeSelection(parseInt(e.target.value, 10))}
          className="p-2 border border-gray-300 rounded"
        >
          {assistantMessages.map((_, index) => (
            <option key={index} value={index}>
              Message {assistantMessages.length - index}
            </option>
          ))}
        </select>
        )}
      </div>
      <div className="flex-1 overflow-y-auto mb-20 p-2">
        {messages.map((message, index) => (
          <div className='w-full flex' key={index}>
            <span
              className={`${message.role === 'user' ? 'ml-auto bg-blue-500 bg-opacity-20 rounded-md my-2 p-2 max-w-xs' : ''}`}
              dangerouslySetInnerHTML={{ __html: message.role === 'assistant' ? '🤖: ' + message.content.replace(/\n/g, '<br>') : message.content }}
            />
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 items-center mb-2 w-full px-2">
      <div className="flex mb-1 gap-2">
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
          className="p-2 border border-gray-300 rounded w-full"
        />
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Model"
          className="p-2 border border-gray-300 rounded w-full"
        />
        <input
          type="text"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          placeholder="API Base URL"
          className="p-2 border border-gray-300 rounded w-full text-right"
        />
        <span className='py-1'>/v1/chat/completions</span>
      </div>
      <div className="flex items-center w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSendMessage();
              e.preventDefault();
            }
          }}
          disabled={isStreaming}
          className="flex-1 p-2 border border-gray-300 rounded w-full mr-2"
        />
        <button onClick={handleSendMessage} disabled={isStreaming} className="p-2 border border-gray-300 rounded mr-2">
          Send
        </button>
      </div>
      </div>
    </div>
  );
};

export default Coding;
