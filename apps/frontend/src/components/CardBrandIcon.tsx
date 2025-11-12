import { IconCreditCard } from '@tabler/icons-react';

interface CardBrandIconProps {
  brand?: string;
  size?: number;
  className?: string;
}

// Simple card brand icons using SVG
const CardBrandIcon = ({ brand, size = 24, className = '' }: CardBrandIconProps) => {
  if (!brand) {
    return <IconCreditCard size={size} className={className} />;
  }

  const brandLower = brand.toLowerCase();

  // Card brand SVG icons - using official brand colors
  const getBrandIcon = () => {
    switch (brandLower) {
      case 'visa':
        return (
          <svg
            width={size}
            height={size * 0.6}
            viewBox="0 0 60 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
          >
            <rect width="60" height="20" rx="3" fill="#1434CB" />
            <path
              d="M26.5 6.5L24 13.5H21.5L23.5 6.5H26.5ZM39.5 6.5L36.5 13.5H34L34.5 11.5H30.5L30 13.5H27.5L31 6.5H34L34.5 9H38.5L39 6.5H39.5ZM21.5 6.5L18.5 10.5L18 8.5L17 6.5H14L16.5 13.5H19L22.5 9.5L23 11.5L23.5 13.5H26.5L24.5 6.5H21.5Z"
              fill="white"
            />
          </svg>
        );
      case 'mastercard':
        return (
          <svg
            width={size}
            height={size * 0.6}
            viewBox="0 0 60 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
          >
            <rect width="60" height="20" rx="3" fill="#EB001B" />
            <circle cx="22" cy="10" r="6" fill="#FF5F00" />
            <circle cx="38" cy="10" r="6" fill="#F79E1B" />
            <path
              d="M30 6C28 7.5 27 8.5 27 10C27 11.5 28 12.5 30 14C32 12.5 33 11.5 33 10C33 8.5 32 7.5 30 6Z"
              fill="#EB001B"
            />
          </svg>
        );
      case 'amex':
      case 'american_express':
        return (
          <svg
            width={size}
            height={size * 0.6}
            viewBox="0 0 60 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
          >
            <rect width="60" height="20" rx="3" fill="#006FCF" />
            <path
              d="M15 7H18L16.5 10L18 13H15L14.5 11.5H13.5L13 13H10L11.5 10L10 7H13L13.5 8.5H14.5L15 7ZM22 7H25L23.5 10L25 13H22L21.5 11.5H20.5L20 13H17L18.5 10L17 7H20L20.5 8.5H21.5L22 7ZM29 7H32L30.5 10L32 13H29L28.5 11.5H27.5L27 13H24L25.5 10L24 7H27L27.5 8.5H28.5L29 7ZM36 7H39L37.5 10L39 13H36L35.5 11.5H34.5L34 13H31L32.5 10L31 7H34L34.5 8.5H35.5L36 7ZM43 7H46L44.5 10L46 13H43L42.5 11.5H41.5L41 13H38L39.5 10L38 7H41L41.5 8.5H42.5L43 7Z"
              fill="white"
            />
          </svg>
        );
      case 'discover':
        return (
          <svg
            width={size}
            height={size * 0.6}
            viewBox="0 0 60 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
          >
            <rect width="60" height="20" rx="3" fill="#FF6000" />
            <circle cx="10" cy="10" r="4" fill="white" />
            <path
              d="M20 7H25L23 10L25 13H20L19 11H18L17 13H14L16 10L14 7H17L18 9H19L20 7Z"
              fill="white"
            />
          </svg>
        );
      default:
        return <IconCreditCard size={size} className={className} />;
    }
  };

  return getBrandIcon();
};

export default CardBrandIcon;
