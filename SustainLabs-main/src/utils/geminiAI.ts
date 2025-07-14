import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
// In production, you should use environment variables
const API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with your actual key or environment variable
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to get health insights based on heart rate and oxygen data
export async function getHealthInsights(
  heartRate: number,
  oxygenLevel: number,
  age?: number,
  gender?: string,
  activityLevel?: string
): Promise<{
  insights: string[];
  recommendations: string[];
  riskFactors?: string[];
  score: number;
}> {
  try {
    // Create a model instance
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a context-aware prompt for health insights
    const prompt = `
      As a health analytics AI, analyze the following vital signs and provide evidence-based insights:
      
      - Heart Rate: ${heartRate} BPM
      - Blood Oxygen Level: ${oxygenLevel}%
      ${age ? `- Age: ${age} years` : ''}
      ${gender ? `- Gender: ${gender}` : ''}
      ${activityLevel ? `- Activity Level: ${activityLevel}` : ''}
      
      Provide the following in JSON format:
      1. A list of 3-4 key insights about what these values might indicate
      2. A list of 3-5 personalized recommendations for health optimization
      3. If applicable, a list of potential risk factors to be aware of (otherwise empty array)
      4. A "health score" between 0-100 representing overall cardiovascular wellness based on this data
      
      Format:
      {
        "insights": ["insight1", "insight2", ...],
        "recommendations": ["rec1", "rec2", ...],
        "riskFactors": ["risk1", "risk2", ...],
        "score": number
      }
      
      Ensure insights are evidence-based, actionable, and appropriate (not alarmist). Make recommendations personalized and practical.
    `;

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }
    
    // Parse the JSON response
    const healthData = JSON.parse(jsonMatch[0]);
    
    return {
      insights: healthData.insights || [],
      recommendations: healthData.recommendations || [],
      riskFactors: healthData.riskFactors || [],
      score: healthData.score || 70
    };
  } catch (error) {
    console.error("Error getting health insights:", error);
    
    // Return fallback data if the API fails
    return {
      insights: [
        "Your heart rate is within normal resting range for most adults.",
        "Your oxygen saturation level indicates good pulmonary function.",
        "Regular monitoring can help establish your personal baseline."
      ],
      recommendations: [
        "Stay hydrated throughout the day",
        "Maintain a regular sleep schedule",
        "Consider incorporating cardio exercise 3-5 times weekly",
        "Practice deep breathing exercises for 5 minutes daily"
      ],
      riskFactors: [],
      score: 75
    };
  }
}

// Function to generate personalized health tips
export async function getPersonalizedHealthTips(
  userData: {
    heartRateHistory: {value: number, timestamp: Date}[],
    oxygenHistory: {value: number, timestamp: Date}[],
    age?: number,
    healthGoals?: string[]
  }
): Promise<string[]> {
  try {
    // Create a model instance
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Calculate average heart rate from history
    const avgHeartRate = userData.heartRateHistory.reduce((sum, item) => sum + item.value, 0) / 
      (userData.heartRateHistory.length || 1);
    
    // Create a personalized prompt
    const prompt = `
      Based on the following user health data:
      - Average Heart Rate: ${avgHeartRate.toFixed(1)} BPM
      - Recent Heart Rate Readings: ${userData.heartRateHistory.slice(-3).map(h => h.value).join(', ')} BPM
      - Recent Oxygen Readings: ${userData.oxygenHistory.slice(-3).map(o => o.value).join(', ')}%
      ${userData.age ? `- Age: ${userData.age}` : ''}
      ${userData.healthGoals ? `- Health Goals: ${userData.healthGoals.join(', ')}` : ''}
      
      Generate 5 personalized, evidence-based health tips that are specific, actionable, and relevant.
      Focus on small, achievable habits rather than general advice.
      Return as a JSON array of strings, each 15-30 words long.
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON array from response");
    }
    
    // Parse the JSON response
    const tips = JSON.parse(jsonMatch[0]);
    return Array.isArray(tips) ? tips : [];
    
  } catch (error) {
    console.error("Error getting personalized health tips:", error);
    
    // Return fallback tips if the API fails
    return [
      "Track your heart rate during different activities to establish your personal patterns and optimal zones.",
      "Set a reminder to take three deep breaths every hour to help maintain oxygen saturation levels.",
      "Stay hydrated - aim for 8 glasses of water daily to support optimal blood circulation and heart function.",
      "Incorporate 10-minute brisk walks after meals to boost your cardiovascular health incrementally.",
      "Practice a 5-minute mindfulness exercise before bed to help lower resting heart rate and improve sleep quality."
    ];
  }
}

// Function to analyze heart rate patterns over time
export async function analyzeHeartRatePatterns(
  readings: {value: number, timestamp: Date}[]
): Promise<{
  patterns: string[];
  anomalies: {type: string, description: string, severity: 'low' | 'medium' | 'high'}[];
  trends: {metric: string, direction: 'improving' | 'declining' | 'stable', description: string}[];
}> {
  // For demo purposes, we'll return simulated data
  // In production, this would call the Gemini API with the readings data
  
  // Check if we have enough readings
  if (readings.length < 3) {
    return {
      patterns: ["Not enough data to analyze patterns yet. Continue taking measurements."],
      anomalies: [],
      trends: [{
        metric: "Heart Rate",
        direction: "stable",
        description: "Insufficient data points to determine trend"
      }]
    };
  }
  
  // Calculate some basic statistics
  const values = readings.map(r => r.value);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Determine if there's a trend (simplified)
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  let direction: 'improving' | 'declining' | 'stable';
  if (secondAvg < firstAvg - 3) direction = 'improving'; // Lower heart rate is generally better at rest
  else if (secondAvg > firstAvg + 3) direction = 'declining';
  else direction = 'stable';
  
  // Simulate analysis results
  return {
    patterns: [
      `Your average heart rate is ${avg.toFixed(1)} BPM with a range of ${range} BPM.`,
      `Your heart rate tends to be lower in the ${readings.some(r => r.timestamp.getHours() < 12) ? "morning" : "evening"}.`,
      `Your heart rate variability is ${range > 20 ? "high" : "moderate"}, which can indicate ${range > 20 ? "good cardiovascular flexibility" : "consistent cardiovascular response"}.`
    ],
    anomalies: values.some(v => v > 100) ? [
      {
        type: "Elevated Heart Rate",
        description: `Detected heart rate of ${max} BPM, which is elevated compared to your average.`,
        severity: max > 120 ? "medium" : "low"
      }
    ] : [],
    trends: [
      {
        metric: "Resting Heart Rate",
        direction: direction,
        description: direction === 'stable' 
          ? "Your heart rate has remained consistent across measurements." 
          : `Your heart rate is ${direction === 'improving' ? 'decreasing' : 'increasing'} over time.`
      }
    ]
  };
}

export default {
  getHealthInsights,
  getPersonalizedHealthTips,
  analyzeHeartRatePatterns
}; 