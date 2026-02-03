import { useState, useEffect } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Tính toán parallax transform cho mỗi layer
  const parallaxStyle1 = {
    transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
  };

  const parallaxStyle2 = {
    transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px) rotate(${mousePosition.x * 3}deg)`,
  };

  const parallaxStyle3 = {
    transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px) rotate(${mousePosition.y * -3}deg)`,
  };

  const parallaxStyle4 = {
    transform: `translate(${mousePosition.x * -18}px, ${mousePosition.y * -18}px)`,
  };

  const parallaxGrid = {
    transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 8}px)`,
  };

  const parallaxGradient = {
    transform: `translate(${mousePosition.x * 3}px, ${mousePosition.y * 3}px)`,
  };

  return (
    <div className="animated-background">
      {/* Base gradient với parallax wrapper */}
      <div className="parallax-wrapper" style={parallaxGradient}>
        <div className="bg-base-gradient"></div>
      </div>
      
      {/* Animated stripe layers với parallax wrapper */}
      <div className="parallax-wrapper" style={parallaxStyle1}>
        <div className="bg-stripes bg-stripes-1"></div>
      </div>
      
      <div className="parallax-wrapper" style={parallaxStyle2}>
        <div className="bg-stripes bg-stripes-2"></div>
      </div>
      
      <div className="parallax-wrapper" style={parallaxStyle3}>
        <div className="bg-stripes bg-stripes-3"></div>
      </div>
      
      <div className="parallax-wrapper" style={parallaxStyle4}>
        <div className="bg-stripes bg-stripes-4"></div>
      </div>
      
      {/* Subtle grid overlay với parallax wrapper */}
      <div className="parallax-wrapper" style={parallaxGrid}>
        <div className="bg-grid"></div>
      </div>
    </div>
  );
};

export default AnimatedBackground;
