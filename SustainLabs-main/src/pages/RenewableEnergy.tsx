import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, BarChart } from '@tremor/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Sun, 
  Wind, 
  Battery, 
  Zap, 
  AlertTriangle, 
  CloudRain, 
  Thermometer, 
  Download, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  IndianRupee,
  BarChart as BarChartIcon,
  Droplets,
  BarChart2,
  ArrowUpRight
} from 'lucide-react';
import { faker } from '@faker-js/faker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generateEnergyData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    solar: faker.number.int({ min: 20, max: 100 }),
    wind: faker.number.int({ min: 15, max: 80 }),
    battery: faker.number.int({ min: 10, max: 60 }),
    consumption: faker.number.int({ min: 30, max: 90 }),
    cost: faker.number.int({ min: 50, max: 200 }),
    optimizedUsage: faker.number.int({ min: 20, max: 70 }),
    predictedUsage: faker.number.int({ min: 35, max: 95 })
  }));
};

const weatherData = {
  temperature: '24°C',
  humidity: '65%',
  windSpeed: '12 km/h',
  forecast: 'Partly Cloudy'
};

// Add this type definition for recommendations
interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: {
    energyProduction: number;
    costSavings: number;
    co2Reduction: number;
  };
  priority: 'High' | 'Medium' | 'Low';
  category: 'Optimization' | 'Maintenance' | 'Expansion' | 'Efficiency';
  implementationTimeframe: 'Immediate' | 'Short-term' | 'Long-term';
  roi: number; // Return on investment (months)
  confidenceScore: number; // AI confidence in recommendation (0-100)
}

const systemAlerts = [
  {
    title: 'Severe Weather Alert',
    description: 'Incoming storm system detected. Implementing protective measures for wind turbines.',
    time: '30 minutes ago',
    type: 'warning',
    impact: 'Potential 20% reduction in wind power output',
    action: 'Automated safety protocols initiated'
  },
  {
    title: 'Grid Stability Notice',
    description: 'Unusual voltage fluctuations detected in sector 3',
    time: '2 hours ago',
    type: 'info',
    impact: 'Minor system inefficiency detected',
    action: 'Diagnostic scan in progress'
  },
  {
    title: 'Maintenance Alert',
    description: 'Solar panel array 5 showing signs of degraded performance',
    time: '4 hours ago',
    type: 'warning',
    impact: '5% reduction in array efficiency',
    action: 'Scheduled for inspection within 24 hours'
  }
];

// Add interface for EnergySource
interface EnergySource {
  title: string;
  value: string;
  efficiency: string;
  status: string;
  icon: React.ElementType;
  color: string;
}

