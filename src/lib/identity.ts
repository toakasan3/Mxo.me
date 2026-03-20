'use client';

export const COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
  '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9'
];

export interface Identity {
  uid: string;
  name: string;
  color: string;
}

export interface RecentRoom {
  code: string;
  lastVisited: number;
}

function randomHex(len: number): string {
  // Use ceil(len/2) bytes so we get exactly `len` hex characters without truncation
  const arr = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}

export function getOrCreateIdentity(): Identity {
  if (typeof window === 'undefined') return { uid: '', name: '', color: COLORS[0] };
  
  let uid = localStorage.getItem('ib_uid');
  if (!uid) {
    uid = randomHex(8);
    localStorage.setItem('ib_uid', uid);
  }

  let name = localStorage.getItem('ib_name');
  if (!name) {
    name = 'User-' + uid.slice(0, 4).toUpperCase();
    localStorage.setItem('ib_name', name);
  }

  let color = localStorage.getItem('ib_color');
  if (!color) {
    color = COLORS[Math.floor(Math.random() * COLORS.length)];
    localStorage.setItem('ib_color', color);
  }

  return { uid, name, color };
}

export function updateName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ib_name', name);
  window.dispatchEvent(new Event('identity-updated'));
}

export function addRecentRoom(code: string): void {
  if (typeof window === 'undefined') return;
  const rooms = getRecentRooms().filter(r => r.code !== code);
  rooms.unshift({ code, lastVisited: Date.now() });
  localStorage.setItem('ib_rooms', JSON.stringify(rooms.slice(0, 20)));
}

export function getRecentRooms(): RecentRoom[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('ib_rooms') || '[]');
  } catch {
    return [];
  }
}
