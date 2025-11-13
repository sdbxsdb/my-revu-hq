import { PaymentIcon } from 'react-svg-credit-card-payment-icons';
import { IconCreditCard } from '@tabler/icons-react';

interface CardBrandIconProps {
  brand?: string;
  size?: number;
  className?: string;
}

// Map Stripe card brand names to PaymentIcon type names
type PaymentIconType =
  | 'Visa'
  | 'Mastercard'
  | 'Americanexpress'
  | 'Amex'
  | 'Discover'
  | 'Diners'
  | 'Jcb'
  | null;

const mapBrandToType = (brand?: string): PaymentIconType => {
  if (!brand) return null;

  const brandLower = brand.toLowerCase();

  switch (brandLower) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
    case 'american_express':
      return 'Amex';
    case 'discover':
      return 'Discover';
    case 'diners':
    case 'diners_club':
      return 'Diners';
    case 'jcb':
      return 'Jcb';
    default:
      return null;
  }
};

const CardBrandIcon = ({ brand, size = 64, className = '' }: CardBrandIconProps) => {
  const iconType = mapBrandToType(brand);

  if (!iconType) {
    return <IconCreditCard size={size} className={className} />;
  }

  return (
    <div className={className} style={{ width: size, height: size * 0.6 }}>
      <PaymentIcon type={iconType} format="flatRounded" width={size} />
    </div>
  );
};

export default CardBrandIcon;
