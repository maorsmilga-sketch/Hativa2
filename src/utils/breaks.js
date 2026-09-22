function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function normalizeBreaks(breaks) {
  if (!Array.isArray(breaks)) return [];
  return breaks
    .map((b) => ({
      startTime: (b.startTime || '').trim(),
      endTime: (b.endTime || '').trim(),
    }))
    .filter((b) => b.startTime && b.endTime)
    .filter((b) => toMinutes(b.startTime) < toMinutes(b.endTime))
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

export function slotOverlapsBreak(slotStart, slotEnd, breaks) {
  const s = toMinutes(slotStart);
  const e = toMinutes(slotEnd);
  return breaks.some((br) => {
    const bs = toMinutes(br.startTime);
    const be = toMinutes(br.endTime);
    return s < be && e > bs;
  });
}

export function formatBreaksSummary(breaks) {
  const list = normalizeBreaks(breaks);
  if (!list.length) return '';
  return list.map((b) => `${b.startTime}–${b.endTime}`).join(', ');
}
