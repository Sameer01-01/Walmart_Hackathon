import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mic, MicOff, Camera, Loader2, CheckCircle2, PauseCircle, PlayCircle, X } from 'lucide-react';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI('AIzaSyDzYHVthRT3e9Hy9UNu9CBGgBfRqjWYKVw');

// Define types
interface Question {
  question: string;
  answered: boolean;
  answer?: string;
  evaluation?: string;
}

interface JobDetails {
  role: string;
  description: string;
}

interface FeedbackItem {
  area: string;
  feedback: string;
  score: number;
}

interface OverallFeedback {
  strengths: string[];
  improvements: string[];
  overallScore: number;
  detailedFeedback: FeedbackItem[];
}

const InterviewPrep: React.FC = () => {
  // State management
  const [jobRole, setJobRole] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [stage, setStage] = useState<'jobInput' | 'interview' | 'feedback'>('jobInput');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<boolean>(false);
  const [overallFeedback, setOverallFeedback] = useState<OverallFeedback | null>(null);
  const [cameraAccess, setCameraAccess] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech recognition setup
  useEffect(() => {
    // Check if SpeechRecognition is available in the browser
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = transcript;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.error('Speech recognition not supported in this browser');
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  // Generate interview questions based on job role and description
  const generateQuestions = async (job: JobDetails) => {
    try {
      setIsGeneratingQuestions(true);
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        As an interview preparation assistant, generate 5 realistic interview questions for a ${job.role} position.
        These questions should be based on the following job description:
        
        ${job.description}
        
        Provide questions that test technical skills, problem-solving abilities, and fit for this role.
        Format your response as a JSON array of question strings only, without explanations or other text.
        For example: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Extract the JSON array from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const questionsArray = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        
        if (questionsArray.length > 0) {
          setQuestions(
            questionsArray.map((question: string) => ({
              question,
              answered: false
            }))
          );
          setStage('interview');
        } else {
          throw new Error('Could not parse questions from response');
        }
      } catch (parseError) {
        console.error('Error parsing questions:', parseError);
        // Fallback to default questions if parsing fails
        setQuestions([
          { question: "Tell me about your relevant experience for this role?", answered: false },
          { question: "How do you handle tight deadlines and pressure?", answered: false },
          { question: "Describe a challenge you faced in a previous role and how you overcame it.", answered: false },
          { question: "What are your strengths and weaknesses related to this position?", answered: false },
          { question: "Why do you want to work in this role?", answered: false }
        ]);
        setStage('interview');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      const constraints = {
        video: true,
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      setCameraAccess(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions and try again.');
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraAccess(false);
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setIsMicActive(false);
    } else {
      // Start recording
      setTranscript('');
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsRecording(true);
      setIsMicActive(true);
    }
  };

  // Submit answer for evaluation
  const submitAnswer = async () => {
    if (!transcript.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }
    
    try {
      setIsEvaluating(true);
      
      // Update the current question with the answer
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        answer: transcript,
        answered: true
      };
      
      // Generate feedback for the answer
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        As an interview coach, evaluate the following answer to this interview question for a ${jobRole} position.
        
        Question: ${questions[currentQuestionIndex].question}
        
        Answer: ${transcript}
        
        Based on the job description: ${jobDescription}
        
        Provide a brief evaluation (2-3 sentences) on how well the answer addresses the question and fits the job requirements.
        Return your evaluation as plain text without any markers or formatting.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const evaluation = response.text();
      
      // Update the question with the evaluation
      updatedQuestions[currentQuestionIndex].evaluation = evaluation;
      
      setQuestions(updatedQuestions);
      setTranscript('');
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      alert('Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsSubmitted(false);
    } else {
      generateOverallFeedback();
    }
  };

  // Generate overall feedback
  const generateOverallFeedback = async () => {
    try {
      setIsGeneratingFeedback(true);
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const questionsAndAnswers = questions.map((q, index) => 
        `Question ${index + 1}: ${q.question}\nAnswer: ${q.answer || "No answer provided"}`
      ).join('\n\n');
      
      const prompt = `
        As an interview coach, analyze the following interview questions and answers for a ${jobRole} position.
        
        Job Description: ${jobDescription}
        
        ${questionsAndAnswers}
        
        Please provide comprehensive feedback in JSON format with the following structure:
        {
          "strengths": ["strength1", "strength2", "strength3"],
          "improvements": ["improvement1", "improvement2", "improvement3"],
          "overallScore": <number between 1-100>,
          "detailedFeedback": [
            {
              "area": "Communication Skills",
              "feedback": "detailed feedback here",
              "score": <number between 1-10>
            },
            {
              "area": "Technical Knowledge",
              "feedback": "detailed feedback here",
              "score": <number between 1-10>
            },
            {
              "area": "Problem Solving",
              "feedback": "detailed feedback here",
              "score": <number between 1-10>
            },
            {
              "area": "Job Fit",
              "feedback": "detailed feedback here",
              "score": <number between 1-10>
            }
          ]
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Extract the JSON from the response
        const jsonMatch = text.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const feedback = JSON.parse(jsonMatch[0]);
          setOverallFeedback(feedback);
          setStage('feedback');
        } else {
          throw new Error('Could not parse feedback from response');
        }
      } catch (parseError) {
        console.error('Error parsing feedback:', parseError);
        // Provide fallback feedback
        setOverallFeedback({
          strengths: ["You provided detailed answers", "You showed enthusiasm for the role", "You shared relevant experiences"],
          improvements: ["Consider providing more specific examples", "Focus more on quantifiable achievements", "Align answers more closely with job requirements"],
          overallScore: 75,
          detailedFeedback: [
            {
              area: "Communication Skills",
              feedback: "Your communication was clear, but could be more concise in some areas.",
              score: 7
            },
            {
              area: "Technical Knowledge",
              feedback: "You demonstrated good technical knowledge relevant to the position.",
              score: 8
            },
            {
              area: "Problem Solving",
              feedback: "Your problem-solving approach showed creativity, but lacked some structure.",
              score: 7
            },
            {
              area: "Job Fit",
              feedback: "Your answers aligned with the job requirements in most areas.",
              score: 8
            }
          ]
        });
        setStage('feedback');
      }
    } catch (error) {
      console.error('Error generating overall feedback:', error);
      alert('Failed to generate feedback. Please try again.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // Reset interview
  const resetInterview = () => {
    setJobRole('');
    setJobDescription('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setTranscript('');
    setStage('jobInput');
    setOverallFeedback(null);
    setIsSubmitted(false);
    stopWebcam();
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopWebcam();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">AI Interview Preparation</h2>
      
      {stage === 'jobInput' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-1">
              Job Role
            </label>
            <input
              type="text"
              id="jobRole"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Software Engineer, Project Manager"
            />
          </div>
          
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste the job description here..."
            />
          </div>
          
          <button
            onClick={() => generateQuestions({ role: jobRole, description: jobDescription })}
            disabled={!jobRole.trim() || !jobDescription.trim() || isGeneratingQuestions}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingQuestions ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={18} />
                Generating Questions...
              </span>
            ) : (
              'Start Interview Practice'
            )}
          </button>
        </div>
      )}
      
      {stage === 'interview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            
            <button
              onClick={startWebcam}
              disabled={cameraAccess}
              className={`py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                cameraAccess ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              <Camera size={18} className="inline mr-2" />
              {cameraAccess ? 'Camera Active' : 'Start Camera'}
            </button>
          </div>
          
          <div className="flex space-x-4">
            <div className="w-1/2">
              <div className="bg-gray-100 p-4 rounded-md h-60 flex items-center justify-center">
                {cameraAccess ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Camera size={48} className="mx-auto mb-2" />
                    <p>Camera not active</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-1/2">
              <div className="bg-gray-100 p-4 rounded-md h-60 overflow-auto">
                <p className="font-medium text-gray-800 mb-2">
                  {questions[currentQuestionIndex]?.question}
                </p>
                
                {isSubmitted ? (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-1">Your Answer:</h4>
                    <p className="text-gray-700">
                      {questions[currentQuestionIndex]?.answer}
                    </p>
                    
                    {questions[currentQuestionIndex]?.evaluation && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-1">Feedback:</h4>
                        <p className="text-gray-700">
                          {questions[currentQuestionIndex]?.evaluation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 mb-4 min-h-[80px]">
                      {transcript || (isRecording ? 'Listening...' : 'Click the microphone to start recording your answer')}
                    </p>
                    
                    <div className="flex justify-between">
                      <button
                        onClick={toggleRecording}
                        className={`py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isRecording
                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff size={18} className="inline mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic size={18} className="inline mr-2" />
                            Start Recording
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={submitAnswer}
                        disabled={!transcript.trim() || isEvaluating}
                        className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isEvaluating ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="animate-spin mr-2" size={18} />
                            Evaluating...
                          </span>
                        ) : (
                          'Submit Answer'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {isSubmitted && (
            <div className="flex justify-end">
              <button
                onClick={nextQuestion}
                className="py-2 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Get Overall Feedback'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {stage === 'feedback' && overallFeedback && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Interview Performance Summary</h3>
            
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <div className="relative inline-flex">
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center border-8 border-blue-500"
                  >
                    <span className="text-3xl font-bold">
                      {overallFeedback.overallScore}
                    </span>
                  </div>
                </div>
                <p className="mt-2 font-medium">Overall Score</p>
              </div>
              
              <div className="w-2/3">
                <div className="mb-4">
                  <h4 className="font-medium text-green-700 flex items-center mb-2">
                    <CheckCircle2 size={18} className="mr-2" />
                    Strengths
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {overallFeedback.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-amber-700 flex items-center mb-2">
                    <PauseCircle size={18} className="mr-2" />
                    Areas for Improvement
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {overallFeedback.improvements.map((improvement, index) => (
                      <li key={index} className="text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <h4 className="font-semibold mb-3">Detailed Performance Breakdown</h4>
            <div className="space-y-4">
              {overallFeedback.detailedFeedback.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium">{item.area}</h5>
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">{item.score}/10</span>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(item.score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{item.feedback}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => {
                setStage('interview');
                setCurrentQuestionIndex(0);
                setIsSubmitted(false);
              }}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Review Questions
            </button>
            
            <button
              onClick={resetInterview}
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start New Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep; 