const RenewableEnergy = () => {
  const [energyData, setEnergyData] = useState(generateEnergyData());
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [selectedEnergyChart, setSelectedEnergyChart] = useState('area');
  const [showProductionLegend, setShowProductionLegend] = useState(true);
  const [selectedDistributionView, setSelectedDistributionView] = useState('donut');
  const [showForecastDetails, setShowForecastDetails] = useState(false);
  
  // Add refs for the charts
  const areaChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  // Define vibrant color scheme for the charts
  const colorScheme = {
    solar: '#FFB800', // Bright gold
    wind: '#0088FF',  // Bright blue
    battery: '#00D084', // Vibrant green
    predicted: '#9C6CFF', // Vibrant purple
    optimized: '#956E99', // Vibrant pink
    consumption: '#FF4572', // Bright raspberry
    background: {
      solar: 'rgba(255, 184, 0, 0.15)',
      wind: 'rgba(0, 136, 255, 0.15)',
      battery: 'rgba(0, 208, 132, 0.15)',
      predicted: 'rgba(156, 108, 255, 0.15)',
      optimized: 'rgba(255, 94, 159, 0.15)',
      consumption: 'rgba(255, 69, 114, 0.15)'
    }
  };

  // Replace the RenewableEnergy component
  const generateRealData = () => {
    const data = [];
    
    // Create more realistic 24-hour data pattern
    for (let i = 0; i < 24; i++) {
      // Solar is highest during midday (bell curve)
      const solarValue = i >= 6 && i <= 18 
        ? 30 + Math.round(Math.sin((i-6) * Math.PI/12) * 70)
        : Math.round(Math.random() * 10);
        
      // Wind tends to be stronger in mornings and evenings
      const windValue = (i <= 8 || i >= 16) 
        ? 40 + Math.round(Math.random() * 40)
        : 20 + Math.round(Math.random() * 30);
        
      // Battery usage peaks in evening when solar drops
      const batteryValue = i >= 16 || i <= 5
        ? 30 + Math.round(Math.random() * 30)
        : 10 + Math.round(Math.random() * 15);
        
      // Consumption is higher in mornings and evenings
      const consumptionValue = (i >= 6 && i <= 9) || (i >= 17 && i <= 22)
        ? 70 + Math.round(Math.random() * 20)
        : 30 + Math.round(Math.random() * 30);
      
      const optimizedUsageValue = consumptionValue * (0.7 + (Math.random() * 0.1));
      
      data.push({
        time: `${i}:00`,
        solar: solarValue,
        wind: windValue,
        battery: batteryValue,
        consumption: consumptionValue,
        predictedUsage: consumptionValue * (1 + (Math.random() * 0.1)),
        optimizedUsage: optimizedUsageValue,
        cost: Math.round((consumptionValue * 2) + (Math.random() * 30))
      });
    }
    
    return data;
  };
  
  // Set more accurate data on initial load
  useEffect(() => {
    setEnergyData(generateRealData());
  }, []);
  
  // Original useEffect for data refresh - change to 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergyData(generateRealData());
    }, 5000); // Changed from 30000 to 5000 (5 seconds)

    return () => clearInterval(interval);
  }, []);

  // Update useEffect to style SVG elements including recharts-sector
  useEffect(() => {
    // Function to apply styling to chart SVG elements
    const styleChartSvg = () => {
      // Style area chart
      if (areaChartRef.current) {
        const areaSvg = areaChartRef.current.querySelector('.recharts-surface');
        if (areaSvg) {
          (areaSvg as HTMLElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,184,0,0.05) 100%)';
          (areaSvg as HTMLElement).style.borderRadius = '12px';
          (areaSvg as HTMLElement).style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))';
        }
        
        // Add specific classes to area paths
        const areaPaths = areaChartRef.current.querySelectorAll('.recharts-curve.recharts-area-area');
        const areaStrokes = areaChartRef.current.querySelectorAll('.recharts-curve.recharts-area-curve');
        
        if (areaPaths.length >= 3 && areaStrokes.length >= 3) {
          // Add classes for area fills
          areaPaths[0]?.classList.add('solar-area');
          areaPaths[1]?.classList.add('wind-area');
          areaPaths[2]?.classList.add('battery-area');
          
          // Add classes for area strokes
          areaStrokes[0]?.classList.add('solar-stroke');
          areaStrokes[1]?.classList.add('wind-stroke');
          areaStrokes[2]?.classList.add('battery-stroke');
        }
      }
      
      // Style pie chart container with 3D effect
      if (donutChartRef.current) {
        const pieSvg = donutChartRef.current.querySelector('.recharts-surface');
        if (pieSvg) {
          (pieSvg as HTMLElement).style.background = 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.02) 100%)';
          (pieSvg as HTMLElement).style.filter = 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))';
        }
        
        // Add advanced 3D-like hover effects to sectors
        const sectors = donutChartRef.current.querySelectorAll('.recharts-sector');
        sectors.forEach((sector, index) => {
          // Add transition for smooth animations
          (sector as HTMLElement).style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          
          // Create hover effect
          sector.addEventListener('mouseenter', () => {
            (sector as HTMLElement).style.transform = 'translateY(-5px) scale(1.05)';
            (sector as HTMLElement).style.filter = `drop-shadow(0px 6px 8px rgba(0,0,0,0.25))`;
            (sector as HTMLElement).style.cursor = 'pointer';
          });
          
          sector.addEventListener('mouseleave', () => {
            (sector as HTMLElement).style.transform = 'translateY(0) scale(1)';
            (sector as HTMLElement).style.filter = 'none';
          });
        });
        
        // Add pulse effect to the central circle
        const centralCircle = donutChartRef.current.querySelector('.absolute .bg-base-200\\/60');
        if (centralCircle) {
          (centralCircle as HTMLElement).style.animation = 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite';
          (centralCircle as HTMLElement).style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.1)';
        }
      }
      
      // Style bar chart
      if (barChartRef.current) {
        const barSvg = barChartRef.current.querySelector('.recharts-surface');
        if (barSvg) {
          (barSvg as HTMLElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(147,51,234,0.05) 100%)';
          (barSvg as HTMLElement).style.borderRadius = '12px';
          (barSvg as HTMLElement).style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))';
        }
      }
    };
    
    // Apply styling after a short delay to ensure components are rendered
    const timer = setTimeout(() => {
      styleChartSvg();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [energyData, colorScheme]); // Re-apply when data or colorScheme changes

  // Fix the TypeScript errors by properly casting the DOM elements
  useEffect(() => {
    // Function to apply styling to bar chart rectangles
    const styleBarRectangles = () => {
      if (barChartRef.current) {
        // Select all rectangles in the bar chart
        const rectangles = barChartRef.current.querySelectorAll('.recharts-rectangle');
        rectangles.forEach((rect, index) => {
          // Apply custom classes based on data category
          if (index % 2 === 0) {
            rect.classList.add('consumption-bar');
          } else {
            rect.classList.add('optimized-bar');
          }
          
          // Add hover effect with proper TypeScript casting
          rect.addEventListener('mouseenter', () => {
            (rect as HTMLElement).style.opacity = '0.9';
            (rect as HTMLElement).style.transform = 'translateY(-2px)';
            (rect as HTMLElement).style.transition = 'all 0.3s ease';
          });
          
          rect.addEventListener('mouseleave', () => {
            (rect as HTMLElement).style.opacity = '1';
            (rect as HTMLElement).style.transform = 'translateY(0)';
          });
        });
      }
    };
    
    // Apply styling after a short delay to ensure components are rendered
    const timer = setTimeout(() => {
      styleBarRectangles();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [energyData]); // Re-apply when data changes

  // Fix the PDF generation by properly accessing recommendations
  const generateReport = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      // Cast the jsPDF instance to 'any' to allow access to autoTable and lastAutoTable
      const docAny = doc as any;
      
      // Header
      doc.setFontSize(20);
      doc.text('Renewable Energy System Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

      // System Overview
      doc.setFontSize(16);
      doc.text('System Overview', 20, 45);
      const metrics = [
        ['Total Power Output', '198.8 kW'],
        ['System Efficiency', '94.2%'],
        ['Carbon Offset', '2.4 tons'],
        ['Cost Savings', '₹342.50/day']
      ];
      docAny.autoTable({
        startY: 50,
        head: [['Metric', 'Value']],
        body: metrics
      });

      // Energy Sources
      doc.setFontSize(16);
      doc.text('Energy Sources', 20, docAny.lastAutoTable.finalY + 20);
      const sources = [
        ['Solar Power', '45.2 kW', '87%'],
        ['Wind Power', '32.8 kW', '78%'],
        ['Battery Storage', '120 kWh', '92%']
      ];
      docAny.autoTable({
        startY: docAny.lastAutoTable.finalY + 25,
        head: [['Source', 'Output', 'Efficiency']],
        body: sources
      });

      // AI Recommendations
      doc.setFontSize(16);
      doc.text('AI Recommendations', 20, docAny.lastAutoTable.finalY + 20);
      
      // Create a mock set of recommendations if needed
      const reportRecommendations = [
        {
          title: 'Dynamic Load Balancing Optimization',
          impact: { energyProduction: 15, costSavings: 22 },
          roi: 6
        },
        {
          title: 'Predictive Maintenance Protocol',
          impact: { energyProduction: 8, costSavings: 35 },
          roi: 3
        },
        {
          title: 'Weather-Adaptive Solar Tracking',
          impact: { energyProduction: 12, costSavings: 10 },
          roi: 9
        }
      ];
      
      const recommendationsForReport = reportRecommendations.map(rec => [
        rec.title,
        `${rec.impact.energyProduction}% energy, ${rec.impact.costSavings}% cost`,
        `${rec.roi} months`
      ]);
      
      docAny.autoTable({
        startY: docAny.lastAutoTable.finalY + 25,
        head: [['Recommendation', 'Impact', 'ROI']],
        body: recommendationsForReport
      });

      // System Alerts
      doc.setFontSize(16);
      doc.text('Active System Alerts', 20, docAny.lastAutoTable.finalY + 20);
      const alerts = systemAlerts.map(alert => [
        alert.title,
        alert.description,
        alert.impact
      ]);
      docAny.autoTable({
        startY: docAny.lastAutoTable.finalY + 25,
        head: [['Alert', 'Description', 'Impact']],
        body: alerts
      });

      doc.save('renewable-energy-report.pdf');
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const TimeRangeSelector = () => (
    <div className="flex gap-2">
      {['24h', '7d', '30d', '1y'].map((range) => (
        <button
          key={range}
          onClick={() => setSelectedTimeRange(range)}
          className={`btn ${selectedTimeRange === range ? 'btn-primary' : 'btn-ghost'}`}
        >
          {range}
        </button>
      ))}
    </div>
  );

  const ViewSelector = () => (
    <div className="flex gap-2">
      {['overview', 'detailed', 'analytics'].map((view) => (
        <button
          key={view}
          onClick={() => setSelectedView(view)}
          className={`btn ${selectedView === view ? 'btn-secondary' : 'btn-ghost'}`}
        >
          {view}
        </button>
      ))}
    </div>
  );

  const WeatherWidget = () => (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          <CloudRain className="w-6 h-6 text-primary" />
          Weather Conditions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-error" />
            <span>{weatherData.temperature}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-info" />
            <span>{weatherData.windSpeed}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const EnergySourceCard = ({ source }: { source: EnergySource }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="card bg-base-200 shadow-xl"
    >
      <div className="card-body">
        <div className="flex justify-between items-center">
          <source.icon className={`w-8 h-8 ${source.color}`} />
          <div className={`badge ${
            source.status === 'Optimal' ? 'badge-success' :
            source.status === 'Good' ? 'badge-info' :
            'badge-warning'
          }`}>
            {source.status}
          </div>
        </div>
        <h2 className="card-title mt-4">{source.value}</h2>
        <p className="text-base-content/70">{source.title}</p>
        <div className="mt-4 pt-4 border-t border-base-300">
          <div className="flex justify-between items-center mb-2">
            <span>Efficiency</span>
            <span>{source.efficiency}</span>
          </div>
          <progress 
            className={`progress ${
              parseInt(source.efficiency) > 85 ? 'progress-success' :
              parseInt(source.efficiency) > 70 ? 'progress-warning' :
              'progress-error'
            }`} 
            value={parseInt(source.efficiency)} 
            max="100"
          ></progress>
        </div>
      </div>
    </motion.div>
  );

  // Fix the AIRecommendationsPanel component to maintain state properly
  const AIRecommendationsPanel = () => {
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([
      {
        id: 'rec1',
        title: 'Dynamic Load Balancing Optimization',
        description: 'Implement AI-driven load balancing to optimize energy distribution based on real-time usage patterns. This would reduce peak loads by an estimated 24% and increase overall system efficiency.',
        impact: {
          energyProduction: 15,
          costSavings: 22,
          co2Reduction: 18
        },
        priority: 'High',
        category: 'Optimization',
        implementationTimeframe: 'Short-term',
        roi: 6,
        confidenceScore: 92
      },
      {
        id: 'rec2',
        title: 'Predictive Maintenance Protocol',
        description: 'Deploy machine learning models to predict equipment failures before they occur. Analysis of vibration and temperature patterns indicates potential issues with 3 inverters in your east array.',
        impact: {
          energyProduction: 8,
          costSavings: 35,
          co2Reduction: 5
        },
        priority: 'High',
        category: 'Maintenance',
        implementationTimeframe: 'Immediate',
        roi: 3,
        confidenceScore: 89
      },
      {
        id: 'rec3',
        title: 'Weather-Adaptive Solar Tracking',
        description: 'Enhance solar panel tracking algorithms with hyperlocal weather forecasting to optimize angle adjustments 7-10 minutes before cloud cover changes.',
        impact: {
          energyProduction: 12,
          costSavings: 10,
          co2Reduction: 11
        },
        priority: 'Medium',
        category: 'Optimization',
        implementationTimeframe: 'Short-term',
        roi: 9,
        confidenceScore: 81
      },
      {
        id: 'rec4',
        title: 'Energy Storage Capacity Expansion',
        description: 'Current battery usage patterns indicate optimal expansion of 15kWh to capture excess production during peak solar hours. Machine learning projections show ROI within 14 months.',
        impact: {
          energyProduction: 0,
          costSavings: 28,
          co2Reduction: 25
        },
        priority: 'Medium',
        category: 'Expansion',
        implementationTimeframe: 'Long-term',
        roi: 14,
        confidenceScore: 85
      },
      {
        id: 'rec5',
        title: 'Smart Inverter Configuration Updates',
        description: 'Configuration adjustments to inverter settings based on seasonal performance analysis would improve conversion efficiency during early morning and evening hours.',
        impact: {
          energyProduction: 6,
          costSavings: 8,
          co2Reduction: 6
        },
        priority: 'Low',
        category: 'Efficiency',
        implementationTimeframe: 'Immediate',
        roi: 1,
        confidenceScore: 94
      }
    ]);
    
    const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
    const [filterPriority, setFilterPriority] = useState<string | null>(null);
    const [showAllRecommendations, setShowAllRecommendations] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [implementing, setImplementing] = useState<string | null>(null);
    const [implementationStatus, setImplementationStatus] = useState<{[key: string]: string}>({});

    // Filter recommendations based on selected priority
    const filteredRecommendations = filterPriority 
      ? recommendations.filter(rec => rec.priority === filterPriority)
      : recommendations;
    
    // Display recommendations based on showAll state
    const displayedRecommendations = showAllRecommendations 
      ? filteredRecommendations 
      : filteredRecommendations.slice(0, 3);

    // Function to generate new recommendations - Fixed to ensure state persistence
    const generateNewRecommendations = () => {
      setIsGenerating(true);
      
      // Simulate API call delay
      setTimeout(() => {
        try {
          const newRecommendations: AIRecommendation[] = [
            {
              id: 'rec-' + Date.now() + '-1',
              title: 'Microgrid Integration Strategy',
              description: 'Our analysis of your current system architecture shows significant potential for microgrid implementation. By establishing a semi-autonomous local power grid, you can achieve greater resilience during outages and optimize energy flow between your solar, wind, and battery systems.\n\nOur AI models indicate that your current production patterns and consumption needs are ideal for a Type B microgrid configuration with fault-tolerant switching mechanisms. Implementation would involve installation of advanced controller hardware and reconfiguration of existing distribution panels.\n\nThis upgrade would not only improve overall system efficiency but also provide critical backup capabilities during grid instability.',
              impact: {
                energyProduction: 8,
                costSavings: 32,
                co2Reduction: 12
              },
              priority: 'High',
              category: 'Optimization',
              implementationTimeframe: 'Short-term',
              roi: 8,
              confidenceScore: 94
            },
            {
              id: 'rec-' + Date.now() + '-2',
              title: 'AI-Driven Demand Response System',
              description: 'Based on 12 months of collected usage data, we\'ve identified clear patterns in your energy consumption that can be optimized with an intelligent demand response system. This system would use machine learning to predict peak demand periods and automatically adjust non-critical loads to reduce strain on your renewable resources.\n\nThe system would monitor grid conditions, weather forecasts, and historical usage patterns to make real-time decisions about load shedding and energy distribution. Key components include smart relays for major appliances, integration with existing HVAC controls, and a predictive algorithm that improves over time.\n\nEarly implementation would provide a solid foundation for future smart home/building capabilities while immediately reducing energy waste and extending battery life.',
              impact: {
                energyProduction: 4,
                costSavings: 28,
                co2Reduction: 22
              },
              priority: 'Medium',
              category: 'Efficiency',
              implementationTimeframe: 'Immediate',
              roi: 4,
              confidenceScore: 91
            },
            {
              id: 'rec-' + Date.now() + '-3',
              title: 'Solar Panel Cleaning & Efficiency Protocol',
              description: 'Analysis of your solar production data indicates a gradual 8% decline in output efficiency over the past 3 months, which doesn\'t correlate with seasonal changes. Our diagnostic algorithms suggest dust and particulate accumulation as the most likely cause, with a 87% confidence level.\n\nWe recommend implementing a quarterly cleaning protocol using deionized water and soft-bristle methods. Additionally, infrared scanning should be performed to identify any hotspots that may indicate damaged cells or connection issues. The northwestern array shows particular signs of reduced performance and should be prioritized.\n\nRegular maintenance will prevent further degradation and restore optimal production levels, with typical efficiency gains of 5-12% following proper cleaning procedures.',
              impact: {
                energyProduction: 12,
                costSavings: 14,
                co2Reduction: 10
              },
              priority: 'High',
              category: 'Maintenance',
              implementationTimeframe: 'Immediate',
              roi: 1,
              confidenceScore: 96
            },
            {
              id: 'rec-' + Date.now() + '-4',
              title: 'Wind Turbine Vibration Mitigation',
              description: 'Frequency analysis of your wind turbine telemetry data reveals abnormal vibration patterns during specific wind speed ranges (18-24 km/h). These vibrations indicate potential blade imbalance or early-stage bearing wear that could significantly reduce component lifespan if left unaddressed.\n\nOur recommendation includes a comprehensive dynamic balancing procedure using piezoelectric accelerometers to identify precise imbalance locations, followed by corrective weight adjustments on the affected blades. Additionally, the main bearing assembly should be inspected for early signs of wear and lubricated with high-grade synthetic grease rated for your specific environmental conditions.\n\nAddressing these issues now will prevent catastrophic failures, extend equipment lifespan, and maintain optimal energy production efficiency.',
              impact: {
                energyProduction: 6,
                costSavings: 42,
                co2Reduction: 4
              },
              priority: 'High',
              category: 'Maintenance',
              implementationTimeframe: 'Short-term',
              roi: 7,
              confidenceScore: 89
            },
            {
              id: 'rec-' + Date.now() + '-5',
              title: 'Battery Storage Thermal Management Enhancement',
              description: 'Thermal analysis of your battery storage system indicates suboptimal operating temperatures during mid-day charging cycles. Current temperatures are averaging 38°C during peak solar production, which accelerates degradation of lithium cells and reduces overall capacity over time.\n\nWe recommend implementing an advanced thermal management solution using phase-change materials and intelligent ventilation control. This system would maintain optimal cell temperatures between 20-25°C regardless of ambient conditions or charge/discharge rates. Implementation includes installation of temperature monitoring sensors at 8 strategic points, a microcontroller-based ventilation system, and passive cooling materials within the battery enclosure.\n\nThis upgrade would extend battery lifespan by approximately 40% and improve charge efficiency by 8-12%, resulting in significant long-term cost savings and improved system reliability.',
              impact: {
                energyProduction: 0,
                costSavings: 25,
                co2Reduction: 15
              },
              priority: 'Medium',
              category: 'Efficiency',
              implementationTimeframe: 'Short-term',
              roi: 11,
              confidenceScore: 92
            }
          ];
          
          setRecommendations(newRecommendations);
          setSelectedRecommendation(null); // Clear selected recommendation
        } catch (error) {
          console.error("Error generating recommendations:", error);
          // Keep existing recommendations if there's an error
        } finally {
          setIsGenerating(false);
        }
      }, 2000);
    };

    // Function to implement recommendation
    const implementRecommendation = (recId: string) => {
      setImplementing(recId);
      
      // Simulate implementation process
      setTimeout(() => {
        setImplementationStatus(prev => ({
          ...prev,
          [recId]: 'Implementing...'
        }));
        
        // After another delay, mark as done
        setTimeout(() => {
          setImplementationStatus(prev => ({
            ...prev,
            [recId]: 'Implementation complete'
          }));
          setImplementing(null);
        }, 2000);
      }, 1500);
    };

    return (
      <div className="bg-gray-900 rounded-xl shadow-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <BarChart2 size={24} className="text-blue-500 mr-2" />
            <h2 className="text-xl font-bold text-white">AI-Driven Recommendations</h2>
        </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilterPriority(null)} 
              className={`px-3 py-1 text-xs rounded-full transition-colors ${!filterPriority ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterPriority('High')} 
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterPriority === 'High' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              High Priority
            </button>
            <button 
              onClick={() => setFilterPriority('Medium')} 
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterPriority === 'Medium' ? 'bg-amber-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              Medium
            </button>
            <button 
              onClick={() => setFilterPriority('Low')} 
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterPriority === 'Low' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              Low
            </button>
          </div>
        </div>

        {/* Recommendation cards */}
        <div className="space-y-3">
          {displayedRecommendations.map(rec => (
            <div 
              key={rec.id}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-750 ${selectedRecommendation?.id === rec.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedRecommendation(rec)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">{getCategoryIcon(rec.category)}</div>
                  <div>
                    <h3 className="font-medium text-white">{rec.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{rec.description}</p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 text-xs rounded-full ${
                  rec.priority === 'High' ? 'bg-red-500/20 text-red-400' : 
                  rec.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                  'bg-green-500/20 text-green-400'
                }`}>
                  {rec.priority} Priority
              </div>
                  </div>
              
              {selectedRecommendation?.id === rec.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  {/* Detailed description */}
                  <div className="mb-4 text-sm text-gray-300 whitespace-pre-line">
                    {rec.description}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-850 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-1">ROI Timeframe</div>
                      <div className="flex items-center">
                        <Calendar size={16} className="text-blue-400 mr-2" />
                        <span className="text-white">{formatROI(rec.roi)}</span>
                </div>
              </div>
                    
                    <div className="bg-gray-850 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-1">AI Confidence</div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              rec.confidenceScore > 90 ? 'bg-green-500' : 
                              rec.confidenceScore > 75 ? 'bg-blue-500' : 
                              rec.confidenceScore > 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${rec.confidenceScore}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-white">{rec.confidenceScore}%</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-850 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-1">Implementation</div>
                      <div className="flex items-center">
                        <Battery size={16} className="text-green-400 mr-2" />
                        <span className="text-white">{rec.implementationTimeframe}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-850 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-white mb-3">Projected Impact</h4>
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Energy Production</div>
                        <div className="text-xl font-bold text-green-400">+{rec.impact.energyProduction}%</div>
                      </div>
                      <div className="h-10 w-px bg-gray-700"></div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Cost Savings</div>
                        <div className="text-xl font-bold text-blue-400">+{rec.impact.costSavings}%</div>
                      </div>
                      <div className="h-10 w-px bg-gray-700"></div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">CO₂ Reduction</div>
                        <div className="text-xl font-bold text-gray-400">+{rec.impact.co2Reduction}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button className="px-4 py-2 text-sm bg-transparent border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg">
                      Save for Later
                    </button>
                    <button 
                      className={`px-4 py-2 text-sm rounded-lg ${
                        implementing === rec.id 
                          ? 'bg-blue-800 text-gray-300 cursor-wait' 
                          : implementationStatus[rec.id] 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!implementing && !implementationStatus[rec.id]) {
                          implementRecommendation(rec.id);
                        }
                      }}
                      disabled={implementing !== null}
                    >
                      {implementing === rec.id 
                        ? 'Processing...' 
                        : implementationStatus[rec.id] 
                          ? implementationStatus[rec.id] 
                          : 'Implement'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredRecommendations.length > 3 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAllRecommendations(!showAllRecommendations)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {showAllRecommendations ? 'Show Less' : `Show ${filteredRecommendations.length - 3} More Recommendations`}
            </button>
          </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <button 
              className={`flex items-center text-sm ${
                isGenerating 
                  ? 'text-gray-500 cursor-wait' 
                  : 'text-blue-400 hover:text-blue-300'
              }`}
              onClick={isGenerating ? undefined : generateNewRecommendations}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-b-2 border-blue-400 rounded-full mr-2"></div>
                  Generating New Recommendations...
                </>
              ) : (
                <>
                  <Zap size={16} className="mr-1" />
                  Generate New Recommendations
                </>
              )}
            </button>
          </div>
      </div>
    </div>
  );
  };

  const AlertsCard = () => (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">System Alerts</h2>
          <AlertTriangle className="w-6 h-6 text-warning" />
        </div>
        <div className="space-y-4 mt-4">
          {systemAlerts.map((alert, index) => (
            <motion.div
              key={index}
              className="alert shadow-lg"
              whileHover={{ scale: 1.01 }}
            >
              <div>
                <AlertTriangle className={`w-6 h-6 ${
                  alert.type === 'warning' ? 'text-warning' : 'text-info'
                }`} />
                <div>
                  <h3 className="font-bold">{alert.title}</h3>
                  <div className="text-xs">{alert.description}</div>
                </div>
              </div>
              <span className="text-xs opacity-70">{alert.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Optimization': return <TrendingUp className="text-blue-500" />;
      case 'Maintenance': return <AlertTriangle className="text-amber-500" />;
      case 'Expansion': return <ArrowUpRight className="text-green-500" />;
      case 'Efficiency': return <Zap className="text-purple-500" />;
      default: return <BarChartIcon className="text-gray-500" />;
    }
  };

  // Generate impact data for charts
  const getImpactData = (rec: AIRecommendation) => [
    { name: 'Energy', value: rec.impact.energyProduction, fill: '#16a34a' },
    { name: 'Cost', value: rec.impact.costSavings, fill: '#2563eb' },
    { name: 'CO₂', value: rec.impact.co2Reduction, fill: '#64748b' }
  ];

  // Return time to ROI in user-friendly format
  const formatROI = (months: number) => {
    if (months < 1) return 'Less than 1 month';
    if (months === 1) return '1 month';
    if (months < 12) return `${months} months`;
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  };

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Renewable Energy Command Center</h1>
          <p className="text-base-content/70 max-w-2xl mx-auto">
            Advanced monitoring and optimization platform for renewable energy systems.
            Real-time insights and AI-driven recommendations for maximum efficiency.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <TimeRangeSelector />
          <ViewSelector />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <WeatherWidget />
          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-success">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div className="stat-title">Cost Savings Today</div>
              <div className="stat-value text-success text-xl md:text-2xl">₹342.50</div>
            </div>
          </div>
          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-info">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="stat-title">Efficiency Rate</div>
              <div className="stat-value text-info">94.2%</div>
            </div>
          </div>
          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="stat-title">Carbon Offset</div>
              <div className="stat-value text-primary">2.4 tons</div>
            </div>
          </div>
        </div>

        {/* Energy Sources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Solar Power',
              value: '45.2 kW',
              efficiency: '87%',
              status: 'Optimal',
              icon: Sun,
              color: 'text-warning'
            },
            {
              title: 'Wind Power',
              value: '32.8 kW',
              efficiency: '78%',
              status: 'Good',
              icon: Wind,
              color: 'text-info'
            },
            {
              title: 'Battery Storage',
              value: '120 kWh',
              efficiency: '92%',
              status: 'Charging',
              icon: Battery,
              color: 'text-success'
            }
          ].map((source, index) => (
            <EnergySourceCard key={index} source={source} />
          ))}
        </div>

        {/* ENHANCED CHARTS - Updated with vibrant colors and SVG styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Energy Production Chart */}
          <div className="card bg-base-200/80 shadow-xl overflow-hidden border border-primary/10 hover:shadow-2xl transition-all duration-500">
            <div className="card-body p-5">
              <h2 className="card-title text-primary-content mb-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-warning animate-pulse" />
                Energy Production
              </h2>
              
              <div className="relative rounded-lg overflow-hidden" ref={areaChartRef}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-gray-800/90 z-0"
                />
                
                <div className="relative z-10 h-80">
              <AreaChart
                  className="h-80 mt-2"
                data={energyData}
                index="time"
                categories={['solar', 'wind', 'battery']}
                  colors={[colorScheme.solar, colorScheme.wind, colorScheme.battery]}
                    valueFormatter={(value) => `${value} kW`}
                  showLegend={true}
                  showGridLines={false}
                  showAnimation={true}
                  showXAxis={true}
                  showYAxis={true}
                  autoMinValue={true}
                  minValue={0}
                  yAxisWidth={40}
                    onValueChange={(v) => {
                      console.log('Hover value:', v);
                    }}
                  />
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="p-1 rounded-full bg-gray-700/50 text-gray-200 cursor-pointer backdrop-blur-sm"
                      onClick={() => setSelectedEnergyChart('area')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3v18h18" />
                        <path d="M3 15l7-3 5 3 6-6" />
                      </svg>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="p-1 rounded-full bg-gray-700/50 text-gray-200 cursor-pointer backdrop-blur-sm"
                      onClick={() => setSelectedEnergyChart('line')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3v18h18" />
                        <path d="M3 12l5-5 5 5 8-8" />
                      </svg>
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 text-white text-xs font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorScheme.solar }}></div>
                      <span>Max Solar: {energyData.reduce((max, item) => Math.max(max, item.solar), 0)} kW</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorScheme.wind }}></div>
                      <span>Max Wind: {energyData.reduce((max, item) => Math.max(max, item.wind), 0)} kW</span>
                    </div>
                  </motion.div>
                </div>
            </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 dark:from-yellow-900/30 dark:to-yellow-700/20 rounded-xl p-3 shadow-lg border border-yellow-500/20"
                >
                  <div className="relative mb-2">
                    <Sun className="w-8 h-8 text-yellow-500 relative z-10" />
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full filter blur-md animate-pulse"></div>
                  </div>
                  <span className="text-xs opacity-70">Solar</span>
                  <motion.span 
                    className="text-xl font-bold text-yellow-600 dark:text-yellow-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    {Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / energyData.length)}kW
                  </motion.span>
                  <div className="w-full h-1 bg-gray-200/30 dark:bg-gray-700/30 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
          </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-900/30 dark:to-blue-700/20 rounded-xl p-3 shadow-lg border border-blue-500/20"
                >
                  <div className="relative mb-2">
                    <Wind className="w-8 h-8 text-blue-500 relative z-10" />
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full filter blur-md animate-pulse"></div>
                  </div>
                  <span className="text-xs opacity-70">Wind</span>
                  <motion.span 
                    className="text-xl font-bold text-blue-600 dark:text-blue-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / energyData.length)}kW
                  </motion.span>
                  <div className="w-full h-1 bg-gray-200/30 dark:bg-gray-700/30 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-sky-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-900/30 dark:to-green-700/20 rounded-xl p-3 shadow-lg border border-green-500/20"
                >
                  <div className="relative mb-2">
                    <Battery className="w-8 h-8 text-green-500 relative z-10" />
                    <div className="absolute inset-0 bg-green-500/20 rounded-full filter blur-md animate-pulse"></div>
                  </div>
                  <span className="text-xs opacity-70">Battery</span>
                  <motion.span 
                    className="text-xl font-bold text-green-600 dark:text-green-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / energyData.length)}kW
                  </motion.span>
                  <div className="w-full h-1 bg-gray-200/30 dark:bg-gray-700/30 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </motion.div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-4 p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700/50 text-sm text-gray-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium">Current Peak Time:</span>
                  </div>
                  <span className="font-bold text-emerald-400">
                    {energyData.reduce((highest, item, index, arr) => {
                      const total = item.solar + item.wind + item.battery;
                      return total > (arr[highest]?.solar + arr[highest]?.wind + arr[highest]?.battery) ? index : highest;
                    }, 0) || 0}:00
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">Total Energy Today:</span>
              </div>
                  <span className="font-bold text-blue-400">
                    {Math.round(energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) / 24)} kWh
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Enhanced Energy Distribution Chart */}
          <div className="card bg-base-200/80 shadow-xl overflow-hidden border border-secondary/10">
            <div className="card-body p-5">
              <h2 className="card-title text-secondary-content mb-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-secondary" />
                Energy Distribution
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-72 w-72" ref={donutChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="2" floodOpacity="0.3" />
                          </filter>
                          <linearGradient id="solarGradient2" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={`${colorScheme.solar}CC`} />
                            <stop offset="100%" stopColor={`${colorScheme.solar}99`} />
                          </linearGradient>
                          <linearGradient id="windGradient2" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={`${colorScheme.wind}CC`} />
                            <stop offset="100%" stopColor={`${colorScheme.wind}99`} />
                          </linearGradient>
                          <linearGradient id="batteryGradient2" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={`${colorScheme.battery}CC`} />
                            <stop offset="100%" stopColor={`${colorScheme.battery}99`} />
                          </linearGradient>
                        </defs>
                        <Pie
                data={[
                            { 
                              name: 'Solar', 
                              value: Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / energyData.length),
                              icon: <Sun size={16} style={{verticalAlign: 'middle', marginRight: '5px'}} />
                            },
                            { 
                              name: 'Wind', 
                              value: Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / energyData.length),
                              icon: <Wind size={16} style={{verticalAlign: 'middle', marginRight: '5px'}} />
                            },
                            { 
                              name: 'Battery', 
                              value: Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / energyData.length),
                              icon: <Battery size={16} style={{verticalAlign: 'middle', marginRight: '5px'}} />
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                          animationDuration={1000}
                          animationBegin={200}
                          label={({name, value, percent}) => {
                            return `${(percent * 100).toFixed(0)}%`;
                          }}
                          labelLine={false}
                          isAnimationActive={true}
                          filter="url(#shadow)"
                        >
                          <Cell key="solar" fill="url(#solarGradient2)" stroke={colorScheme.solar} strokeWidth={1.5} style={{filter: 'drop-shadow(0px 0px 6px rgba(255, 184, 0, 0.3))'}} />
                          <Cell key="wind" fill="url(#windGradient2)" stroke={colorScheme.wind} strokeWidth={1.5} style={{filter: 'drop-shadow(0px 0px 6px rgba(0, 136, 255, 0.3))'}} />
                          <Cell key="battery" fill="url(#batteryGradient2)" stroke={colorScheme.battery} strokeWidth={1.5} style={{filter: 'drop-shadow(0px 0px 6px rgba(0, 208, 132, 0.3))'}} />
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [value, 'Power Output']}
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            padding: '8px 12px',
                            backdropFilter: 'blur(8px)'
                          }}
                          itemStyle={{
                            color: 'rgba(255, 255, 255, 0.8)'
                          }}
                          labelStyle={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          align="center"
                          layout="horizontal"
                          iconType="circle"
                          iconSize={10}
                          wrapperStyle={{
                            paddingTop: '10px'
                          }}
                          payload={[
                            { 
                              value: 'Solar', 
                              type: 'circle', 
                              color: colorScheme.solar,
                              id: 'solar'
                            },
                            { 
                              value: 'Wind', 
                              type: 'circle', 
                              color: colorScheme.wind,
                              id: 'wind'
                            },
                            { 
                              value: 'Battery', 
                              type: 'circle', 
                              color: colorScheme.battery,
                              id: 'battery'
                            }
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{zIndex: 1}}>
                      <div className="flex flex-col items-center bg-base-200/60 rounded-full w-20 h-20 justify-center shadow-inner" style={{
                        backdropFilter: 'blur(3px)',
                        position: 'absolute',
                        top: '43%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}>
                        <Zap className="w-6 h-6 text-primary mb-1" />
                        <span className="text-xs font-medium text-center">Total Output</span>
                        <span className="text-xl font-bold">
                          {Math.round(energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) / energyData.length)}kW
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Energy source indicators with stats and trends */}
                  <div className="grid grid-cols-3 gap-2 mt-6 w-full">
                    <div className="flex flex-col p-3 rounded-lg" style={{
                      background: `linear-gradient(135deg, ${colorScheme.solar}11, ${colorScheme.solar}22)`,
                      borderLeft: `3px solid ${colorScheme.solar}`
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Sun className="w-5 h-5" style={{color: colorScheme.solar}} />
                        <span className="text-sm font-semibold">Solar</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold" style={{color: colorScheme.solar}}>
                          {Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / energyData.length)}kW
                        </span>
                        <div className="flex items-center text-xs">
                          <span>{Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%</span>
                          <TrendingUp className="w-3 h-3 ml-1 text-success" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-3 rounded-lg" style={{
                      background: `linear-gradient(135deg, ${colorScheme.wind}11, ${colorScheme.wind}22)`,
                      borderLeft: `3px solid ${colorScheme.wind}`
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="w-5 h-5" style={{color: colorScheme.wind}} />
                        <span className="text-sm font-semibold">Wind</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold" style={{color: colorScheme.wind}}>
                          {Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / energyData.length)}kW
                        </span>
                        <div className="flex items-center text-xs">
                          <span>{Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%</span>
                          <TrendingUp className="w-3 h-3 ml-1 text-success" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-3 rounded-lg" style={{
                      background: `linear-gradient(135deg, ${colorScheme.battery}11, ${colorScheme.battery}22)`,
                      borderLeft: `3px solid ${colorScheme.battery}`
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Battery className="w-5 h-5" style={{color: colorScheme.battery}} />
                        <span className="text-sm font-semibold">Battery</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold" style={{color: colorScheme.battery}}>
                          {Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / energyData.length)}kW
                        </span>
                        <div className="flex items-center text-xs">
                          <span>{Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%</span>
                          <TrendingUp className="w-3 h-3 ml-1 text-success" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center">
                        <Sun className="w-4 h-4 mr-2" style={{color: colorScheme.solar}} /> 
                        Solar Power
                      </span>
                      <span style={{color: colorScheme.solar}} className="font-bold">
                        {Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / energyData.length)}kW
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%`,
                          background: `linear-gradient(to right, ${colorScheme.solar}99, ${colorScheme.solar})`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1 flex justify-between">
                      <span>Contribution</span>
                      <span>{Math.round(energyData.reduce((sum, item) => sum + item.solar, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center">
                        <Wind className="w-4 h-4 mr-2" style={{color: colorScheme.wind}} /> 
                        Wind Power
                      </span>
                      <span style={{color: colorScheme.wind}} className="font-bold">
                        {Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / energyData.length)}kW
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%`,
                          background: `linear-gradient(to right, ${colorScheme.wind}99, ${colorScheme.wind})`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1 flex justify-between">
                      <span>Contribution</span>
                      <span>{Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center">
                        <Battery className="w-4 h-4 mr-2" style={{color: colorScheme.battery}} /> 
                        Battery Power
                      </span>
                      <span style={{color: colorScheme.battery}} className="font-bold">
                        {Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / energyData.length)}kW
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%`,
                          background: `linear-gradient(to right, ${colorScheme.battery}99, ${colorScheme.battery})`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1 flex justify-between">
                      <span>Contribution</span>
                      <span>{Math.round(energyData.reduce((sum, item) => sum + item.battery, 0) / 
                          energyData.reduce((sum, item) => sum + item.solar + item.wind + item.battery, 0) * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-base-300/50 rounded-lg border-l-4 border-secondary">
                    <h4 className="text-sm font-semibold mb-2">Distribution Summary</h4>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: colorScheme.solar}}></span>
                        Solar peaks at {energyData.reduce((highest, item) => Math.max(highest, item.solar), 0)}kW (midday)
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: colorScheme.wind}}></span>
                        Wind produces {Math.round(energyData.reduce((sum, item) => sum + item.wind, 0) / 24)}kW avg daily
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: colorScheme.battery}}></span>
                        Battery provides 22% of peak demand
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <AIRecommendationsPanel />

        {/* Alerts */}
        <AlertsCard />

        {/* Enhanced Energy Forecast */}
        <div className="card bg-base-200/80 shadow-xl overflow-hidden border border-primary/10">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary" />
                Energy Forecast & Planning
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-10 bg-primary rounded-full"></span>
                  24-Hour Consumption Forecast
                </h3>
                
                {/* Custom chart implementation with explicit colors */}
                <div className="h-64 relative" ref={barChartRef}>
                  <div className="w-full h-full p-4 overflow-hidden">
                    <svg width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="consumptionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={`${colorScheme.consumption}`} />
                          <stop offset="100%" stopColor={`${colorScheme.consumption}88`} />
                        </linearGradient>
                        <linearGradient id="optimizedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={`${colorScheme.optimized}`} />
                          <stop offset="100%" stopColor={`${colorScheme.optimized}88`} />
                        </linearGradient>
                        <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.2" />
                        </filter>
                      </defs>
                      
                      {/* X Axis */}
                      <line x1="50" y1="350" x2="950" y2="350" stroke="#888" strokeWidth="1"/>
                      
                      {/* Y Axis */}
                      <line x1="50" y1="50" x2="50" y2="350" stroke="#888" strokeWidth="1"/>
                      
                      {/* Render actual data points */}
                      <g className="consumption-bars">
                        {energyData.map((item, index) => {
                          const x = 50 + index * (900 / energyData.length);
                          const barWidth = 900 / energyData.length * 0.4;
                          const height = (item.consumption / 100) * 300;
                          return (
                            <rect 
                              key={`consumption-${index}`}
                              x={x} 
                              y={350 - height} 
                              width={barWidth} 
                              height={height}
                              fill="url(#consumptionGradient)"
                              stroke={colorScheme.consumption}
                              strokeWidth="1"
                              rx="2"
                              filter="url(#barShadow)"
                            />
                          );
                        })}
                      </g>
                      
                      <g className="optimized-bars">
                        {energyData.map((item, index) => {
                          const x = 50 + index * (900 / energyData.length) + (900 / energyData.length * 0.4) + 2;
                          const barWidth = 900 / energyData.length * 0.4;
                          const height = (item.optimizedUsage / 100) * 300;
                          return (
                            <rect 
                              key={`optimized-${index}`}
                              x={x} 
                              y={350 - height} 
                              width={barWidth} 
                              height={height}
                              fill="url(#optimizedGradient)"
                              stroke={colorScheme.optimized}
                              strokeWidth="1"
                              rx="2"
                              filter="url(#barShadow)"
                            />
                          );
                        })}
                      </g>
                      
                      {/* X Axis Labels */}
                      {energyData.filter((_, i) => i % 4 === 0).map((item, idx) => (
                        <text 
                          key={`xlabel-${idx}`}
                          x={50 + idx * 4 * (900 / energyData.length) + (900 / energyData.length / 2)}
                          y="370" 
                          textAnchor="middle"
                          fill="#888"
                          fontSize="12"
                        >
                          {item.time}
                        </text>
                      ))}
                      
                      {/* Y Axis Labels */}
                      {[0, 25, 50, 75, 100].map((value, idx) => (
                        <text 
                          key={`ylabel-${idx}`}
                          x="40" 
                          y={350 - (value / 100) * 300}
                          textAnchor="end"
                          fill="#888"
                          fontSize="12"
                          dominantBaseline="middle"
                        >
                          {value}kW
                        </text>
                      ))}
                      
                      {/* Legend */}
                      <rect x="750" y="50" width="15" height="15" fill="url(#consumptionGradient)" stroke={colorScheme.consumption} />
                      <text x="775" y="62" fill="#888" fontSize="12" dominantBaseline="middle">Predicted</text>
                      
                      <rect x="750" y="75" width="15" height="15" fill="url(#optimizedGradient)" stroke={colorScheme.optimized} />
                      <text x="775" y="87" fill="#888" fontSize="12" dominantBaseline="middle">Optimized</text>
                    </svg>
                  </div>
                </div>
                
                <div className="flex justify-center items-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: colorScheme.consumption}}></div>
                    <span className="text-xs">Predicted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: colorScheme.optimized}}></div>
                    <span className="text-xs">Optimized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Savings:</span>
                    <span className="text-xs font-bold" style={{color: colorScheme.battery}}>
                      {Math.round((energyData.reduce((sum, item) => sum + item.consumption, 0) - 
                      energyData.reduce((sum, item) => sum + item.optimizedUsage, 0)) / 
                      energyData.length)}kW avg
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                  <div className="text-sm font-medium mb-2">Forecast Analysis</div>
                  <p className="text-xs">
                    Our AI predicts consumption peaks at {Math.max(...energyData.map(d => d.consumption))}kW during 
                    peak hours. Implementing smart optimization can reduce this by up to 20%, resulting in significant 
                    cost savings and reduced grid load.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-10 bg-secondary rounded-full"></span>
                  Optimization Opportunities
                </h3>
                
                {[
                  {
                    time: 'Peak Hours (10 AM - 2 PM)',
                    action: 'Maximize solar collection, store excess in batteries',
                    impact: '+25% efficiency',
                    icon: Sun,
                    color: 'text-yellow-500',
                    barColor: colorScheme.solar,
                    textColor: 'text-yellow-600 dark:text-yellow-400'
                  },
                  {
                    time: 'Evening Transition (4 PM - 8 PM)',
                    action: 'Switch to wind power, conserve battery reserves',
                    impact: '+18% uptime',
                    icon: Wind,
                    color: 'text-blue-500',
                    barColor: colorScheme.wind,
                    textColor: 'text-blue-600 dark:text-blue-400'
                  },
                  {
                    time: 'Night Operations (9 PM - 5 AM)',
                    action: 'Rely on battery, slow charging at low rates',
                    impact: '+15% discharge',
                    icon: Battery,
                    color: 'text-green-500',
                    barColor: colorScheme.battery,
                    textColor: 'text-green-600 dark:text-green-400'
                  }
                ].map((opportunity, index) => (
                  <motion.div
                    key={index}
                    className="card overflow-hidden backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0" style={{
                      background: `linear-gradient(to right, ${opportunity.barColor}33, ${opportunity.barColor}22)`
                    }}></div>
                    <div className="card-body p-4 relative">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium flex items-center gap-2 ${opportunity.textColor}`}>
                          <opportunity.icon className="w-4 h-4" />
                          {opportunity.time}
                        </h4>
                        <span className="badge text-white" style={{
                          background: `linear-gradient(to right, ${colorScheme.optimized}, ${colorScheme.predicted})`
                        }}>
                          {opportunity.impact}
                        </span>
                      </div>
                      <p className="text-base-content/70 text-sm mt-2">{opportunity.action}</p>
                      
                      <div className="flex justify-between text-xs mt-4">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" style={{color: colorScheme.optimized}} />
                          <span>Peak Reduction</span>
                        </div>
                        <div className="font-medium" style={{color: colorScheme.optimized}}>
                          {index === 0 ? '32 kW' : index === 1 ? '25 kW' : '18 kW'}
                        </div>
                      </div>
                      
                      <div className="w-full bg-base-300 h-1.5 mt-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{
                            width: index === 0 ? '75%' : index === 1 ? '60%' : '45%',
                            background: `linear-gradient(to right, ${colorScheme.optimized}88, ${colorScheme.optimized})`
                          }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <div className="card p-4 mt-2 relative overflow-hidden bg-primary/5">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
                  <h4 className="text-sm font-medium flex items-center gap-2 relative">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Long-term Savings Projection
                  </h4>
                  
                  <div className="mt-3 h-20 relative">
                    <div className="absolute inset-0 flex items-end">
                      {(new Array(10).fill(0)).map((_, i) => {
                        const hue = Math.floor(Math.random() * 30 + 20);
                        const saturation = Math.floor(Math.random() * 20 + 80);
                        const lightness = Math.floor(Math.random() * 15 + 45);
                        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                        const alphaColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.2)`;
                        
                        return (
                          <div 
                            key={i} 
                            className="flex-1 mx-px rounded-t-md"
                            style={{ 
                              height: `${20 + Math.sin(i/3) * 10 + Math.random() * 20}%`,
                              background: `linear-gradient(to bottom, ${color}, ${alphaColor})`,
                              boxShadow: '0 0 3px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s ease',
                            }}
                          ></div>
                        );
                      })}
                    </div>
                    
                    <div className="absolute inset-0 flex items-end" style={{zIndex: 2}}>
                      {(new Array(10).fill(0)).map((_, i) => {
                        const hue = Math.floor(Math.random() * 30 + 190);
                        const saturation = Math.floor(Math.random() * 20 + 75);
                        const lightness = Math.floor(Math.random() * 15 + 40);
                        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                        const alphaColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.2)`;
                        
                        return (
                          <div 
                            key={i} 
                            className="flex-1 mx-px rounded-t-md"
                            style={{ 
                              height: `${15 + Math.sin(i/3) * 8 + Math.random() * 10}%`,
                              background: `linear-gradient(to bottom, ${color}, ${alphaColor})`,
                              boxShadow: '0 0 3px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s ease',
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center gap-2 mt-4">
                    <div className="text-xs flex flex-col">
                      <span className="opacity-70">Monthly Savings</span>
                      <span className="text-base font-bold text-emerald-500">₹10,275</span>
                    </div>
                    <div className="text-xs flex flex-col">
                      <span className="opacity-70">Yearly Impact</span>
                      <span className="text-base font-bold text-emerald-500">₹123,300</span>
                    </div>
                    <div className="text-xs flex flex-col">
                      <span className="opacity-70">CO₂ Reduction</span>
                      <span className="text-base font-bold text-emerald-500">28.4 tons</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn btn-primary btn-lg gap-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Detailed Analysis Report
              </>
            )}
          </button>
        </div>
      </motion.div>
      
      {/* Add global styles for Recharts elements */}
      <style>{`
        .recharts-surface {
          transition: all 0.3s ease;
          margin: 0 auto;
        }
        
        .recharts-layer.recharts-area-dots,
        .recharts-layer.recharts-bar-rectangles {
          filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.15));
        }
        
        .recharts-curve.recharts-area-area {
          filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.2));
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        
        .recharts-curve.recharts-area-area:hover {
          opacity: 0.9;
        }
        
        /* Solar area styling */
        .recharts-curve.recharts-area-area.solar-area {
          fill: url(#solarGradient) !important;
          filter: drop-shadow(0 4px 6px rgba(255, 184, 0, 0.3));
        }
        
        /* Wind area styling */
        .recharts-curve.recharts-area-area.wind-area {
          fill: url(#windGradient) !important;
          filter: drop-shadow(0 4px 6px rgba(0, 136, 255, 0.3));
        }
        
        /* Battery area styling */
        .recharts-curve.recharts-area-area.battery-area {
          fill: url(#batteryGradient) !important;
          filter: drop-shadow(0 4px 6px rgba(0, 208, 132, 0.3));
        }
        
        /* Enhanced path styling */
        .recharts-curve.solar-stroke {
          stroke: ${colorScheme.solar} !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 2px 4px rgba(255, 184, 0, 0.5));
        }
        
        .recharts-curve.wind-stroke {
          stroke: ${colorScheme.wind} !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 2px 4px rgba(0, 136, 255, 0.5));
        }
        
        .recharts-curve.battery-stroke {
          stroke: ${colorScheme.battery} !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 2px 4px rgba(0, 208, 132, 0.5));
        }
        
        /* Add chart animations */
        .recharts-layer {
          transition: transform 0.3s ease;
        }
        
        .recharts-layer:hover {
          transform: translateY(-2px);
        }
        
        .recharts-tooltip-wrapper {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
          transition: all 0.2s ease;
        }
        
        .recharts-default-tooltip {
          background-color: rgba(17, 24, 39, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          backdrop-filter: blur(8px) !important;
        }
        
        /* Enhance the axis and grid */
        .recharts-cartesian-axis-line {
          stroke: rgba(255, 255, 255, 0.1) !important;
        }
        
        .recharts-cartesian-axis-tick-line {
          stroke: rgba(255, 255, 255, 0.1) !important;
        }
        
        .recharts-cartesian-axis-tick-value {
          fill: rgba(255, 255, 255, 0.5) !important;
          font-size: 11px !important;
        }
        
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line {
          stroke: rgba(255, 255, 255, 0.05) !important;
          stroke-dasharray: 2 4 !important;
        }
        
        /* Add glow effects to chart elements */
        @keyframes glow {
          0% { filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3)); }
          50% { filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)); }
          100% { filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3)); }
        }
        
        .recharts-active-dot {
          animation: glow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default RenewableEnergy;