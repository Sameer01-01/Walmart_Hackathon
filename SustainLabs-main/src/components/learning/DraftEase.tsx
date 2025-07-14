import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Upload, FileText, Download, Settings, Layers,
  Image as ImageIcon, File, Check, X, Info,
  Sliders, Zap, RefreshCw, Eye, EyeOff,
  ChevronDown, ChevronUp, Maximize, Minimize,
  Save, Trash2, AlertTriangle, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Vector2, Vector3 } from 'three';

// Custom DXF writer interface
interface DxfWriter {
  setUnits: (units: string) => void;
  addLine: (startX: number, startY: number, endX: number, endY: number) => void;
  toDxfString: () => string;
}

// Initialize the Gemini AI client
const API_KEY = process.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Types
interface ConversionSettings {
  lineThickness: number;
  detectDoors: boolean;
  detectWindows: boolean;
  detectFurniture: boolean;
  simplifyTolerance: number;
  outputScale: number;
  colorScheme: 'standard' | 'monochrome' | 'blueprint';
}

interface ProcessingStep {
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

// Enhanced types for better processing
interface ProcessedElement {
  type: 'wall' | 'door' | 'window' | 'furniture';
  coordinates: {
    start: Coordinates;
    end: Coordinates;
  };
  properties?: Record<string, unknown>;
}

interface ProcessingResult {
  elements: ProcessedElement[];
  dimensions: { width: number; height: number };
  scale: number;
  metadata: {
    roomCount: number;
    totalArea: number;
    detectedFeatures: string[];
  };
}

interface TextGenerationSettings {
  roomCount: number;
  totalArea: number;
  style: 'modern' | 'traditional' | 'minimalist';
  features: string[];
  requirements: string;
}

interface Coordinates {
  x: number;
  y: number;
}

interface FloorPlanElement {
  type: 'wall' | 'door' | 'window' | 'furniture';
  coordinates: {
    start: Coordinates;
    end: Coordinates;
  };
  properties: Record<string, unknown>;
}

interface FloorPlanResponse {
  elements: FloorPlanElement[];
  dimensions: {
    width: number;
    height: number;
  };
  scale: number;
  metadata: {
    roomCount: number;
    totalArea: number;
    detectedFeatures: string[];
  };
}

const LineSegment: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: THREE.Color;
  lineWidth: number;
}> = ({ start, end, color, lineWidth }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, [start, end]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ color, linewidth: lineWidth });
  }, [color, lineWidth]);

  return <primitive object={new THREE.Line(geometry, material)} />;
};

// Add ProcessingPreview component
const ProcessingPreview: React.FC<{ result: ProcessingResult; settings: ConversionSettings }> = ({ result, settings }) => {
  return (
    <div className="relative w-full h-[400px] border rounded-lg overflow-hidden">
      <Canvas orthographic camera={{ zoom: 40, position: [0, 0, 100] }}>
        <ambientLight intensity={0.5} />
        {result.elements.map((element: ProcessedElement, index: number) => {
          const start = new THREE.Vector3(element.coordinates.start.x, element.coordinates.start.y, 0);
          const end = new THREE.Vector3(element.coordinates.end.x, element.coordinates.end.y, 0);
          
          const colorHex = settings.colorScheme === 'monochrome' ? '#ffffff' :
                          element.type === 'wall' ? '#ff0000' :
                          element.type === 'door' ? '#00ff00' :
                          element.type === 'window' ? '#0000ff' : '#ffff00';
          
          const color = new THREE.Color(colorHex);
          
          return (
            <LineSegment
              key={index}
              start={start}
              end={end}
              color={color}
              lineWidth={settings.lineThickness}
            />
          );
        })}
      </Canvas>
    </div>
  );
};

// Add ResultsSummary component
const ResultsSummary: React.FC<{ result: ProcessingResult }> = ({ result }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="stat bg-base-300 rounded-lg p-4">
        <div className="stat-title">Total Area</div>
        <div className="stat-value text-primary">{result.metadata.totalArea}m²</div>
        <div className="stat-desc">Calculated from floor plan</div>
      </div>
      <div className="stat bg-base-300 rounded-lg p-4">
        <div className="stat-title">Room Count</div>
        <div className="stat-value text-secondary">{result.metadata.roomCount}</div>
        <div className="stat-desc">Detected spaces</div>
      </div>
      <div className="stat bg-base-300 rounded-lg p-4">
        <div className="stat-title">Scale</div>
        <div className="stat-value">{result.scale}:1</div>
        <div className="stat-desc">Drawing scale</div>
      </div>
      <div className="stat bg-base-300 rounded-lg p-4">
        <div className="stat-title">Features</div>
        <div className="stat-value text-accent">{result.metadata.detectedFeatures.length}</div>
        <div className="stat-desc">Identified elements</div>
      </div>
    </div>
  );
};

