import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageViewer = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  images = [], // Optional: array of all images for navigation
  currentIndex = 0, // Optional: current image index
  onNavigate = null // Optional: callback for navigation
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset state when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, [imageSrc, currentIndex]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (onNavigate && currentIndex > 0) {
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (onNavigate && currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1);
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case '0':
          resetView();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onNavigate, onClose]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 0.5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // Double tap to zoom
  const handleDoubleTap = useCallback((e) => {
    e.preventDefault();
    if (scale > 1) {
      resetView();
    } else {
      setScale(2.5);
      // Center zoom on tap point
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setPosition({ x: -x * 0.5, y: -y * 0.5 });
      }
    }
  }, [scale, resetView]);

  // Handle tap (detect double tap)
  const handleTap = useCallback((e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleDoubleTap(e);
    }
    setLastTap(now);
  }, [lastTap, handleDoubleTap]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => {
      const newScale = Math.max(0.5, Math.min(5, prev + delta));
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // Touch pinch zoom
  const [touches, setTouches] = useState([]);
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [initialScale, setInitialScale] = useState(1);

  const getDistance = (touch1, touch2) => {
    return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialScale(scale);
      setTouches([...e.touches]);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = distance / initialPinchDistance;
      const newScale = Math.max(0.5, Math.min(5, initialScale * scaleChange));
      setScale(newScale);
      
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  }, [initialPinchDistance, initialScale, isDragging, dragStart, scale]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      setInitialPinchDistance(null);
      setTouches([]);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  }, []);

  // Mouse drag for panning
  const handleMouseDown = useCallback((e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Download image
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `endoscopy-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageSrc]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          {images.length > 1 && (
            <span className="text-white/70 text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          <span className="text-white/50 text-xs">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Rotate (R)"
          >
            <RotateCw size={20} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Download"
          >
            <Download size={20} />
          </button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onClick={handleTap}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Fullscreen view"
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            transformOrigin: 'center center',
          }}
          draggable={false}
        />

        {/* Navigation arrows */}
        {onNavigate && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer hints */}
      <div className="p-2 bg-black/50 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-4 text-white/40 text-[10px]">
          <span>Double-tap to zoom</span>
          <span>•</span>
          <span>Pinch or scroll to zoom</span>
          <span>•</span>
          <span>Drag to pan when zoomed</span>
          <span>•</span>
          <span>← → to navigate</span>
        </div>
      </div>

      {/* Thumbnail strip (if multiple images) */}
      {images.length > 1 && (
        <div className="p-2 bg-black/70 backdrop-blur-md border-t border-white/10 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-max px-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate(idx); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentIndex 
                    ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110' 
                    : 'border-white/20 hover:border-white/50 opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={typeof img === 'string' ? img : (img.preview || img.src)} 
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;