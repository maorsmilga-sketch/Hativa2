/**
 * Parse "HH:MM" to minutes since midnight.
 */
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to "HH:MM".
 */
export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

import { normalizeBreaks, slotOverlapsBreak } from './breaks';

/**
 * Generate slot objects between start and end time; skips therapist break windows.
 */
export function generateTimeSlots(startTime, endTime, durationMinutes, breaks = []) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const normalizedBreaks = normalizeBreaks(breaks);
  const slots = [];

  for (let cursor = start; cursor + durationMinutes <= end; cursor += durationMinutes) {
    const slotStart = minutesToTime(cursor);
    const slotEnd = minutesToTime(cursor + durationMinutes);
    if (slotOverlapsBreak(slotStart, slotEnd, normalizedBreaks)) continue;
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      status: 'available',
    });
  }

  return slots;
}

export function formatHebrewDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
