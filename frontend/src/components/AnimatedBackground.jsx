import { useMemo } from 'react';
import './AnimatedBackground.css';

const SNOWFLAKE_COUNT = 90;

const AnimatedBackground = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 6,
      duration: 28 + Math.random() * 24,
      delay: Math.random() * -30,
      opacity: 0.75 + Math.random() * 0.25,
      drift: (Math.random() - 0.5) * 50,
    }));
  }, []);

  return (
    <div className="animated-background snowfall">
      <div className="snowfall-base" />
      <div className="snowfall-flakes" aria-hidden="true">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.left}%`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
              '--snow-drift': `${flake.drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
