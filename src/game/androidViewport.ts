/**
 * Android Landscape, Fullscreen Immersive Mode & Screen Wake Lock helpers.
 * Safe across Android Chrome, Trusted Web Activity (TWA / Play Store APK),
 * Capacitor WebView, and desktop browsers.
 */

type LegacyDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type LegacyElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type LockableOrientation = {
  lock?: (orientation: 'landscape' | 'landscape-primary' | 'any') => Promise<void>;
};

let activeWakeLock: WakeLockSentinel | null = null;

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as LegacyDocument;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function enterAndroidLandscapeFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  let entered = isFullscreenActive();

  try {
    if (!entered) {
      const el = document.documentElement as LegacyElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        entered = true;
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
        entered = true;
      }
    }
  } catch {
    // Fullscreen may be unavailable in embedded previews or iOS Safari
  }

  try {
    const orient = window.screen?.orientation as unknown as LockableOrientation | undefined;
    if (orient?.lock) {
      await orient.lock('landscape');
    }
  } catch {
    // Orientation lock is only permitted on Android fullscreen/TWA contexts
  }

  return entered;
}

export async function exitFullscreenMode(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    const doc = document as LegacyDocument;
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // ignore
  }
}

export async function toggleFullscreenMode(): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitFullscreenMode();
    return false;
  }
  return enterAndroidLandscapeFullscreen();
}

export async function acquireScreenWakeLock(): Promise<void> {
  try {
    if (navigator.wakeLock && !activeWakeLock) {
      activeWakeLock = await navigator.wakeLock.request('screen');
    }
  } catch {
    // Wake Lock unsupported or denied
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (activeWakeLock) {
      await activeWakeLock.release();
      activeWakeLock = null;
    }
  } catch {
    activeWakeLock = null;
  }
}
