import { useCallback, useEffect, useRef, useState } from 'react';

interface UseNewOrderSoundOptions {
  /** Path to the alert sound file, served from /public */
  soundUrl?: string;
  /** How often (ms) to re-play the sound while still ringing */
  intervalMs?: number;
}

interface UseNewOrderSoundResult {
  /** True while there are unacknowledged new orders */
  isRinging: boolean;
  /** Count of new orders that arrived since ringing started */
  newOrderCount: number;
  /** True once the browser has allowed audio playback (after a user gesture) */
  soundUnlocked: boolean;
  /** Call this from a button click to unlock autoplay */
  enableSound: () => void;
  /** Call this to silence the alert manually (e.g. "Stop" button) */
  stopRinging: () => void;
}

/**
 * Watches a list of PENDING order IDs and rings an alert sound whenever new
 * IDs appear that weren't present on the previous check (e.g. after a poll).
 *
 * The ring keeps going — no max-time cutoff — and stops automatically the
 * moment the triggering order(s) leave `orderIds` (i.e. get accepted /
 * rejected / moved out of pending status). A manual `stopRinging()` is also
 * exposed in case you want a "Stop" button as a fallback.
 *
 * Usage:
 *   const pendingOrderIds = orders
 *     .filter(o => o.status === 'pending')
 *     .map(o => o.id);
 *
 *   const { isRinging, newOrderCount, soundUnlocked, enableSound, stopRinging } =
 *     useNewOrderSound(pendingOrderIds, { soundUrl: '/order_ring.mp3' });
 */
export function useNewOrderSound(
  orderIds: number[],
  options: UseNewOrderSoundOptions = {}
): UseNewOrderSoundResult {
  const { soundUrl = '/order_ring.mp3', intervalMs = 4000 } = options;

  const [isRinging, setIsRinging] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownIdsRef = useRef<Set<number> | null>(null);
  // The specific order IDs currently causing the ring (still unresolved)
  const ringingOrderIdsRef = useRef<Set<number>>(new Set());
  const ringIntervalRef = useRef<number | null>(null);

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio(soundUrl);
    audio.loop = false;
    audio.addEventListener('error', () => {
      console.error(
        '[useNewOrderSound] audio failed to load. Check the file exists at:',
        soundUrl,
        audio.error
      );
    });
    audioRef.current = audio;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [soundUrl]);

  const playSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      // Autoplay blocked — user hasn't clicked "Enable Sound" yet
      console.error('[useNewOrderSound] playSound failed:', err);
    });
  }, []);

  // Unlock autoplay: browsers require a real user gesture before audio
  // can play without interaction. Calling this from a button's onClick
  // satisfies that requirement.
  const enableSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('[useNewOrderSound] enableSound: audio element not ready');
      return;
    }
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        setSoundUnlocked(true);
        console.log('[useNewOrderSound] sound unlocked successfully');
      })
      .catch((err) => {
        console.error('[useNewOrderSound] enableSound failed. name:', err.name, 'message:', err.message);
        setSoundUnlocked(false);
      });
  }, []);

  const stopRinging = useCallback(() => {
    setIsRinging(false);
    setNewOrderCount(0);
    ringingOrderIdsRef.current.clear();
    if (ringIntervalRef.current !== null) {
      window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  // Detect newly-arrived order IDs, and detect when previously-ringing
  // orders have left the pending list (accepted/rejected). Use a joined
  // string as the dependency so this only re-runs when the actual set of
  // IDs changes, not on every render (a fresh .filter().map() array is a
  // new reference each time even if the contents are identical).
  const idsKey = orderIds.join(',');
  useEffect(() => {
    const currentIds = new Set(orderIds);

    // First run: just remember the current snapshot, don't ring for
    // orders that already existed before this hook mounted.
    if (knownIdsRef.current === null) {
      knownIdsRef.current = currentIds;
      return;
    }

    const previousIds = knownIdsRef.current;
    const newlyArrived = orderIds.filter((id) => !previousIds.has(id));

    // Any order that was ringing but is no longer in the pending list
    // must have been accepted/rejected — drop it from the ringing set.
    ringingOrderIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) ringingOrderIdsRef.current.delete(id);
    });

    if (newlyArrived.length > 0) {
      newlyArrived.forEach((id) => ringingOrderIdsRef.current.add(id));
      setNewOrderCount((prev) => prev + newlyArrived.length);
      setIsRinging(true);
      if (soundUnlocked) playSound();
    }

    // All triggering orders have been resolved (accepted/rejected) —
    // stop the ring automatically.
    if (ringingOrderIdsRef.current.size === 0 && isRinging) {
      stopRinging();
    }

    knownIdsRef.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, soundUnlocked, playSound]);

  // Keep re-playing the sound at an interval while ringing, until the
  // order is accepted/rejected (isRinging becomes false above).
  useEffect(() => {
    if (isRinging && soundUnlocked) {
      ringIntervalRef.current = window.setInterval(() => {
        playSound();
      }, intervalMs);
    }
    return () => {
      if (ringIntervalRef.current !== null) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [isRinging, soundUnlocked, intervalMs, playSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ringIntervalRef.current !== null) {
        window.clearInterval(ringIntervalRef.current);
      }
    };
  }, []);

  return { isRinging, newOrderCount, soundUnlocked, enableSound, stopRinging };
}