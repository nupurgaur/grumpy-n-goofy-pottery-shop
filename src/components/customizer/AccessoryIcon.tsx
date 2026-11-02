import type { AccessoryId } from "@/config/potCustomizer";
import { Heart, Star } from "lucide-react";

interface AccessoryIconProps {
  id: AccessoryId;
  className?: string;
  size?: number;
}

/** Simple playful icons for accessory picker + preview */
export const AccessoryIcon = ({
  id,
  className = "",
  size = 24,
}: AccessoryIconProps) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
  };

  switch (id) {
    case "heart":
      return <Heart className={className} size={size} fill="currentColor" />;
    case "star":
      return <Star className={className} size={size} fill="currentColor" />;
    case "bee":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="13" rx="5" ry="4" fill="#F5C842" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 12h10M7 14h10" stroke="#2E2E2E" strokeWidth="1" />
          <path d="M8 9l-2-2M16 9l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "flower":
      return (
        <svg {...props}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx="12"
              cy="7"
              rx="2.2"
              ry="4.5"
              fill="currentColor"
              opacity="0.85"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
          <circle cx="12" cy="12" r="3" fill="#F5C842" />
        </svg>
      );
    case "penguin":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="14" rx="5.5" ry="7" fill="currentColor" />
          <ellipse cx="12" cy="15" rx="3" ry="4.5" fill="#F5F3EF" />
          <circle cx="10" cy="11" r="0.9" fill="#F5F3EF" />
          <circle cx="14" cy="11" r="0.9" fill="#F5F3EF" />
          <path d="M12 12l1 2h-2l1-2z" fill="#E88CA3" />
        </svg>
      );
    case "bow":
      return (
        <svg {...props}>
          <path
            d="M12 13c-3-4-6-5-8-3 2 1 4 3 5 5M12 13c3-4 6-5 8-3-2 1-4 3-5 5M12 13v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="12" cy="13" r="2" fill="currentColor" />
        </svg>
      );
    case "doggo":
      return (
        <svg {...props}>
          <ellipse cx="7.5" cy="9" rx="2.8" ry="3.5" fill="currentColor" />
          <ellipse cx="16.5" cy="9" rx="2.8" ry="3.5" fill="currentColor" />
          <circle cx="12" cy="14" r="6" fill="currentColor" opacity="0.9" />
          <circle cx="10" cy="13.5" r="0.9" fill="#F5F3EF" />
          <circle cx="14" cy="13.5" r="0.9" fill="#F5F3EF" />
          <ellipse cx="12" cy="15.5" rx="1.4" ry="1" fill="#F5F3EF" />
        </svg>
      );
    case "cat":
      return (
        <svg {...props}>
          <path d="M8 8L6 4l2 3M16 8l2-4-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="14" r="6" fill="currentColor" opacity="0.9" />
          <path d="M9 13.5h1.5M13.5 13.5H15" stroke="#F5F3EF" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M12 15.5l0.8 1.2-1.6 0.4 0.8-1.6z" fill="#F5F3EF" />
          <path d="M10 16.5c0.8 0.6 2.2 0.6 3 0" stroke="#F5F3EF" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};
