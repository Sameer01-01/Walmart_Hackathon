import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Wind, Sun, Battery, ChevronDown, Globe, Shield, BarChart, ArrowUpRight, Play, Pause, CheckCircle, Server, Network, Cpu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeSection, setActiveSection] = useState('hero');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef(null);
  const cursorAnimControls = useAnimation();

  // Handle mouse movement for interactive background and custom cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      setMousePosition({
        x: (clientX / window.innerWidth) * 2 - 1,
        y: (clientY / window.innerHeight) * 2 - 1
      });
      
      // Update custom cursor position with a slight delay for smooth follow effect
      if (cursorRef.current) {
        cursorAnimControls.start({
          x: clientX,
          y: clientY,
          transition: { type: "spring", mass: 0.1, stiffness: 800, damping: 30 }
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorAnimControls]);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);

      const sections = ['hero', 'features', 'stats', 'demo'];
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            setActiveSection(section);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-play slides
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const slides = [
    {
      title: "Smart Energy Management",
      description: "AI-powered solutions for optimal energy distribution",
      image: "https://media.licdn.com/dms/image/v2/D5612AQG9SeERllOvGQ/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1728466312224?e=2147483647&v=beta&t=axD0vjF7eb30YYg6jvZQfbVqj1nPERXTORAOEXxMir0"
    },
    {
      title: "Renewable Integration",
      description: "Seamless integration with renewable energy sources",
      image: "https://media.licdn.com/dms/image/v2/D5612AQFgOFws8v7Lww/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1714296316575?e=2147483647&v=beta&t=rv6Lq-Kl3lU9nuiqpaBQ-Ut5KxkBhKM_P_h2aTs7ing"
    },
    {
      title: "Real-time Analytics",
      description: "Advanced analytics for data-driven decisions",
      image: "https://media.licdn.com/dms/image/D4D12AQG59y0dv7PkxQ/article-cover_image-shrink_600_2000/0/1677558251980?e=2147483647&v=beta&t=WLTai82nUfJS1sJXufg1AvgSBhw_G1nuY-gFYmi2VxY"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Monitor energy consumption across your telecom infrastructure in real-time',
      color: 'green',
      stats: { value: '99.9%', label: 'Uptime' }
    },
    {
      icon: Wind,
      title: 'Renewable Integration',
      description: 'Seamlessly integrate renewable energy sources into your power grid',
      color: 'blue',
      stats: { value: '40%', label: 'Cost Reduction' }
    },
    {
      icon: Sun,
      title: 'Smart Optimization',
      description: 'AI-powered optimization for maximum energy efficiency',
      color: 'yellow',
      stats: { value: '50%', label: 'Efficiency Gain' }
    },
    {
      icon: Battery,
      title: 'Energy Trading',
      description: 'Trade excess energy credits in our marketplace',
      color: 'purple',
      stats: { value: '24/7', label: 'Trading' }
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Worldwide network of energy management solutions',
      color: 'indigo',
      stats: { value: '150+', label: 'Countries' }
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Enterprise-grade security for your energy infrastructure',
      color: 'red',
      stats: { value: '256-bit', label: 'Encryption' }
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Enhanced interactive background with advanced visual effects
  const BackgroundElements = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-black via-gray-900 to-slate-900">
      {/* Animated noise texture overlay */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
      
      {/* Geometric network lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path 
          d="M0,50 Q25,30 50,50 T100,50" 
          stroke="rgba(74, 222, 128, 0.15)" 
          strokeWidth="0.2" 
          fill="none"
          animate={{
            d: [
              "M0,50 Q25,30 50,50 T100,50",
              "M0,50 Q25,70 50,50 T100,50",
              "M0,50 Q25,30 50,50 T100,50",
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path 
          d="M0,40 Q40,60 80,40 T100,40" 
          stroke="rgba(59, 130, 246, 0.15)" 
          strokeWidth="0.2" 
          fill="none"
          animate={{
            d: [
              "M0,40 Q40,60 80,40 T100,40",
              "M0,40 Q40,20 80,40 T100,40",
              "M0,40 Q40,60 80,40 T100,40",
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path 
          d="M0,60 Q60,40 30,60 T100,60" 
          stroke="rgba(139, 92, 246, 0.15)" 
          strokeWidth="0.2" 
          fill="none"
          animate={{
            d: [
              "M0,60 Q60,40 30,60 T100,60",
              "M0,60 Q60,80 30,60 T100,60",
              "M0,60 Q60,40 30,60 T100,60",
            ]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* 3D animated orbs with light effects */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 blur-[100px]"
        animate={{
          x: mousePosition.x * 20,
          y: mousePosition.y * 20,
          scale: [1, 1.05, 1],
          rotateZ: [0, 5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        style={{
          left: '10%',
          top: '20%',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      />
      
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-[80px]"
        animate={{
          x: mousePosition.x * -15,
          y: mousePosition.y * -15,
          scale: [1.1, 1, 1.1],
          rotateZ: [0, -5, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        style={{
          right: '10%',
          bottom: '20%',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* 3D glow effect */}
      <motion.div
        className="absolute w-full h-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(74, 222, 128, 0.03) 0%, transparent 70%)',
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Advanced grid with 3D perspective */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"
        style={{
          perspective: '1000px',
          transform: `rotateX(${mousePosition.y * 2}deg) rotateY(${mousePosition.x * 2}deg)`,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* Horizontal light beam with parallax effect */}
      <motion.div
        className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
        style={{ top: '50%' }}
        animate={{ 
          y: [0, 30, 0, -30, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Modern floating particles with glow effect */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at center, ${
              i % 3 === 0 ? 'rgba(74, 222, 128, 0.8)' : 
              i % 3 === 1 ? 'rgba(59, 130, 246, 0.8)' : 
              'rgba(139, 92, 246, 0.8)'
            }, transparent)`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            boxShadow: `0 0 10px 2px ${
              i % 3 === 0 ? 'rgba(74, 222, 128, 0.3)' : 
              i % 3 === 1 ? 'rgba(59, 130, 246, 0.3)' : 
              'rgba(139, 92, 246, 0.3)'
            }`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      {/* Digital circuit lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.path
            key={i}
            d={`M${Math.random() * 20},${10 + i * 15} H${80 + Math.random() * 20}`}
            stroke={
              i % 3 === 0 ? 'rgba(74, 222, 128, 0.6)' : 
              i % 3 === 1 ? 'rgba(59, 130, 246, 0.6)' : 
              'rgba(139, 92, 246, 0.6)'
            }
            strokeWidth="0.2"
            strokeDasharray="3,3"
            fill="none"
            animate={{
              pathLength: [0, 1],
              pathOffset: [0, 1],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );

  // Custom cursor
  const CustomCursor = () => (
    <motion.div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
      style={{ x: 0, y: 0 }}
      animate={cursorAnimControls}
    >
      <motion.div
        className="w-6 h-6 rounded-full border border-white"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ translateX: "-50%", translateY: "-50%" }}
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen text-white relative">
      <BackgroundElements />
      <CustomCursor />

      {/* Navigation Progress */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 z-50"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navigation Dots */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 space-y-4 z-40">
        {['hero', 'features', 'stats', 'demo'].map((section) => (
          <motion.div
            key={section}
            className={`w-3 h-3 rounded-full cursor-pointer backdrop-blur-sm ${
              activeSection === section ? 'bg-green-500' : 'bg-gray-500/50'
            }`}
            whileHover={{ scale: 1.5 }}
            onClick={() => scrollToSection(section)}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 space-y-8 px-4"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold"
            animate={{
              backgroundPosition: ['0%', '100%'],
              filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
            }}
            transition={{
              backgroundPosition: { duration: 5, repeat: Infinity, repeatType: 'reverse' },
              filter: { duration: 2, repeat: Infinity }
            }}
            style={{
              backgroundImage: 'linear-gradient(to right, #4ade80, #3b82f6, #8b5cf6)',
              backgroundSize: '200%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 40px rgba(74, 222, 128, 0.3)'
            }}
          >
            SusTainLabs
          </motion.h1>

          <motion.p
            className="text-xl md:text-3xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Revolutionizing telecom energy consumption through AI-powered optimization
          </motion.p>

          <div className="flex gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-focus rounded-full font-semibold
                         hover:from-primary-focus hover:to-primary transition-all duration-300
                         flex items-center gap-2"
              >
                Get Started
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gray-800/80 backdrop-blur-sm rounded-full font-semibold
                       hover:bg-gray-700/80 transition-colors flex items-center gap-2"
              onClick={() => scrollToSection('demo')}
            >
              Watch Demo
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
            onClick={() => scrollToSection('features')}
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Powerful Features
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, translateY: -5 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700
                       hover:border-green-500/50 cursor-pointer relative overflow-hidden"
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/30 to-transparent
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <feature.icon className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 mb-4">{feature.description}</p>

              <AnimatePresence>
                {hoveredFeature === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-400">{feature.stats.value}</span>
                      <span className="text-gray-400">{feature.stats.label}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
            {[
              { value: '500+', label: 'Telecom Partners', icon: Globe },
              { value: '30%', label: 'Average Energy Savings', icon: Battery },
              { value: '1M+', label: 'Tons of CO₂ Reduced', icon: Wind }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', duration: 0.5, delay: index * 0.2 }}
                className="p-6 rounded-xl bg-gray-700/30 backdrop-blur-lg border border-gray-600 hover:border-green-500/50"
              >
                <stat.icon className="w-8 h-8 text-green-400 mx-auto mb-4" />
                <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden backdrop-blur-sm bg-gray-800/30">
            <div className="absolute top-4 right-4 z-20 space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-video bg-gray-800 rounded-2xl overflow-hidden"
              >
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-8"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-2xl font-bold mb-2">{slides[currentSlide].title}</h3>
                  <p className="text-gray-300">{slides[currentSlide].description}</p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                  whileHover={{ scale: 1.5 }}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center px-4 relative z-10"
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Energy Management?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of telecom companies already optimizing their energy consumption with SusTainLabs.
          </p>
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="mx-auto"
          >
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary-focus rounded-full font-semibold
                       hover:from-primary-focus hover:to-primary transition-all duration-300
                       flex items-center gap-2"
            >
              Get Started Now
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Background decoration */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(74, 222, 128, 0.1) 0%, transparent 50%)',
            backgroundSize: '100% 100%',
          }}
        />
      </section>
    </div>
  );
};

export default LandingPage;