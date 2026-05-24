/**
 * Normalize Iraqi phone numbers for WhatsApp (wa.me).
 * Accepts: 07701234567, 7701234567, 9647701234567, +964 770 123 4567
 * Returns: 9647701234567 (digits only, no +)
 */
export function formatIraqiPhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;

  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('964')) {
    if (digits.length === 13 && digits[3] === '7') return digits;
    return null;
  }

  if (digits.startsWith('0') && digits.length === 11 && digits[1] === '7') {
    return `964${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith('7')) {
    return `964${digits}`;
  }

  return null;
}

export function buildDebtReminderMessage(customerName: string, amount: number): string {
  const amountFormatted = new Intl.NumberFormat('ar-IQ').format(amount);
  return `السلام عليكم ${customerName} 🌹

عليك مبلغ مستحق:
${amountFormatted} د.ع

نرجو التسديد بأقرب وقت 🙏`;
}

export function buildWhatsAppDebtUrl(
  phone: string | null | undefined,
  customerName: string,
  debtAmount: number
): string | null {
  const normalized = formatIraqiPhoneForWhatsApp(phone);
  if (!normalized) return null;

  const text = encodeURIComponent(buildDebtReminderMessage(customerName, debtAmount));
  return `https://wa.me/${normalized}?text=${text}`;
}
