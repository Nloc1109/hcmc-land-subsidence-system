import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="animated-background">
      {/* Base gradient */}
      <div className="bg-base-gradient"></div>
      
      {/* Animated stripe layers - different angles and speeds */}
      <div className="bg-stripes bg-stripes-1"></div>
      <div className="bg-stripes bg-stripes-2"></div>
      <div className="bg-stripes bg-stripes-3"></div>
      <div className="bg-stripes bg-stripes-4"></div>
      
      {/* Subtle grid overlay */}
      <div className="bg-grid"></div>
    </div>
  );
};

export default AnimatedBackground;
