/**
 * Device Fingerprinting Utility
 * Uses browser characteristics to create a unique device identifier
 * for anonymous user tracking
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Generate a device fingerprint based on browser characteristics
 * Falls back to localStorage-based UUID if fingerprinting fails
 */
export const generateDeviceId = async (): Promise<string> => {
  if (!isBrowser) {
    return 'server-side-render';
  }

  // Try to get existing device ID from localStorage
  const existingId = localStorage.getItem('grovara_device_id');
  if (existingId) {
    return existingId;
  }

  try {
    // Generate fingerprint from browser characteristics
    const fingerprint = await getBrowserFingerprint();
    
    // Hash the fingerprint to create a consistent ID
    const deviceId = await hashFingerprint(fingerprint);
    
    // Store in localStorage for future reference
    localStorage.setItem('grovara_device_id', deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    
    // Fallback: generate a random UUID and store it
    const fallbackId = generateFallbackId();
    localStorage.setItem('grovara_device_id', fallbackId);
    
    return fallbackId;
  }
};

/**
 * Collect browser characteristics for fingerprinting
 */
const getBrowserFingerprint = async (): Promise<string> => {
  const components: string[] = [];

  // User agent
  components.push(navigator.userAgent || 'unknown');

  // Language
  components.push(navigator.language || 'unknown');

  // Timezone offset
  components.push(new Date().getTimezoneOffset().toString());

  // Screen resolution
  components.push(`${screen.width}x${screen.height}`);

  // Color depth
  components.push(screen.colorDepth?.toString() || 'unknown');

  // Hardware concurrency (CPU cores)
  components.push(navigator.hardwareConcurrency?.toString() || 'unknown');

  // Platform
  components.push(navigator.platform || 'unknown');

  // Available screen space (accounting for taskbar, etc.)
  components.push(`${screen.availWidth}x${screen.availHeight}`);

  // Touch support
  components.push(navigator.maxTouchPoints?.toString() || '0');

  // Device memory (if available)
  components.push((navigator as any).deviceMemory?.toString() || 'unknown');

  // Pixel ratio
  components.push(window.devicePixelRatio?.toString() || '1');

  // Session storage support
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    components.push('sessionStorage:true');
  } catch {
    components.push('sessionStorage:false');
  }

  // Local storage support
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    components.push('localStorage:true');
  } catch {
    components.push('localStorage:false');
  }

  // IndexedDB support
  components.push(`indexedDB:${!!window.indexedDB}`);

  // Canvas fingerprint (lightweight version)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Grovara', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Grovara', 4, 17);
      const canvasData = canvas.toDataURL();
      // Use a simple hash of the canvas data
      components.push(`canvas:${simpleHash(canvasData)}`);
    }
  } catch {
    components.push('canvas:unavailable');
  }

  return components.join('|');
};

/**
 * Hash the fingerprint using Web Crypto API
 */
const hashFingerprint = async (fingerprint: string): Promise<string> => {
  try {
    // Use SubtleCrypto if available
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprint);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `grovara_${hashHex.substring(0, 32)}`;
    }
  } catch (error) {
    console.warn('SubtleCrypto not available, using simple hash');
  }

  // Fallback to simple hash
  return `grovara_${simpleHash(fingerprint)}`;
};

/**
 * Simple hash function (fallback)
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).padStart(16, '0').substring(0, 16);
};

/**
 * Generate a fallback UUID-like ID
 */
const generateFallbackId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `grovara_${timestamp}_${randomPart}`;
};

/**
 * Get the current device ID (synchronous version for quick access)
 */
export const getDeviceId = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem('grovara_device_id');
};

/**
 * Clear the device ID (for testing or user-requested data deletion)
 */
export const clearDeviceId = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem('grovara_device_id');
};

/**
 * Check if device ID exists
 */
export const hasDeviceId = (): boolean => {
  if (!isBrowser) return false;
  return !!localStorage.getItem('grovara_device_id');
};
