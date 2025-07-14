import React, { useState, useEffect } from 'react';

// TypeScript interfaces
interface RoadmapTask {
  text: string;
  bold: boolean;
}

interface RoadmapProps {
  className?: string;
}

const GEMINI_API_KEY = "AIzaSyDm2ODVscz6kNEsHPo4yWlyyRMiGXWFLQA";

const LearningRoadmap: React.FC<RoadmapProps> = ({ className = "" }) => {
  const [topic, setTopic] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [priorKnowledge, setPriorKnowledge] = useState<string>('beginner');
  const [depth, setDepth] = useState<string>('overview');
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateRoadmap = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const prompt = `
        Create a personalized learning roadmap with the following parameters:
        
        Topic: ${topic}
        Time Limit: ${timeLimit}
        Prior Knowledge Level: ${priorKnowledge}
        Desired Depth: ${depth}
        
        Please format your response as follows:
        
        # LEARNING ROADMAP: ${topic.toUpperCase()}
        
        ## TECHNOLOGIES AND TOPICS
        (List all technologies and topics to learn with estimated time allocation for each)
        
        ## STEP-BY-STEP GUIDE
        (Provide a detailed timeline and sequence of learning activities to complete within the ${timeLimit} timeframe)
        
        ## ADDITIONAL RESOURCES AND RECOMMENDATIONS
        (Include any relevant information, tips, or resources that would be helpful)
      `;
      
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Error generating roadmap');
      }
      
      const roadmapText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!roadmapText) {
        throw new Error('No roadmap was generated');
      }
      
      setRoadmap(roadmapText);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (): void => {
    if (step === 4) {
      generateRoadmap();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = (): void => {
    setStep(step - 1);
  };

  const isStepComplete = (): boolean => {
    switch (step) {
      case 1:
        return topic.trim() !== '';
      case 2:
        return timeLimit.trim() !== '';
      case 3:
        return true; 
      case 4:
        return true; 
      default:
        return false;
    }
  };

  
  const processMarkdownLine = (line: string, index: number): JSX.Element => {
  
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-xl md:text-3xl font-extrabold mt-6 md:mt-8 mb-4 md:mb-6 text-purple-800">{line.substring(2)}</h1>;
    } else if (line.startsWith('## ')) {
      return <h2 key={index} className="text-lg md:text-2xl font-bold mt-4 md:mt-6 mb-3 md:mb-4 text-indigo-700 border-b pb-2">{line.substring(3)}</h2>;
    } else if (line.startsWith('### ')) {
      return <h3 key={index} className="text-base md:text-xl font-bold mt-3 md:mt-5 mb-2 md:mb-3 text-blue-600">{line.substring(4)}</h3>;
    } else if (line.trim() === '') {
      return <br key={index} />;
    } else if (line.trim().startsWith('* ')) {
    
      const content = line.trim().substring(2);
      return (
        <div key={index} className="flex mb-2">
          <div className="mr-2 text-indigo-600">•</div>
          <div className="text-xs md:text-sm text-gray-700">{processInlineFormatting(content)}</div>
        </div>
      );
    } else {
     
      return <p key={index} className="mb-2 md:mb-3 text-xs md:text-sm text-gray-700">{processInlineFormatting(line)}</p>;
    }
  };

  const processInlineFormatting = (text: string): string | JSX.Element[] => {
  
    const parts: RoadmapTask[] = [];
    let currentIndex = 0;
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;

   
    while ((match = boldRegex.exec(text)) !== null) {
      
      if (match.index > currentIndex) {
        parts.push({
          text: text.substring(currentIndex, match.index),
          bold: false
        });
      }
      
      
      parts.push({
        text: match[1],
        bold: true
      });
      
      currentIndex = match.index + match[0].length;
    }
  
    if (currentIndex < text.length) {
      parts.push({
        text: text.substring(currentIndex),
        bold: false
      });
    }
  
    if (parts.length === 0) {
      return text;
    }
  
    return parts.map((part, i) => 
      part.bold ? 
        <span key={i} className="font-bold text-indigo-800">{part.text}</span> : 
        <span key={i}>{part.text}</span>
    );
  };

  const renderStep = (): JSX.Element | null => {
    switch (step) {
      case 1:
        return (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 md:p-8 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-purple-800">Step 1: Choose Your Topic</h2>
            <div className="mb-4 md:mb-6">
              <label className="block text-base md:text-lg font-medium mb-2 text-purple-900">
                What topic do you want to learn?
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-2 md:mt-3 block w-full rounded-lg border-purple-300 shadow-sm p-2 md:p-3 border focus:border-purple-500 focus:ring focus:ring-purple-200"
                  placeholder="e.g., React, Machine Learning, Web Development"
                />
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-gradient-to-r from-blue-100 to-green-100 p-4 md:p-8 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-blue-800">Step 2: Set Your Timeline</h2>
            <div className="mb-4 md:mb-6">
              <label className="block text-base md:text-lg font-medium mb-2 text-blue-900">
                What is your time limit?
                <input
                  type="text"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="mt-2 md:mt-3 block w-full rounded-lg border-blue-300 shadow-sm p-2 md:p-3 border focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="e.g., 2 weeks, 3 months, 1 year"
                />
              </label>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-gradient-to-r from-green-100 to-yellow-100 p-4 md:p-8 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-green-800">Step 3: Your Experience Level</h2>
            <div className="mb-4 md:mb-6">
              <label className="block text-base md:text-lg font-medium mb-2 text-green-900">
                How much prior knowledge do you have?
                <select
                  value={priorKnowledge}
                  onChange={(e) => setPriorKnowledge(e.target.value)}
                  className="mt-2 md:mt-3 block w-full rounded-lg border-green-300 shadow-sm p-2 md:p-3 border focus:border-green-500 focus:ring focus:ring-green-200"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="bg-gradient-to-r from-yellow-100 to-red-100 p-4 md:p-8 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-yellow-800">Step 4: Learning Depth</h2>
            <div className="mb-4 md:mb-6">
              <label className="block text-base md:text-lg font-medium mb-2 text-yellow-900">
                How much depth do you want to cover?
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="mt-2 md:mt-3 block w-full rounded-lg border-yellow-300 shadow-sm p-2 md:p-3 border focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                >
                  <option value="overview">Overview - Just the basics</option>
                  <option value="intermediate">Intermediate - Practical applications</option>
                  <option value="comprehensive">Comprehensive - Deep dive</option>
                  <option value="expert">Expert - Mastery level</option>
                </select>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-2 md:p-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-4 text-center text-indigo-800">
          Custom Learning Roadmap Generator
        </h1>
        <p className="text-center text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
          Create a personalized learning plan tailored to your needs and goals
        </p>
        
        {/* Progress indicator */}
        {!roadmap && (
          <div className="flex justify-between items-center mb-4 md:mb-6 relative">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div
                  className={`relative z-10 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-medium ${
                    stepNumber <= step
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`flex-grow h-0.5 ${
                      stepNumber < step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 md:mb-6 text-xs md:text-sm">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Step content */}
        {!roadmap ? (
          <>
            {renderStep()}
            
            <div className="flex justify-between mt-4 md:mt-6">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium ${
                  step === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
                }`}
              >
                Previous
              </button>
              
              <button
                onClick={nextStep}
                disabled={!isStepComplete() || loading}
                className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium ${
                  isStepComplete() && !loading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
                    : 'bg-indigo-300 text-white cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </div>
                ) : step === 4 ? 'Generate Roadmap' : 'Next'}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 md:mt-6">
            <div className="bg-white p-3 md:p-6 rounded-lg shadow-md">
              {roadmap.split('\n').map((line, index) => processMarkdownLine(line, index))}
            </div>
            
            <div className="flex justify-center mt-4 md:mt-6">
              <button
                onClick={() => {
                  setRoadmap(null);
                  setStep(1);
                }}
                className="px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Create Another Roadmap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningRoadmap; 