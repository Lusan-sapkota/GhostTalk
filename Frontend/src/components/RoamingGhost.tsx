import React, { useEffect, useRef, useState, useCallback } from 'react';
import './RoamingGhost.css';
import themeService from '../services/ThemeService';

interface RoamingGhostProps {
  pageId?: string;
  behavior?: 'roam' | 'follow' | 'static';
  mood?: 'happy' | 'sad' | 'surprised' | 'normal';
  speed?: 'slow' | 'normal' | 'fast';
  size?: 'small' | 'medium' | 'large';
  sparkleEffect?: boolean;
  zIndex?: number; 
  containerId?: string;
  debug?: boolean;
  disableInteraction?: boolean; // New prop to make ghost non-interactive
  responsiveScale?: boolean; // New prop to enable responsive scaling
  darkMode?: boolean; // Control dark mode appearance
}

const RoamingGhost: React.FC<RoamingGhostProps> = ({ 
  pageId = 'default',
  behavior = 'roam',
  mood = 'normal',
  speed = 'normal',
  size = 'medium',
  sparkleEffect = true,
  zIndex = 50, // Lower default z-index
  containerId,
  debug = false,
  disableInteraction = false, // Default to interactive
  responsiveScale = true, // Default to responsive scaling
  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches // Use system theme by default
}) => {
  const ghostRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState({ x: 1, y: 1 });
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [interactions, setInteractions] = useState(0);
  const mousePosition = useRef({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [isPopping, setIsPopping] = useState(false);
  const [showEmote, setShowEmote] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Speed settings based on prop
  const getSpeed = useCallback(() => {
    switch(speed) {
      case 'slow': return 15000;
      case 'fast': return 8000;
      default: return 12000;
    }
  }, [speed]);

  // Movement step size based on speed
  const getStepSize = useCallback(() => {
    switch(speed) {
      case 'slow': return { min: 3, max: 8 };
      case 'fast': return { min: 8, max: 15 };
      default: return { min: 5, max: 10 };
    }
  }, [speed]);

  // Track viewport size changes for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add theme change listener
  useEffect(() => {
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Update component state if you're tracking dark mode internally
    };
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Initialize ghost position randomly
  useEffect(() => {
    // Position logic with container awareness
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        // Get container dimensions
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const containerLeft = rect.left;
        const containerTop = rect.top;
        
        // Calculate percentage within container
        const randomX = Math.floor(Math.random() * 70) + 15; // 15-85% of container width
        const randomY = Math.floor(Math.random() * 60) + 15; // 15-75% of container height
        
        // Set position based on container
        setPosition({ 
          x: (containerLeft + (randomX / 100 * containerWidth)) / window.innerWidth * 100,
          y: (containerTop + (randomY / 100 * containerHeight)) / window.innerHeight * 100
        });
      } else {
        // Fallback to regular positioning
        const randomX = Math.floor(Math.random() * 70) + 5; // 5-75% of screen width
        const randomY = Math.floor(Math.random() * 60) + 5; // 5-65% of screen height
        setPosition({ x: randomX, y: randomY });
      }
    } else {
      // Original positioning
      const randomX = Math.floor(Math.random() * 70) + 5; // 5-75% of screen width
      const randomY = Math.floor(Math.random() * 60) + 5; // 5-65% of screen height
      setPosition({ x: randomX, y: randomY });
    }
    
    // Rest of the initialization...
    setDirection({
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.5
    });

    if (sparkleEffect) {
      createSparkles();
    }

    return () => {
      // Clean up any animations or intervals
    };
  }, [pageId, sparkleEffect, containerId]);

  // Handle behavior modes
  useEffect(() => {
    // Clear any existing intervals
    const allIntervals: number[] = [];
    
    if (behavior === 'follow') {
      // Follow behavior remains the same
      // ...existing follow code...
    } 
    else if (behavior === 'roam') {
      // Make movement more frequent for better continuous motion
      const primaryIntervalId = window.setInterval(() => {
        roamAround();
      }, getSpeed() / 8); // Changed from /5 to /8 for more frequent movement
      
      // Increase frequency of special movements
      const secondaryIntervalId = window.setInterval(() => {
        if (Math.random() > 0.6) { // Changed from 0.7 to 0.6
          makeSpecialMovement();
        }
      }, getSpeed() / 2); // More frequent special movements
      
      // Add a "rescue" interval to detect if ghost is stuck
      const rescueIntervalId = window.setInterval(() => {
        // Force a direction change every few seconds to prevent getting stuck
        setDirection({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        });
      }, getSpeed() * 2);
      
      allIntervals.push(primaryIntervalId, secondaryIntervalId, rescueIntervalId);
      
      return () => {
        allIntervals.forEach(clearInterval);
      };
    }
    // ...existing static code...
    
    return () => {
      allIntervals.forEach(clearInterval);
    };
  }, [behavior, getSpeed]);

  // Follow mouse cursor logic
  const followMouse = () => {
    setPosition(prev => {
      const targetX = mousePosition.current.x;
      const targetY = mousePosition.current.y;
      
      // Calculate distance to mouse
      const distX = targetX - prev.x;
      const distY = targetY - prev.y;
      const dist = Math.sqrt(distX * distX + distY * distY);
      
      // Update direction for face orientation
      if (Math.abs(distX) > 2) {
        setDirection(curr => ({ ...curr, x: distX > 0 ? 1 : -1 }));
      }
      
      // If close enough to mouse, slow down
      const speedFactor = dist < 10 ? 0.02 : 0.08;
      
      // Move ghost towards mouse
      return {
        x: prev.x + distX * speedFactor,
        y: prev.y + distY * speedFactor
      };
    });
  };

  // Constrain roaming to container with improved positioning logic
  const constrainToContainer = useCallback((newX: number, newY: number) => {
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        const rect = container.getBoundingClientRect();
        const ghostWidth = ghostRef.current?.offsetWidth || 40;
        const ghostHeight = ghostRef.current?.offsetHeight || 45;
        
        // Convert new position to viewport coordinates with scaling
        const vpX = (newX / 100) * viewportSize.width;
        const vpY = (newY / 100) * viewportSize.height;
        
        // Padding should be responsive too
        const padding = Math.min(15, rect.width * 0.05);
        
        // Check container bounds and adjust position
        let constrainedX = newX;
        let constrainedY = newY;
        
        // Make sure ghost stays within container horizontally
        if (vpX < rect.left + padding) {
          constrainedX = (rect.left + padding) / viewportSize.width * 100;
        } else if (vpX > rect.right - ghostWidth - padding) {
          constrainedX = (rect.right - ghostWidth - padding) / viewportSize.width * 100;
        }
        
        // Make sure ghost stays within container vertically
        if (vpY < rect.top + padding) {
          constrainedY = (rect.top + padding) / viewportSize.height * 100;
        } else if (vpY > rect.bottom - ghostHeight - padding) {
          constrainedY = (rect.bottom - ghostHeight - padding) / viewportSize.height * 100;
        }
        
        return { x: constrainedX, y: constrainedY };
      }
    }
    
    // Improved boundary constraints with responsive margins
    const safeMarginX = viewportSize.width < 768 ? 2 : 5;
    const safeMarginY = viewportSize.height < 600 ? 2 : 5;
    const ghostWidth = ghostRef.current?.offsetWidth || 40;
    const ghostHeight = ghostRef.current?.offsetHeight || 45;
    
    const maxX = 98 - (ghostWidth / viewportSize.width * 100);
    const maxY = 95 - (ghostHeight / viewportSize.height * 100);
    
    return { 
      x: Math.max(safeMarginX, Math.min(maxX, newX)), 
      y: Math.max(safeMarginY, Math.min(maxY, newY)) 
    };
  }, [containerId, viewportSize]);

  // Enhanced roaming movement logic with anti-sticking behavior
  const roamAround = () => {
    setPosition(prevPos => {
      const stepSizes = getStepSize();
      
      // Add more randomness to movement
      let moveX = direction.x * (Math.random() * (stepSizes.max - stepSizes.min) + stepSizes.min);
      let moveY = direction.y * (Math.random() * (stepSizes.max - stepSizes.min) + stepSizes.min);
      
      // Add variation to prevent getting stuck in patterns
      moveX += (Math.random() - 0.5) * 5;
      moveY += (Math.random() - 0.5) * 5;
      
      // Detect if ghost is near corners and add extra push away
      const isNearLeftEdge = prevPos.x < 15;
      const isNearRightEdge = prevPos.x > 85;
      const isNearTopEdge = prevPos.y < 15;
      const isNearBottomEdge = prevPos.y > 80;
      
      // If near any edge, add force to push away from that edge
      if (isNearLeftEdge) moveX += Math.random() * 10;
      if (isNearRightEdge) moveX -= Math.random() * 10;
      if (isNearTopEdge) moveY += Math.random() * 10;
      if (isNearBottomEdge) moveY -= Math.random() * 10;
      
      // Near corner - add stronger push
      if ((isNearLeftEdge && isNearTopEdge) || 
          (isNearLeftEdge && isNearBottomEdge) || 
          (isNearRightEdge && isNearTopEdge) || 
          (isNearRightEdge && isNearBottomEdge)) {
        moveX = moveX * 1.5;
        moveY = moveY * 1.5;
      }
      
      let newPosX = prevPos.x + moveX;
      let newPosY = prevPos.y + moveY;
      
      // Container constraint check
      const constrained = constrainToContainer(newPosX, newPosY);
      newPosX = constrained.x;
      newPosY = constrained.y;
      
      // Keep ghost on screen and handle edge cases with bounce effect
      let newDirX = direction.x;
      let newDirY = direction.y;
      
      if (newPosX < 5) {
        newPosX = 5 + Math.random() * 5; // Add randomness to bounce position
        newDirX = Math.abs(direction.x) + (Math.random() * 0.5); // Bounce right with variation
        if (ghostRef.current) ghostRef.current.classList.add('gt-roaming-ghost-bump');
      } else if (newPosX > 90) {
        newPosX = 90 - Math.random() * 5; // Add randomness to bounce position
        newDirX = -Math.abs(direction.x) - (Math.random() * 0.5); // Bounce left with variation
        if (ghostRef.current) ghostRef.current.classList.add('gt-roaming-ghost-bump');
      }
      
      if (newPosY < 5) {
        newPosY = 5 + Math.random() * 5; // Add randomness to bounce position
        newDirY = Math.abs(direction.y) + (Math.random() * 0.5); // Bounce down with variation
        if (ghostRef.current) ghostRef.current.classList.add('gt-roaming-ghost-bump');
      } else if (newPosY > 85) {
        newPosY = 85 - Math.random() * 5; // Add randomness to bounce position
        newDirY = -Math.abs(direction.y) - (Math.random() * 0.5); // Bounce up with variation
        if (ghostRef.current) ghostRef.current.classList.add('gt-roaming-ghost-bump');
      }
      
      if (newDirX !== direction.x || newDirY !== direction.y) {
        // Direction changed, update it
        setDirection({ x: newDirX, y: newDirY });
        
        // Remove bump class after animation completes
        setTimeout(() => {
          if (ghostRef.current) ghostRef.current.classList.remove('gt-roaming-ghost-bump');
        }, 300);
      }
      
      // Call createTrail with the new position
      createTrail(newPosX, newPosY);

      return { x: newPosX, y: newPosY };
    });
    
    // Occasionally change direction randomly for natural movement
    // Increased probability for more frequent direction changes
    if (Math.random() > 0.85) {
      setDirection(prev => ({
        x: prev.x + (Math.random() - 0.5) * 0.8,
        y: prev.y + (Math.random() - 0.5) * 0.8
      }));
    }
  };

  // Special movements for more interesting roaming pattern
  const makeSpecialMovement = () => {
    // Possible special movements
    const specialMoves = [
      // Quick dart in current direction
      () => {
        setPosition(prev => ({
          x: Math.min(Math.max(5, prev.x + direction.x * 15), 90),
          y: Math.min(Math.max(5, prev.y + direction.y * 15), 85),
        }));
      },
      
      // Zigzag movement
      () => {
        setDirection(prev => ({
          x: -prev.x,
          y: prev.y
        }));
      },
      
      // Circle movement
      () => {
        const angle = Math.random() * Math.PI * 2;
        setDirection({
          x: Math.cos(angle) * 0.8,
          y: Math.sin(angle) * 0.8
        });
      },
      
      // Pause briefly
      () => {
        if (ghostRef.current) {
          ghostRef.current.classList.add('gt-roaming-ghost-pause');
          setTimeout(() => {
            if (ghostRef.current) {
              ghostRef.current.classList.remove('gt-roaming-ghost-pause');
            }
          }, 1500);
        }
      }
    ];
    
    // Execute a random special move
    const randomMove = specialMoves[Math.floor(Math.random() * specialMoves.length)];
    randomMove();
  };

  // Creates sparkle effects around the ghost
  const createSparkles = () => {
    const newSparkles = Array(3).fill(0).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50, // Position relative to ghost (-50 to 50)
      y: Math.random() * 100 - 50  // Position relative to ghost (-50 to 50)
    }));
    
    setSparkles(newSparkles);
    
    // Regenerate sparkles after delay
    setTimeout(() => {
      setSparkles([]);
    }, 2000);
  };

  // Create ghost trail effect
  const createTrail = (x: number, y: number) => {
    // Only create trails at certain intervals for performance
    if (Math.random() > 0.3) return;
    
    const trailContainer = document.querySelector('.gt-ghost-trail');
    if (!trailContainer) return;
    
    // Create trail particle
    const particle = document.createElement('div');
    particle.className = 'gt-ghost-trail-particle';
    
    // Position particle at current ghost position
    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;
    
    // Add to DOM
    trailContainer.appendChild(particle);
    
    // Remove after animation completes
    setTimeout(() => {
      if (particle.parentNode === trailContainer) {
        trailContainer.removeChild(particle);
      }
    }, 1500);
  };

  // Enhanced ghost interactions with improved class handling
  const handleGhostClick = () => {
    if (!ghostRef.current) return;
    
    // Increment interactions counter
    const newCount = interactions + 1;
    setInteractions(newCount);
    
    // Create sparkles on click with theme awareness
    if (sparkleEffect) {
      createSparkles();
    }
    
    // Ensure all animation classes are removed before adding new ones
    const resetAnimations = () => {
      if (ghostRef.current) {
        ghostRef.current.classList.remove(
          'gt-roaming-ghost-celebrate', 
          'gt-roaming-ghost-happy-bounce',
          'gt-roaming-ghost-surprised',
          'gt-roaming-ghost-pop'
        );
      }
    };
    
    // Add pop effect on click
    ghostRef.current.classList.add('gt-roaming-ghost-pop');
    
    // Different animations and emotes based on interaction count
    if (newCount % 10 === 0) {
      // Special celebration every 10 clicks
      resetAnimations();
      setTimeout(() => {
        if (ghostRef.current) {
          ghostRef.current.classList.add('gt-roaming-ghost-celebrate');
          setShowEmote(Math.random() > 0.5 ? '✨' : '💫');
        }
      }, 300);
      
      setTimeout(() => {
        resetAnimations();
        setShowEmote(null);
      }, 2000);
    }
    else if (newCount % 5 === 0) {
      // Medium celebration every 5 clicks
      resetAnimations();
      setTimeout(() => {
        if (ghostRef.current) {
          ghostRef.current.classList.add('gt-roaming-ghost-happy-bounce');
          setShowEmote('❤️');
        }
      }, 300);
      
      setTimeout(() => {
        resetAnimations();
        setShowEmote(null);
      }, 1500);
    } 
    else {
      // Regular surprise response
      resetAnimations();
      setTimeout(() => {
        if (ghostRef.current) {
          ghostRef.current.classList.add('gt-roaming-ghost-surprised');
          setShowEmote('!');
        }
      }, 300);
      
      setTimeout(() => {
        resetAnimations();
        setShowEmote(null);
      }, 1000);
    }

    // Reset pop effect after animation completes
    setTimeout(() => {
      if (ghostRef.current) {
        ghostRef.current.classList.remove('gt-roaming-ghost-pop');
      }
    }, 300);

    // Ghost temporarily disappears after 15 interactions
    if (newCount === 15) {
      setShowEmote('👋');
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setIsVisible(true);
          setShowEmote('😊');
          setTimeout(() => {
            setShowEmote(null);
          }, 1500);
        }, 3000); // Reappear after 3 seconds
      }, 1000);
      
      // Reset interactions after disappearing
      setTimeout(() => setInteractions(0), 5000);
    }
  };
  
  // Get appropriate emotion class based on mood prop and interactions
  const getEmotionClass = () => {
    if (interactions >= 10) return 'gt-roaming-ghost-excited';
    if (isHovered) return 'gt-roaming-ghost-happy';
    
    switch(mood) {
      case 'happy': return 'gt-roaming-ghost-happy';
      case 'sad': return 'gt-roaming-ghost-sad';
      case 'surprised': return 'gt-roaming-ghost-surprised';
      default: return '';
    }
  };
  
  // Size class based on size prop
  const getSizeClass = () => {
    switch(size) {
      case 'small': return 'gt-roaming-ghost-small';
      case 'large': return 'gt-roaming-ghost-large';
      default: return '';
    }
  };

  // Calculate size based on viewport for responsive scaling
  const getResponsiveSize = useCallback(() => {
    if (!responsiveScale) return {};
    
    // Base size calculation
    const baseSize = {
      small: { width: 30, height: 35 },
      medium: { width: 40, height: 45 },
      large: { width: 50, height: 55 }
    }[size];
    
    // Scale factor based on viewport width
    let scaleFactor = 1;
    if (viewportSize.width < 480) scaleFactor = 0.75;
    else if (viewportSize.width < 768) scaleFactor = 0.85;
    else if (viewportSize.width > 1920) scaleFactor = 1.15;
    
    return {
      width: `${baseSize.width * scaleFactor}px`,
      height: `${baseSize.height * scaleFactor}px`
    };
  }, [size, viewportSize, responsiveScale]);

  if (!isVisible) return null;

  return (
    <div 
      ref={ghostRef}
      className={`gt-roaming-ghost ${getEmotionClass()} ${getSizeClass()} ${isPopping ? 'gt-roaming-ghost-pop' : ''} ${darkMode ? 'gt-roaming-ghost-dark' : ''} ${debug ? 'gt-debug' : ''} gt-smooth-move`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        zIndex: zIndex,
        pointerEvents: disableInteraction ? 'none' : 'auto',
        ...getResponsiveSize()
      }}
      onClick={disableInteraction ? undefined : handleGhostClick}
      onMouseEnter={disableInteraction ? undefined : () => setIsHovered(true)}
      onMouseLeave={disableInteraction ? undefined : () => setIsHovered(false)}
    >
      {/* Trail container */}
      <div className="gt-ghost-trail"></div>
      
      {/* Debug info if enabled */}
      {debug && (
        <div className="gt-ghost-debug">
          <p>Pos: {position.x.toFixed(1)},{position.y.toFixed(1)}</p>
          <p>Dir: {direction.x.toFixed(1)},{direction.y.toFixed(1)}</p>
          <p>Interactions: {interactions}</p>
        </div>
      )}
      
      {/* Sparkle effects */}
      {sparkles.map(sparkle => (
        <div 
          key={sparkle.id} 
          className="gt-roaming-ghost-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`
          }}
        ></div>
      ))}
      
      {/* Emote display (reactions) */}
      {showEmote && (
        <div className="gt-roaming-ghost-emote">
          {showEmote}
        </div>
      )}
      
      {/* Ghost body with direction transform */}
      <div className="gt-roaming-ghost-body-wrapper" style={{ transform: `scaleX(${direction.x < 0 ? -1 : 1})` }}>
        <div className="gt-roaming-ghost-body">
          <div className="gt-roaming-ghost-face">
            <div className="gt-roaming-ghost-eyes">
              <div className="gt-roaming-ghost-eye"></div>
              <div className="gt-roaming-ghost-eye"></div>
            </div>
            <div className="gt-roaming-ghost-mouth"></div>
          </div>
        </div>
        <div className="gt-roaming-ghost-tail">
          {/* The ::before and ::after pseudo-elements create the first two parts */}
          <div className="gt-roaming-ghost-tail-right"></div>
        </div>
      </div>
      <div className="gt-roaming-ghost-shadow"></div>
      
      {/* Speech bubble that appears on hover (outside the flipping transform) */}
      {isHovered && (
        <div className={`gt-roaming-ghost-speech ${darkMode ? 'gt-dark-speech' : ''}`}>
          {interactions === 0 && "Hello there!"}
          {interactions > 0 && interactions < 5 && "Click me again!"}
          {interactions >= 5 && interactions < 10 && "We're becoming friends!"}
          {interactions >= 10 && "You found me so many times!"}
          {interactions === 14 && "Byee!"}
        </div>
      )}
    </div>
  );
};

export default RoamingGhost;