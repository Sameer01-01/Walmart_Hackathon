import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Bot, Copy, Check, Volume2, VolumeX, Mic, MicOff, Download, Leaf, Sun, Wind, Droplets, Zap, RefreshCcw, RotateCcw, Share, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Code, Save, Settings, Info, Edit3, User, PieChart, Clock, Star, BookOpen, MessageSquare, FileText, Moon, Heart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, AnimateSharedLayout } from 'framer-motion';
const genAI = new GoogleGenerativeAI('AIzaSyDzYHVthRT3e9Hy9UNu9CBGgBfRqjWYKVw');

// AI Personalities with preset personalities 
const aiPersonas = [
  { 
    id: 'standard',
    name: 'Learning Guide',
    description: 'Balanced and helpful learning assistant',
    prompt: 'You are a learning assistant focused on sustainability education. Provide helpful, educational responses.',
    icon: <Bot />,
    color: 'indigo'
  },
  { 
    id: 'eco',
    name: 'Eco Expert',
    description: 'Specialist in sustainability and environmental topics',
    prompt: 'You are a sustainability education expert. Provide eco-friendly insights and emphasize green solutions in your responses.',
    icon: <Leaf />,
    color: 'green'
  },
  { 
    id: 'technical',
    name: 'Tech Educator',
    description: 'Technical and science-focused educator',
    prompt: 'You are a technical educator focused on sustainability technologies. Provide detailed technical explanations and examples when appropriate.',
    icon: <Code />,
    color: 'blue'
  },
  { 
    id: 'creative',
    name: 'Sustainability Innovator',
    description: 'Creative and inspirational sustainability guide',
    prompt: 'You are a creative sustainability educator. Provide imaginative, artistic responses that inspire creativity in sustainability practices.',
    icon: <Sparkles />,
    color: 'purple'
  }
];

// Sustainability tips database
const sustainabilityTips = [
  "Try using public transportation or cycling to reduce carbon emissions.",
  "Switch to LED light bulbs to save energy and money.",
  "Reduce meat consumption to lower your carbon footprint.",
  "Use reusable water bottles instead of single-use plastic.",
  "Opt for locally grown produce to reduce transportation emissions.",
  "Turn off lights and unplug electronics when not in use.",
  "Consider composting food waste to reduce landfill methane emissions.",
  "Hang-dry clothes instead of using a dryer when possible.",
  "Use eco-friendly cleaning products to reduce water pollution.",
  "Plant trees or support tree-planting initiatives to offset carbon emissions."
];

// Sustainability prompts for the chatbot
const sustainabilityPrompts = [
  "How can I reduce my carbon footprint?",
  "What are sustainable alternatives to plastic?",
  "Share some water conservation tips",
  "How to create a zero-waste kitchen?",
  "Explain renewable energy options for my home",
  "Tips for sustainable fashion choices",
  "How can I reduce food waste?",
  "What is the impact of meat consumption on the environment?",
  "How to start composting at home?",
  "Sustainable transportation options"
];