// Enhanced DXF writer implementation
class DxfWriterImpl implements DxfWriter {
  private content: string = '';
  
  constructor() {
    this.initializeHeader();
  }
  
  private initializeHeader(): void {
    this.content = '0\nSECTION\n2\nHEADER\n';
    this.content += '9\n$ACADVER\n1\nAC1024\n';
    this.content += '9\n$HANDSEED\n5\nFFFF\n';
    this.content += '0\nENDSEC\n';
    this.content += '0\nSECTION\n2\nTABLES\n';
    this.content += '0\nENDSEC\n';
    this.content += '0\nSECTION\n2\nENTITIES\n';
  }
  
  setUnits(units: string): void {
    this.content += `9\n$INSUNITS\n70\n${units === 'mm' ? '4' : '1'}\n`;
  }
  
  addLine(startX: number, startY: number, endX: number, endY: number): void {
    this.content += '0\nLINE\n';
    this.content += '8\n0\n'; // Layer
    this.content += `10\n${startX}\n20\n${startY}\n30\n0\n`; // Start point
    this.content += `11\n${endX}\n21\n${endY}\n31\n0\n`; // End point
  }
  
  toDxfString(): string {
    return this.content + '0\nENDSEC\n0\nEOF\n';
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-error/10 text-error rounded-lg">
          <AlertTriangle className="w-6 h-6 mb-2" />
          <h3 className="font-medium">Something went wrong</h3>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const DraftEase: React.FC = () => {
  // State management
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [dxfDownloadUrl, setDxfDownloadUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: 'Image Analysis', description: 'Analyzing image quality and content', status: 'pending' },
    { name: 'Edge Detection', description: 'Detecting walls and structural elements', status: 'pending' },
    { name: 'Feature Recognition', description: 'Identifying doors, windows, and fixtures', status: 'pending' },
    { name: 'Vector Conversion', description: 'Converting to vector format', status: 'pending' },
    { name: 'DXF Generation', description: 'Creating final CAD file', status: 'pending' }
  ]);

  const [settings, setSettings] = useState<ConversionSettings>({
    lineThickness: 1,
    detectDoors: true,
    detectWindows: true,
    detectFurniture: false,
    simplifyTolerance: 0.5,
    outputScale: 1.0,
    colorScheme: 'standard'
  });

