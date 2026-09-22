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
    <p className="mx-auto mt-2 max-w-[18rem] text-[11px] leading-snug text-sky-100/95 sm:max-w-none sm:text-xs">
      בכל בקשה או שינוי תור שכבר נקבע — להתקשר לחמ&quot;ל חטיבה:{' '}
      <button
        type="button"
        onClick={handleCopyPhone}
        className="inline font-semibold text-amber-300 underline decoration-amber-400/70 underline-offset-2 transition-colors hover:text-amber-200 active:text-amber-100"
        aria-label={`העתקת מספר ${BRIGADE_PHONE_DISPLAY}`}
      >
        {copied ? 'הועתק!' : `טלפון: ${BRIGADE_PHONE_DISPLAY}`}
      </button>
    </p>
  );
}