export function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sustainabilityMode, setSustainabilityMode] = useState(false);
  const [sustainabilityScore, setSustainabilityScore] = useState(0);
  const [dailyTip, setDailyTip] = useState('');
  const [theme, setTheme] = useState('light');
  const [chatHistory, setChatHistory] = useState([]);
  
  // New advanced states
  const [currentPersona, setCurrentPersona] = useState(aiPersonas[0]);
  const [imageInput, setImageInput] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [messageContexts, setMessageContexts] = useState({}); // Stores analytics for messages
  const [showPersonaDrawer, setShowPersonaDrawer] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typingEffect, setTypingEffect] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(30); // ms per character
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState(null);
  const [typingMessage, setTypingMessage] = useState("");
  const [chatAnalytics, setChatAnalytics] = useState({
    totalMessages: 0,
    topicFrequency: {},
    responseTime: [],
    userSentiment: []
  });
  
  // Refs
  const chatContainerRef = useRef(null);
  const speechSynthRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageUploadRef = useRef(null);

  // Get daily sustainability tip and initialize
  useEffect(() => {
    const randomTip = sustainabilityTips[Math.floor(Math.random() * sustainabilityTips.length)];
    setDailyTip(randomTip);
    
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
    
    // Load saved prompts
    const savedPromptsData = localStorage.getItem('savedPrompts');
    if (savedPromptsData) {
      setSavedPrompts(JSON.parse(savedPromptsData));
    }
    
    // Load user preferences
    const userPrefs = localStorage.getItem('chatPreferences');
    if (userPrefs) {
      const prefs = JSON.parse(userPrefs);
      setTheme(prefs.theme || 'light');
      setTemperature(prefs.temperature || 0.7);
      setTypingEffect(prefs.typingEffect !== undefined ? prefs.typingEffect : true);
      setTypingSpeed(prefs.typingSpeed || 30);
      
      // Set persona if saved
      if (prefs.persona) {
        const savedPersona = aiPersonas.find(p => p.id === prefs.persona);
        if (savedPersona) setCurrentPersona(savedPersona);
      }
    }
    
    // Check system color scheme preference
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode && !localStorage.getItem('chatPreferences')) {
      setTheme('dark');
    }
    
    // Initialize with welcome message
    setMessages([{ 
      id: Date.now(),
      role: 'bot', 
      content: 'Hello! I am your SustainLab Learning assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
      persona: aiPersonas[0].id
    }]);
    
    // Listen for dark mode changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => {
      if (!localStorage.getItem('chatPreferences')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);
  
  // Save user preferences
  useEffect(() => {
    const preferences = {
      theme,
      temperature,
      typingEffect,
      typingSpeed,
      persona: currentPersona.id
    };
    localStorage.setItem('chatPreferences', JSON.stringify(preferences));
  }, [theme, temperature, typingEffect, typingSpeed, currentPersona]);
  
  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) { // Only save if there are actual conversations
      const historyEntry = {
        id: Date.now(),
        title: messages[0]?.content?.substring(0, 30) + '...',
        messages: messages,
        date: new Date().toISOString()
      };
      
      const updatedHistory = [historyEntry, ...chatHistory.slice(0, 4)]; // Keep last 5 conversations
      setChatHistory(updatedHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !imageInput) return;

    const messageId = Date.now();
    const userMessage = input.trim();
    const startTime = performance.now();
    setInput('');
    
    // Create user message object
    const newUserMessage = { 
      id: messageId,
      role: 'user', 
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    // If there's an image, add it to the message
    if (imageInput) {
      newUserMessage.image = imageInput;
      setImageInput(null);
      setShowImagePreview(false);
    }
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Update analytics
      setChatAnalytics(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1
      }));
      
      // Check if message is sustainability related to update score
      const sustainabilityKeywords = ['sustainability', 'climate', 'green', 'eco', 'environment', 'renewable', 'carbon', 'footprint', 'recycle', 'waste', 'energy', 'conservation'];
      if (sustainabilityKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
        setSustainabilityScore(prev => Math.min(prev + 10, 100));
      }
      
      // Analyze message for topic understanding
      updateMessageContext(messageId, userMessage);
      
      // Construct prompt based on current persona
      let prompt = userMessage;
      const persona = currentPersona;
      
      if (persona.prompt) {
        prompt = `${persona.prompt}\n\nUser query: ${userMessage}`;
      }
      
      if (sustainabilityMode) {
        prompt = `Consider environmental sustainability in your response. ${prompt}`;
      }
      
      // Generate response with the appropriate model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });
      
      // Handle image input if present
      let result;
      if (newUserMessage.image) {
        const imageData = await readFileAsBase64(newUserMessage.image);
        const imageParts = [
          {
            inlineData: {
              data: imageData.split(',')[1],
              mimeType: newUserMessage.image.type
            }
          }
        ];
        
        result = await model.generateContent([prompt, ...imageParts]);
      } else {
        result = await model.generateContent(prompt);
      }
      
      const response = await result.response;
      const text = response.text();
      
      // Calculate response time
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Update analytics
      setChatAnalytics(prev => ({
        ...prev,
        responseTime: [...prev.responseTime, responseTime]
      }));
      
      // Create bot message
      const botMessageId = Date.now();
      const botMessage = { 
        id: botMessageId,
        role: 'bot', 
        content: text,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        persona: currentPersona.id
      };
      
      // Apply typing effect if enabled
      if (typingEffect) {
        setCurrentTypingMessageId(botMessageId);
        setTypingMessage("");
        let displayedText = "";
        
        // First add an empty message
        setMessages(prev => [...prev, botMessage]);
        
        // Then update it character by character
        for (let i = 0; i < text.length; i++) {
          await new Promise(resolve => setTimeout(resolve, typingSpeed));
          displayedText += text[i];
          setTypingMessage(displayedText);
        }
        
        setCurrentTypingMessageId(null);
      } else {
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now(),
        role: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      }]);
    }

    setIsLoading(false);
  };
  
  // Helper function to convert file to base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  // Update message analytics context
  const updateMessageContext = (messageId, text) => {
    // Simple topic extraction based on keywords
    const topics = {
      technology: ['computer', 'software', 'hardware', 'code', 'programming', 'tech', 'ai', 'app'],
      business: ['business', 'company', 'startup', 'market', 'finance', 'economy', 'job'],
      health: ['health', 'medical', 'doctor', 'exercise', 'diet', 'fitness', 'wellness'],
      science: ['science', 'research', 'study', 'experiment', 'physics', 'chemistry', 'biology'],
      education: ['learn', 'study', 'school', 'university', 'college', 'education', 'student', 'teach'],
      environment: ['climate', 'environment', 'sustainability', 'renewable', 'recycle', 'green']
    };
    
    const detectedTopics = {};
    const textLower = text.toLowerCase();
    
    Object.entries(topics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        detectedTopics[topic] = true;
        
        // Update global analytics
        setChatAnalytics(prev => {
          const updatedTopicFreq = {...prev.topicFrequency};
          updatedTopicFreq[topic] = (updatedTopicFreq[topic] || 0) + 1;
          return {
            ...prev,
            topicFrequency: updatedTopicFreq
          };
        });
      }
    });
    
    // Estimate sentiment (very basic)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'happy', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'disappointed', 'problem', 'issue'];
    
    let sentiment = 0;
    positiveWords.forEach(word => {
      if (textLower.includes(word)) sentiment += 1;
    });
    negativeWords.forEach(word => {
      if (textLower.includes(word)) sentiment -= 1;
    });
    
    // Update global sentiment tracking
    setChatAnalytics(prev => ({
      ...prev,
      userSentiment: [...prev.userSentiment, {time: Date.now(), value: sentiment}]
    }));
    
    // Store context for this message
    setMessageContexts(prev => ({
      ...prev,
      [messageId]: {
        topics: Object.keys(detectedTopics),
        sentiment,
        wordCount: text.split(/\s+/).length
      }
    }));
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript.trim());
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const toggleSustainabilityMode = () => {
    setSustainabilityMode(!sustainabilityMode);
    if (!sustainabilityMode) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sustainability mode activated! I will prioritize environmental considerations in my responses.' 
      }]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sustainability mode deactivated. Standard responses resumed.' 
      }]);
    }
  };
  
  const useSustainabilityPrompt = (prompt) => {
    setInput(prompt);
  };
  
  const loadChatHistory = (historyItem) => {
    setMessages(historyItem.messages);
  };
  
  const clearChat = () => {
    setMessages([{ 
      role: 'bot', 
      content: 'Chat cleared! How can I help you today?' 
    }]);
  };

  const formatText = (text) => {
    const segments = [];
    const codeBlockRegex = /```([\w]*)\n([\s\S]*?)\n```/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
  
      segments.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return segments;
  };
  
  const formatTextContent = (content) => {
    if (!content) return null;
   
    const withBulletPoints = content.replace(/^\s*\*\s+(.*?)$/gm, '<li>$1</li>');
    
    const withBold = withBulletPoints.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const withHeaders = withBold.replace(/\*\*\*(.*?)\*\*\*/g, '<h3 class="text-lg font-bold my-2">$1</h3>');
    
    let withParagraphs = withHeaders;
    
    withParagraphs = withParagraphs.replace(/<li>(.*?)<\/li>/g, (match) => {
      return `<ul class="list-disc ml-5 my-2">${match}</ul>`;
    });
    
    withParagraphs = withParagraphs.replace(/<\/ul>\s*<ul class="list-disc ml-5 my-2">/g, '');
   
    const paragraphs = withParagraphs.split('\n\n');
    withParagraphs = paragraphs.map(p => {
      if (!p.includes('<h3') && !p.includes('<ul') && p.trim() !== '') {
        return `<p class="my-2">${p}</p>`;
      }
      return p;
    }).join('\n');
    
    return <div dangerouslySetInnerHTML={{ __html: withParagraphs }} />;
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
  
    const textOnlyContent = text.replace(/```[\s\S]*?```/g, 'Code block omitted for speech');
    
    const utterance = new SpeechSynthesisUtterance(textOnlyContent);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const downloadChat = () => {
    if (messages.length === 0) return;
    
    // Format the chat for download
    let chatContent = "# SustainLab Learning Chat\n\n";
    
    messages.forEach((message) => {
      const role = message.role === 'user' ? 'You' : 'SustainLab Learning';
      chatContent += `## ${role}:\n${message.content}\n\n`;
    });
    
    // Create a downloadable file
    const blob = new Blob([chatContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Generate a filename with current date and time
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    a.href = url;
    a.download = `sustainlab-chat-${formattedDate}.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Get sustainability icon based on score
  const getSustainabilityIcon = () => {
    if (sustainabilityScore < 20) return <Leaf className="h-6 w-6 text-gray-400" />;
    if (sustainabilityScore < 40) return <Leaf className="h-6 w-6 text-green-300" />;
    if (sustainabilityScore < 60) return <Leaf className="h-6 w-6 text-green-500" />;
    if (sustainabilityScore < 80) return <Leaf className="h-6 w-6 text-green-600" />;
    return <Leaf className="h-6 w-6 text-green-700" />;
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageInput(file);
      setShowImagePreview(true);
    }
  };
  
  // Remove uploaded image
  const removeImage = () => {
    setImageInput(null);
    setShowImagePreview(false);
    if (imageUploadRef.current) {
      imageUploadRef.current.value = '';
    }
  };
  
  // Change AI persona
  const changePersona = (persona) => {
    setCurrentPersona(persona);
    setShowPersonaDrawer(false);
    
    if (persona.id === 'eco' && !sustainabilityMode) {
      setSustainabilityMode(true);
    } else if (persona.id !== 'eco' && sustainabilityMode && currentPersona.id === 'eco') {
      setSustainabilityMode(false);
    }
    
    // Notify the user about persona change
    setMessages(prev => [...prev, { 
      id: Date.now(),
      role: 'system', 
      content: `Switched to ${persona.name} mode. ${persona.description}`,
      timestamp: new Date().toISOString(),
      isNotification: true
    }]);
  };
  
  // Save current prompt
  const savePrompt = () => {
    if (!input.trim()) return;
    
    const newPrompt = {
      id: Date.now(),
      text: input.trim(),
      date: new Date().toISOString()
    };
    
    const updatedPrompts = [newPrompt, ...savedPrompts];
    setSavedPrompts(updatedPrompts);
    localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
    
    // Show notification
    setMessages(prev => [...prev, { 
      id: Date.now(),
      role: 'system', 
      content: `Prompt saved to your collection.`,
      timestamp: new Date().toISOString(),
      isNotification: true
    }]);
  };
  
  // Load saved prompt
  const loadPrompt = (promptText) => {
    setInput(promptText);
  };
  
  // Delete saved prompt
  const deletePrompt = (promptId) => {
    const updatedPrompts = savedPrompts.filter(p => p.id !== promptId);
    setSavedPrompts(updatedPrompts);
    localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
  };
  
  // Export chat data
  const exportChatData = (format = 'json') => {
    if (messages.length <= 1) return; // Don't export empty chats
    
    let content;
    let fileType;
    let fileName;
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (format === 'json') {
      content = JSON.stringify({
        messages: messages,
        analytics: chatAnalytics,
        exportDate: new Date().toISOString()
      }, null, 2);
      fileType = 'application/json';
      fileName = `sustainlab-chat-${dateStr}.json`;
    } else {
      // Markdown format (default)
      let markdownContent = "# SustainLab Learning Chat Export\n\n";
      markdownContent += `**Date:** ${new Date().toLocaleString()}\n\n`;
      
      messages.forEach((message) => {
        if (message.isNotification) return;
        
        const role = message.role === 'user' ? 'You' : 
                    message.role === 'bot' ? 'SustainLab Learning' : 'System';
        
        markdownContent += `## ${role}:\n${message.content}\n\n`;
        
        if (message.image) {
          markdownContent += `[Image attached]\n\n`;
        }
      });
      
      content = markdownContent;
      fileType = 'text/markdown';
      fileName = `sustainlab-chat-${dateStr}.md`;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  // Share chat conversation
  const shareChat = async () => {
    if (messages.length <= 1) return;
    
    try {
      if (navigator.share) {
        // Format chat for sharing
        let text = "Chat with SustainLab Learning\n\n";
        
        messages.slice(0, 5).forEach((message) => {
          if (!message.isNotification) {
            const role = message.role === 'user' ? 'Me' : 'SustainLab Learning';
            text += `${role}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}\n\n`;
          }
        });
        
        if (messages.length > 5) {
          text += `[... and ${messages.length - 5} more messages]`;
        }
        
        await navigator.share({
          title: 'My SustainLab Learning Conversation',
          text: text
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(
          messages.reduce((text, msg) => {
            if (!msg.isNotification) {
              const role = msg.role === 'user' ? 'Me' : 'SustainLab Learning';
              return text + `${role}: ${msg.content}\n\n`;
            }
            return text;
          }, "Chat with SustainLab Learning\n\n")
        );
        
        setMessages(prev => [...prev, { 
          id: Date.now(),
          role: 'system', 
          content: 'Chat copied to clipboard!',
          timestamp: new Date().toISOString(),
          isNotification: true
        }]);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    if (!isFullscreen) {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } catch (error) {
        console.error('Exit fullscreen error:', error);
      }
    }
  };

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white transition-colors duration-300`}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'} ${isFullscreen ? 'h-full flex flex-col' : ''}`}
      >
        {/* Header */}
        <div className={`p-4 ${currentPersona.id === 'eco' || sustainabilityMode ? 'bg-green-600' : `bg-${currentPersona.color}-600`} text-white flex items-center justify-between transition-colors duration-300`}>
          <div className="flex items-center">
            <div className="p-1.5 bg-white bg-opacity-20 rounded-lg mr-3">
              {currentPersona.icon || <Bot className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                SustainLab Learning
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-2 text-xs font-normal px-2 py-0.5 bg-white bg-opacity-25 rounded-full"
                >
                  {currentPersona.name}
                </motion.span>
              </h2>
              <p className="text-xs opacity-80">Using Gemini 2.0 model</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowPersonaDrawer(!showPersonaDrawer)}
              className="text-white hover:text-indigo-200 focus:outline-none relative"
              title="Change AI Persona"
            >
              <User className="h-5 w-5" />
              {showPersonaDrawer && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-10 overflow-hidden">
                  <div className="p-2 bg-gray-100 text-gray-700 font-medium text-sm">
                    Select AI Persona
                  </div>
                  {aiPersonas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => changePersona(persona)}
                      className={`w-full p-3 text-left flex items-center hover:bg-gray-100 ${
                        currentPersona.id === persona.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg bg-${persona.color}-100 text-${persona.color}-600 mr-3`}>
                        {persona.icon}
                      </div>
                      <div className="text-gray-800">
                        <div className="font-medium">{persona.name}</div>
                        <div className="text-xs text-gray-500">{persona.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={toggleTheme}
              className="text-white hover:text-indigo-200 focus:outline-none"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'dark' ? 
                <Moon className="h-5 w-5 text-yellow-300" /> : 
                <Sun className="h-5 w-5" />
              }
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={toggleSustainabilityMode}
              className={`text-white focus:outline-none ${sustainabilityMode ? 'text-green-200' : 'hover:text-indigo-200'}`}
              title={sustainabilityMode ? 'Disable Sustainability Mode' : 'Enable Sustainability Mode'}
            >
              <Leaf className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-indigo-200 focus:outline-none"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={downloadChat}
              disabled={messages.length === 0}
              className="text-white hover:text-indigo-200 focus:outline-none disabled:opacity-50"
              title="Download Chat"
            >
              <Download className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={shareChat}
              disabled={messages.length <= 1}
              className="text-white hover:text-indigo-200 focus:outline-none disabled:opacity-50"
              title="Share Chat"
            >
              <Share className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={clearChat}
              className="text-white hover:text-indigo-200 focus:outline-none"
              title="Clear Chat"
            >
              <RotateCcw className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
        
        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-b overflow-hidden backdrop-blur-sm ${theme === 'dark' ? 'bg-gray-800/70 border-gray-700/50' : 'bg-gray-800/40 border-gray-600/50 text-white'}`}
            >
              <div className="p-4">
                <h3 className="font-medium mb-3">Chat Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Response Temperature</label>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">Precise</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs ml-2">Creative</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{temperature}</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={typingEffect}
                        onChange={() => setTypingEffect(!typingEffect)}
                        className="mr-2"
                      />
                      Enable typing animation
                    </label>
                    {typingEffect && (
                      <div className="flex items-center mt-2">
                        <span className="text-xs mr-2">Fast</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={typingSpeed}
                          onChange={(e) => setTypingSpeed(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs ml-2">Slow</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1 text-sm rounded bg-blue-700/60 hover:bg-blue-600/60 text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Daily tip banner */}
        {dailyTip && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`px-4 py-2 backdrop-blur-sm ${sustainabilityMode ? 'bg-green-800/40 text-green-100' : 'bg-indigo-800/40 text-indigo-100'} flex items-center text-sm transition-colors duration-300`}
          >
            <Leaf className="h-4 w-4 mr-2 flex-shrink-0" />
            <p className="leading-tight"><span className="font-semibold">Eco Tip:</span> {dailyTip}</p>
          </motion.div>
        )}
        
        {/* Sustainability score */}
        {sustainabilityMode && (
          <div className="px-4 py-2 bg-green-900/30 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center">
              {getSustainabilityIcon()}
              <div className="ml-2">
                <p className="text-xs text-green-700">Sustainability Score</p>
                <div className="h-2 w-36 bg-gray-200 rounded-full mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${sustainabilityScore}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-green-500 rounded-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="flex flex-col items-center text-xs text-green-700">
                <Sun className="h-4 w-4" />
                <span>Energy</span>
              </div>
              <div className="flex flex-col items-center text-xs text-green-700">
                <Droplets className="h-4 w-4" />
                <span>Water</span>
              </div>
              <div className="flex flex-col items-center text-xs text-green-700">
                <Wind className="h-4 w-4" />
                <span>Air</span>
              </div>
              <div className="flex flex-col items-center text-xs text-green-700">
                <Zap className="h-4 w-4" />
                <span>Power</span>
              </div>
            </div>
          </div>
        )}

        {/* Chat history sidebar toggle */}
        {chatHistory.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-700/50 backdrop-blur-sm bg-gray-800/50 flex justify-between items-center">
            <p className="text-sm font-medium text-white">Chat History</p>
            <div className="flex space-x-2">
              {chatHistory.slice(0, 3).map((history, idx) => (
                <button 
                  key={history.id}
                  onClick={() => loadChatHistory(history)}
                  className="text-xs px-2 py-1 rounded bg-gray-700/80 hover:bg-gray-600 text-white"
                >
                  {new Date(history.date).toLocaleDateString()} Chat {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat container */}
        <div 
          ref={chatContainerRef}
          className={`h-[500px] overflow-y-auto p-4 space-y-4 backdrop-blur-sm ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} ${isFullscreen ? 'flex-1' : ''}`}
        >
          <AnimatePresence>
            {messages.map((message, messageIndex) => {
              const formattedSegments = formatText(message.content);
              const displayContent = currentTypingMessageId === message.id ? typingMessage : message.content;
              
              // Skip rendering if this is a notification and we should show it differently
              if (message.isNotification) {
                return (
                  <motion.div
                    key={`notification-${message.id || messageIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-center"
                  >
                    <div className={`px-3 py-1.5 text-xs rounded-full bg-blue-900/40 backdrop-blur-sm text-blue-100 border border-blue-700/30`}>
                      {message.content}
                    </div>
                  </motion.div>
                );
              }
              
              return (
                <motion.div
                  key={`message-${message.id || messageIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? currentPersona.id === 'eco' || sustainabilityMode 
                          ? 'bg-green-600/90 text-white' 
                          : `bg-${currentPersona.color}-600/90 text-white`
                        : theme === 'dark'
                          ? 'bg-gray-700/80 text-white'
                          : 'bg-white/80 text-gray-800'
                    } backdrop-blur-sm shadow-lg transition-colors duration-300`}
                  >
                    {/* Message header with timestamp */}
                    {message.timestamp && (
                      <div className={`flex justify-between items-center mb-1 text-xs ${message.role === 'user' ? 'text-white text-opacity-80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        <span>{message.role === 'user' ? 'You' : 
                              message.persona ? aiPersonas.find(p => p.id === message.persona)?.name || 'AI' : 'AI'}</span>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    )}
                    
                    {/* Display image if present */}
                    {message.image && (
                      <div className="mb-2">
                        <img 
                          src={URL.createObjectURL(message.image)} 
                          alt="Uploaded" 
                          className="max-h-32 rounded border"
                        />
                      </div>
                    )}
                    
                    {/* Message content */}
                    {currentTypingMessageId === message.id ? (
                      // Typing effect rendering
                      <div>
                        {formatTextContent(typingMessage)}
                        <span className="inline-block h-4 w-2 ml-1 bg-current opacity-75 animate-pulse"></span>
                      </div>
                    ) : (
                      // Normal content rendering 
                      formattedSegments.map((segment, segmentIndex) => {
                        if (segment.type === 'text') {
                          return (
                            <div key={segmentIndex} className="mb-2 last:mb-0">
                              {formatTextContent(segment.content)}
                            </div>
                          );
                        } else if (segment.type === 'code') {
                          return (
                            <div key={segmentIndex} className="mb-3 last:mb-0 relative group">
                              <div className="bg-gray-900/80 backdrop-blur-sm rounded text-xs p-1 text-gray-300 font-mono flex justify-between items-center border border-gray-700/50">
                                <span className="text-blue-300">{segment.language}</span>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => copyToClipboard(segment.content, `${messageIndex}-${segmentIndex}`)}
                                    className="text-gray-400 hover:text-white p-1 rounded"
                                  >
                                    {copiedIndex === `${messageIndex}-${segmentIndex}` ? (
                                      <Check className="h-4 w-4 text-green-400" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <pre className="bg-gray-950/80 backdrop-blur-sm p-3 rounded overflow-x-auto text-gray-300 text-sm mt-1 border border-gray-800/50">
                                <code>{segment.content}</code>
                              </pre>
                            </div>
                          );
                        }
                        return null;
                      })
                    )}
                    
                    {/* Message actions */}
                    {message.role === 'bot' && !currentTypingMessageId && (
                      <div className="flex justify-end mt-1 space-x-2">
                        <button
                          onClick={() => speakText(message.content)}
                          className={`text-gray-400 hover:text-gray-600 p-1 rounded transition-colors ${isSpeaking ? 'bg-gray-200 text-gray-700' : ''}`}
                        >
                          {isSpeaking ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(message.content, messageIndex)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                        >
                          {copiedIndex === messageIndex ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => savePrompt(message.content)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                          title="Save response"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className={`rounded-lg p-4 backdrop-blur-sm ${theme === 'dark' ? 'bg-gray-700/80' : 'bg-white/80'} shadow-lg`}>
                  <div className="flex space-x-2 items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sustainability prompts */}
        {sustainabilityMode && (
          <div className="p-3 border-t border-green-700/30 bg-green-900/30 backdrop-blur-sm overflow-x-auto">
            <p className="text-xs text-green-200 mb-2 font-medium">Sustainability Topics:</p>
            <div className="flex space-x-2">
              {sustainabilityPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => useSustainabilityPrompt(prompt)}
                  className="text-xs px-3 py-1 rounded bg-green-700/80 text-green-100 whitespace-nowrap hover:bg-green-600 transition-colors duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800/90 border-gray-700/50' : 'bg-white/90 border-gray-200/50'} backdrop-blur-sm`}>
          {/* Image preview */}
          {showImagePreview && imageInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 relative"
            >
              <div className="relative inline-block">
                <img 
                  src={URL.createObjectURL(imageInput)} 
                  alt="Upload preview" 
                  className="h-32 rounded border object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Message input area */}
          <div className="flex flex-col">
            <div className={`flex items-center rounded-lg border backdrop-blur-sm ${theme === 'dark' ? 'border-gray-600/50 bg-gray-800/70' : 'border-gray-400/30 bg-gray-800/40'} overflow-hidden`}>
              <button
                onClick={toggleListening}
                className={`p-2 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5 text-red-500" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={isListening ? "Listening..." : `Ask ${currentPersona.name.toLowerCase()} about sustainable learning...`}
                className={`flex-1 p-2 outline-none text-white placeholder-gray-300 ${theme === 'dark' ? 'bg-gray-800/70' : 'bg-transparent'}`}
                disabled={isListening}
              />
              
              {/* Image upload button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => imageUploadRef.current?.click()}
                className={`p-2 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                title="Upload image"
              >
                <ImageIcon className="h-5 w-5" />
                <input
                  type="file"
                  ref={imageUploadRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </motion.button>
              
              {/* Save prompt button */}
              {input.trim().length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={savePrompt}
                  className={`p-2 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Save prompt"
                >
                  <Save className="h-5 w-5" />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={(!input.trim() && !imageInput) || isLoading}
                className={`p-2 ${
                  currentPersona.id === 'eco' || sustainabilityMode 
                    ? 'text-green-500 hover:text-green-600' 
                    : `text-${currentPersona.color}-500 hover:text-${currentPersona.color}-600`
                } disabled:opacity-50`}
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
            
            {/* Quick actions */}
            <div className="flex justify-between mt-2 text-xs">
              <div className="flex space-x-2">
                {savedPrompts.length > 0 && (
                  <div className="relative group">
                    <button
                      className="px-2 py-1 rounded flex items-center bg-gray-700/60 hover:bg-gray-600/60 text-white"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Saved Prompts
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                    <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-gray-800/90 backdrop-blur-sm rounded shadow-lg z-10 w-64">
                      <div className="p-1 max-h-40 overflow-y-auto">
                        {savedPrompts.map(prompt => (
                          <div key={prompt.id} className="p-2 hover:bg-gray-100 flex justify-between items-center">
                            <button
                              onClick={() => loadPrompt(prompt.text)}
                              className="text-left flex-1 truncate"
                              title={prompt.text}
                            >
                              {prompt.text.length > 30 ? prompt.text.substring(0, 30) + '...' : prompt.text}
                            </button>
                            <button
                              onClick={() => deletePrompt(prompt.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-300">
                {typingEffect && currentTypingMessageId && (
                  <span className="italic">SustainLab is thinking...</span>
                )}
              </div>
            </div>
          </div>
          
          {isListening && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-center"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-900/50 backdrop-blur-sm text-red-100 text-xs">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                Listening to your voice...
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Chatbot;