  const [processedResult, setProcessedResult] = useState<ProcessingResult | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);

  const [isTextMode, setIsTextMode] = useState(false);
  const [textGenerationSettings, setTextGenerationSettings] = useState<TextGenerationSettings>({
    roomCount: 3,
    totalArea: 100,
    style: 'modern',
    features: [],
    requirements: ''
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Enhanced error handling for file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setProcessingError('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setProcessingError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    setUploadedImage(file);
    setProcessingError(null);
    setProcessingComplete(false);
    setDxfDownloadUrl(null);

    // Create image preview with error handling
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setProcessingError('Failed to read the image file');
    };
    reader.readAsDataURL(file);
  };

  // Start processing the image
  const startProcessing = async () => {
    if (!uploadedImage || isProcessing) return;

    setIsProcessing(true);
    setProcessingComplete(false);
    setProcessingError(null);
    setProcessedResult(null);
    setDownloadReady(false);

    try {
      // Reset and start processing steps
      await updateProcessingStep(0, 'processing');
      
      // Image Analysis
      const imageData = await processImageWithGemini(uploadedImage, settings);
      await updateProcessingStep(0, 'completed');

      // Edge Detection
      await updateProcessingStep(1, 'processing');
      setProcessedResult(imageData);
      await updateProcessingStep(1, 'completed');

      // Feature Recognition
      await updateProcessingStep(2, 'processing');
      await updateProcessingStep(2, 'completed');

      // Vector Conversion
      await updateProcessingStep(3, 'processing');
      const dxfContent = generateDxfContent(imageData.elements);
      await updateProcessingStep(3, 'completed');

      // DXF Generation
      await updateProcessingStep(4, 'processing');
      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      setDxfDownloadUrl(url);
      await updateProcessingStep(4, 'completed');

      setProcessingComplete(true);
      setDownloadReady(true);

    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError('An error occurred during processing. Please try again.');
      const currentStepIndex = processingSteps.findIndex(step => step.status === 'processing');
      if (currentStepIndex >= 0) {
        updateProcessingStep(currentStepIndex, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to update processing step status
  const updateProcessingStep = async (index: number, status: 'pending' | 'processing' | 'completed' | 'error', progress?: number) => {
    return new Promise<void>(resolve => {
      setProcessingSteps(steps => {
        const newSteps = [...steps];
        newSteps[index] = {
          ...newSteps[index],
          status,
          progress
        };
        return newSteps;
      });
      setTimeout(resolve, 100); // Small delay to ensure UI updates
    });
  };

  // Helper function to simulate processing delay
  const simulateProcessingDelay = (ms: number) => {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  };

  // Update DXF generation
  const generateDxfContent = (elements: ProcessedElement[]): string => {
    const writer = new DxfWriterImpl();
    writer.setUnits('mm');
    
    elements.forEach(element => {
      writer.addLine(
        element.coordinates.start.x,
        element.coordinates.start.y,
        element.coordinates.end.x,
        element.coordinates.end.y
      );
    });
    
    return writer.toDxfString();
  };

  const processImageWithGemini = async (image: File, settings: ConversionSettings): Promise<ProcessingResult> => {
    try {
      const base64Image = await fileToBase64(image);
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const prompt = `
        Analyze this architectural floor plan image in detail.
        I need a structured JSON response with the following information:
        1. All detected elements (walls, ${settings.detectDoors ? 'doors, ' : ''}${settings.detectWindows ? 'windows, ' : ''}${settings.detectFurniture ? 'furniture, ' : ''}etc)
        2. Dimensions and scale
        3. Room count and total area
        4. Key features and their coordinates
        
        Format the response as:
        {
          "elements": [
            {
              "type": "wall|door|window|furniture",
              "coordinates": {"x1": number, "y1": number, "x2": number, "y2": number},
              "properties": {}
            }
          ],
          "dimensions": {"width": number, "height": number},
          "scale": number,
          "metadata": {
            "roomCount": number,
            "totalArea": number,
            "detectedFeatures": []
          }
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: image.type
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      try {
        // Parse the AI response into our expected format
        const parsedResult = JSON.parse(text);
        return parsedResult as ProcessingResult;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('Gemini AI processing error:', error);
      throw error;
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Reset the form
  const resetForm = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setProcessingComplete(false);
    setProcessingError(null);
    setDxfDownloadUrl(null);
    setProcessingSteps(steps => steps.map(step => ({
      ...step,
      status: 'pending',
      progress: undefined
    })));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update settings
  const updateSetting = <K extends keyof ConversionSettings>(
    key: K,
    value: ConversionSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add download handler
  const handleDownload = () => {
    if (!dxfDownloadUrl || !downloadReady) return;
    
    const link = document.createElement('a');
    link.href = dxfDownloadUrl;
    link.download = `${uploadedImage?.name.split('.')[0] || 'floorplan'}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add text-to-plan generation function
  const generatePlanFromText = async () => {
    if (!textGenerationSettings.requirements) return;

    setIsProcessing(true);
    setProcessingError(null);
    setProcessedResult(null);

    try {
      await updateProcessingStep(0, 'processing');
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        Generate a detailed floor plan description based on these requirements:
        - Room Count: ${textGenerationSettings.roomCount}
        - Total Area: ${textGenerationSettings.totalArea}m²
        - Style: ${textGenerationSettings.style}
        - Features: ${textGenerationSettings.features.join(', ')}
        - Additional Requirements: ${textGenerationSettings.requirements}

        Provide the response in this JSON format:
        {
          "elements": [
            {
              "type": "wall|door|window|furniture",
              "coordinates": {"x1": number, "y1": number, "x2": number, "y2": number},
              "properties": {}
            }
          ],
          "dimensions": {"width": number, "height": number},
          "scale": number,
          "metadata": {
            "roomCount": number,
            "totalArea": number,
            "detectedFeatures": []
          }
        }

        Ensure all measurements are proportional and the layout is practical.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsedResult = JSON.parse(text);
        setProcessedResult(parsedResult);
        await updateProcessingStep(0, 'completed');
        
        // Convert coordinates to Vector2 format
        const coordinates: Array<[number, number]> = parsedResult.elements.map((element: ProcessedElement) => [
          element.coordinates.start.x,
          element.coordinates.start.y
        ]);

        // Create DXF file from coordinates
        const dxf = new DxfWriterImpl();
        coordinates.forEach(([x, y], index) => {
          if (index < coordinates.length - 1) {
            dxf.addLine(x, y, coordinates[index + 1][0], coordinates[index + 1][1]);
          }
        });

        // Generate DXF
        await updateProcessingStep(4, 'processing');
        const dxfContent = dxf.toDxfString();
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        setDxfDownloadUrl(url);
        await updateProcessingStep(4, 'completed');
        
        setProcessingComplete(true);
        setDownloadReady(true);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('Text to plan generation error:', error);
      setProcessingError('Failed to generate plan from text. Please try again.');
      const currentStepIndex = processingSteps.findIndex(step => step.status === 'processing');
      if (currentStepIndex >= 0) {
        updateProcessingStep(currentStepIndex, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Add text generation settings UI component
  const TextGenerationPanel = () => (
    <div className="space-y-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Number of Rooms</span>
          <span className="label-text-alt">{textGenerationSettings.roomCount} rooms</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={textGenerationSettings.roomCount}
          onChange={(e) => setTextGenerationSettings(prev => ({
            ...prev,
            roomCount: parseInt(e.target.value)
          }))}
          className="range range-primary"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Total Area (m²)</span>
          <span className="label-text-alt">{textGenerationSettings.totalArea}m²</span>
        </label>
        <input
          type="range"
          min="50"
          max="500"
          step="10"
          value={textGenerationSettings.totalArea}
          onChange={(e) => setTextGenerationSettings(prev => ({
            ...prev,
            totalArea: parseInt(e.target.value)
          }))}
          className="range range-primary"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Style</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={textGenerationSettings.style}
          onChange={(e) => setTextGenerationSettings(prev => ({
            ...prev,
            style: e.target.value as 'modern' | 'traditional' | 'minimalist'
          }))}
        >
          <option value="modern">Modern</option>
          <option value="traditional">Traditional</option>
          <option value="minimalist">Minimalist</option>
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Features</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {['Open Kitchen', 'Master Suite', 'Balcony', 'Home Office', 'Walk-in Closet'].map(feature => (
            <label key={feature} className="cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary mr-2"
                checked={textGenerationSettings.features.includes(feature)}
                onChange={(e) => {
                  setTextGenerationSettings(prev => ({
                    ...prev,
                    features: e.target.checked
                      ? [...prev.features, feature]
                      : prev.features.filter(f => f !== feature)
                  }));
                }}
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Additional Requirements</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Enter any specific requirements or preferences..."
          value={textGenerationSettings.requirements}
          onChange={(e) => setTextGenerationSettings(prev => ({
            ...prev,
            requirements: e.target.value
          }))}
        />
      </div>

      <button
        className={`btn btn-primary w-full ${isProcessing ? 'loading' : ''}`}
        onClick={generatePlanFromText}
        disabled={isProcessing || !textGenerationSettings.requirements}
      >
        {isProcessing ? 'Generating Plan...' : 'Generate Floor Plan'}
      </button>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full bg-base-100 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-content p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="h-6 w-6" />
              <h2 className="text-xl font-bold">DraftEase</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className={`btn btn-sm ${!isTextMode ? 'btn-ghost' : ''}`}
                onClick={() => setIsTextMode(false)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Plan
              </button>
              <button
                className={`btn btn-sm ${isTextMode ? 'btn-ghost' : ''}`}
                onClick={() => setIsTextMode(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Text to Plan
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Panel - Upload/Text Input */}
          <div className="w-full md:w-1/2 p-4 flex flex-col overflow-auto">
            {isTextMode ? (
              <TextGenerationPanel />
            ) : (
              <div>
                {!uploadedImage ? (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-primary/30 hover:border-primary/70 flex-1 flex flex-col items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <Upload className="w-16 h-16 text-primary/60 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Upload Floor Plan</h3>
                    <p className="text-sm text-base-content/70 max-w-md mx-auto">
                      Drag and drop your floor plan image, or click to browse.
                      Supports JPG, PNG, and other common image formats.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Enhanced image preview section */}
                    {uploadedImage && imagePreview && (
                      <div className="relative mt-4 border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Floor plan preview"
                          className="w-full h-auto object-contain max-h-[400px]"
                          onError={() => setProcessingError('Failed to load image preview')}
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <p>Processing image...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Enhanced error display */}
                    {processingError && (
                      <div className="mt-4 p-4 bg-error/10 text-error rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Error</h4>
                          <p className="text-sm">{processingError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Processing Status and Results */}
          <div className="w-full md:w-1/2 bg-base-200 p-4 overflow-auto">
            <h3 className="text-lg font-medium mb-4">Processing Status</h3>

            {/* Processing Steps */}
            <div className="space-y-3 mb-6">
              {processingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`bg-base-100 p-3 rounded-lg transition-all ${
                    step.status === 'processing' ? 'border-l-4 border-primary' :
                    step.status === 'completed' ? 'border-l-4 border-success' :
                    step.status === 'error' ? 'border-l-4 border-error' :
                    ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {step.status === 'pending' && <div className="w-5 h-5 mr-3"></div>}
                      {step.status === 'processing' && <RefreshCw className="w-5 h-5 mr-3 text-primary animate-spin" />}
                      {step.status === 'completed' && <Check className="w-5 h-5 mr-3 text-success" />}
                      {step.status === 'error' && <X className="w-5 h-5 mr-3 text-error" />}
                      <span className="font-medium">{step.name}</span>
                    </div>
                    {step.progress !== undefined && (
                      <span className="text-xs opacity-70">{step.progress}%</span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/70 mt-1 ml-8">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Results Section */}
            {processingComplete && (
              <div className="bg-base-100 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-success" />
                  Conversion Complete
                </h4>

                <p className="text-sm mb-4">
                  Your floor plan has been successfully converted to DXF format.
                  The file is ready for download and can be opened in any CAD software.
                </p>

                <div className="flex flex-col space-y-2">
                  <button
                    className={`btn ${downloadReady ? 'btn-success' : 'btn-disabled'}`}
                    onClick={handleDownload}
                    disabled={!downloadReady}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {downloadReady ? 'Download DXF File' : 'Preparing Download...'}
                  </button>

                  <button className="btn btn-outline btn-sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save to My Projects
                  </button>
                </div>

                <div className="mt-4 text-xs text-base-content/70">
                  <p className="flex items-center">
                    <Info className="h-4 w-4 mr-1 inline" />
                    The DXF file is compatible with AutoCAD, LibreCAD, FreeCAD, and other CAD software.
                  </p>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <div className="bg-base-100 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">About DraftEase</h4>
                <p className="text-xs text-base-content/70">
                  DraftEase uses algorithmic tracing to convert floor plan images to editable CAD files,
                  making architectural digitization fast and accurate.
                </p>
              </div>

              <div className="bg-base-100 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Supported Elements</h4>
                <ul className="text-xs text-base-content/70 space-y-1">
                  <li className="flex items-center">
                    <Check className="h-3 w-3 mr-1 text-success" /> Walls & Partitions
                  </li>
                  <li className="flex items-center">
                    <Check className="h-3 w-3 mr-1 text-success" /> Doors & Windows
                  </li>
                  <li className="flex items-center">
                    <Check className="h-3 w-3 mr-1 text-success" /> Room Boundaries
                  </li>
                </ul>
              </div>
            </div>

            {/* Add preview and results after processing */}
            {processedResult && (
              <div className="space-y-6">
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Processing Preview
                  </h4>
                  <ProcessingPreview result={processedResult} settings={settings} />
                </div>

                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-medium mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Analysis Results
                  </h4>
                  <ResultsSummary result={processedResult} />
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Detected Features</h5>
                    <div className="flex flex-wrap gap-2">
                      {processedResult.metadata.detectedFeatures.map((feature, index) => (
                        <div key={index} className="badge badge-primary">{feature}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DraftEase;
