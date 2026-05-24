import { formatCurrency } from '../lib/supabase';

type Props = {
  phone: string | null | undefined;
  customerName: string;
  debtAmount?: number;
  compact?: boolean;
  className?: string;
  label?: string;
};

/** Normalize Iraqi/local numbers for wa.me (E.164 without +) */
export function formatPhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('964') && digits.length >= 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return `964${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith('7')) {
    return `964${digits}`;
  }
  if (digits.length >= 9 && digits.length <= 15) {
    return digits.startsWith('964') ? digits : `964${digits}`;
  }
  return null;
}

function buildDebtMessage(customerName: string, debtAmount?: number): string {
  const name = customerName.trim() || 'عميلنا الكريم';
  if (debtAmount && debtAmount > 0) {
    return (
      `السلام عليكم ${name}،\n` +
      `نذكّركم بوجود مبلغ مستحق: ${formatCurrency(debtAmount)}.\n` +
      `نرجو التكرم بالتسديد أو التواصل معنا.\n` +
      `شكراً لتعاونكم.`
    );
  }
  return `السلام عليكم ${name}، نرجو التواصل معنا. شكراً لتعاونكم.`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function WhatsAppButton({
  phone,
  customerName,
  debtAmount = 0,
  compact = false,
  className = '',
  label,
}: Props) {
  const normalized = phone ? formatPhoneForWhatsApp(phone) : null;
  const hasPhone = Boolean(normalized);

  const handleClick = () => {
    if (!normalized) {
      alert('لا يوجد رقم هاتف صالح لهذا العميل');
      return;
    }

    const text = encodeURIComponent(buildDebtMessage(customerName, debtAmount));
    const url = `https://wa.me/${normalized}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!hasPhone}
        title={hasPhone ? 'إرسال واتساب' : 'لا يوجد رقم هاتف'}
        className={`p-2 rounded-lg transition-colors ${
          hasPhone
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        } ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasPhone}
      title={hasPhone ? 'فتح واتساب' : 'أضف رقم هاتف للعميل أولاً'}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors min-h-[40px] ${
        hasPhone
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
      } ${className}`}
    >
      <WhatsAppIcon className="w-5 h-5 shrink-0" />
      <span>{label ?? 'واتساب'}</span>
    </button>
  );
}
