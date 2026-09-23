import { useState } from 'react';

const BRIGADE_PHONE_DISPLAY = '04-6079860';

export default function HeaderScheduleChangeNotice() {
  const [copied, setCopied] = useState(false);

  async function handleCopyPhone() {
    try {
      await navigator.clipboard.writeText(BRIGADE_PHONE_DISPLAY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `tel:${BRIGADE_PHONE_DISPLAY.replace(/-/g, '')}`;
    }
  }

  return (
    <p className="mx-auto max-w-6xl text-center text-[11px] leading-snug text-olive-800 sm:text-xs">
      בכל בקשה או שינוי תור שכבר נקבע — להתקשר לחמ&quot;ל חטיבה:{' '}
      <button
        type="button"
        onClick={handleCopyPhone}
        className="font-bold text-olive-700 underline decoration-olive-300 underline-offset-2 hover:text-olive-900"
        aria-label={`העתקת מספר ${BRIGADE_PHONE_DISPLAY}`}
      >
        {copied ? 'הועתק!' : `טלפון: ${BRIGADE_PHONE_DISPLAY}`}
      </button>
    </p>
  );
}
