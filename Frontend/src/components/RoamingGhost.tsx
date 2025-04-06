import React, { useEffect, useRef, useState } from 'react';
import './RoamingGhost.css';
import { themeService } from '../services/ThemeService';

interface RoamingGhostProps {
  pageId?: string;
}

const RoamingGhost: React.FC<RoamingGhostProps> = ({ pageId = 'default' }) => {
  const ghostRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState({ x: 1, y: 1 });
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());

  // Listen for theme changes
  useEffect(() => {
    const cleanup = themeService.onThemeChange((isDark) => {
      setDarkMode(isDark);
    });
    return cleanup;
  }, []);

  // Initialize ghost position randomly
  useEffect(() => {
    // Start at a random position
    const randomX = Math.floor(Math.random() * 70) + 5; // 5-75% of screen width
    const randomY = Math.floor(Math.random() * 60) + 5; // 5-65% of screen height
    setPosition({ x: randomX, y: randomY });
    
    // Random starting direction
    setDirection({
      x: Math.random() > 0.5 ? 0.5 : -0.5,
      y: Math.random() > 0.5 ? 0.5 : -0.5
    });

    // Set ghost speed based on page
    const ghostSpeed = 12000;
    
    // Start roaming
    const intervalId = setInterval(() => {
      roamAround();
    }, ghostSpeed);
    
    return () => clearInterval(intervalId);
  }, [pageId]);
  
  const roamAround = () => {
    setPosition(prevPos => {
      let newPosX = prevPos.x + (Math.random() * 20 - 10);
      let newPosY = prevPos.y + (Math.random() * 20 - 10);
      
      // Keep ghost on screen
      newPosX = Math.max(5, Math.min(newPosX, 90));
      newPosY = Math.max(5, Math.min(newPosY, 90));
      
      return { x: newPosX, y: newPosY };
    });
    
    // Occasionally change direction
    if (Math.random() > 0.7) {
      setDirection(prev => ({
        x: Math.random() > 0.5 ? 0.5 : -0.5,
        y: Math.random() > 0.5 ? 0.5 : -0.5
      }));
    }
  };

  // Add surprise peek-a-boo effect
  const handleGhostClick = () => {
    if (ghostRef.current) {
      ghostRef.current.classList.add('ghost-surprised');
      setTimeout(() => {
        if (ghostRef.current) {
          ghostRef.current.classList.remove('ghost-surprised');
        }
      }, 1000);
    }
  };

  return (
    <div 
      ref={ghostRef}
      className="roaming-ghost" 
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        transform: `scaleX(${direction.x < 0 ? -1 : 1})` 
      }}
      onClick={handleGhostClick}
    >
      <div className="ghost-body">
        <div className="ghost-face">
          <div className="ghost-eyes">
            <div className="ghost-eye"></div>
            <div className="ghost-eye"></div>
          </div>
          <div className="ghost-mouth"></div>
        </div>
      </div>
      <div className="ghost-tail"></div>
    </div>
  );
};

export default RoamingGhost;