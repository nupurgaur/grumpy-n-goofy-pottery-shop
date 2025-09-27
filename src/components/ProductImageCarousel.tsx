import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showCounter?: boolean;
}

export const ProductImageCarousel = ({
  images,
  alt,
  className,
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  showCounter = true
}: ProductImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useState(() => {
    if (autoPlay && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  });

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className={cn("w-full h-64 bg-muted flex items-center justify-center", className)}>
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden group", className)}>
      {/* Main Image */}
      <div className="relative h-full">
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
        />
        
        {/* Navigation Arrows */}
        {showArrows && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-primary"
                  : "bg-background/50 hover:bg-background/80"
              )}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {showCounter && images.length > 1 && (
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};
