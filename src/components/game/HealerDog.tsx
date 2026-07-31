import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/soundManager';

/**
 * The healer dog.
 *
 * Everything else in this game is destroyed by a fast slash. The dog inverts
 * that: it is *not* a cut target. He trots in, sits, and waits — you restore a
 * heart by resting a finger on him for half a second. Slash him like an enemy
 * and he yelps, bolts, and takes points with him.
 *
 * Two rules keep this from fighting the rest of the game:
 *
 *  1. **Hold, don't stroke.** Petting needs no movement and no precision — a
 *     resting finger is already the opposite of a slash, so the gesture reads
 *     correctly without asking the player to control their swipe speed.
 *     (A slow drag counts too; only a genuinely fast swipe scares him.)
 *  2. **His visit is a calm beat.** The parent pauses spawning, freezes the
 *     level clock and stops penalising escapes while he's here (see
 *     onVisitChange), so stopping to pet him never costs anything. Without
 *     that, petting would just be a distraction that loses you two hearts to
 *     win back one.
 *
 * Mount this with key={level} so each level gets a fresh chance at a visit.
 */

export const DOG_IMAGE = '/healer/healer-dog.png';

// MIN_SWIPE_SPEED in GameCanvas is 0.5 px/ms — contact at or under
// GENTLE_MAX_SPEED therefore cannot slice anything while you pet.
const GENTLE_MAX_SPEED = 0.45;   // px/ms — still counts as petting
const YELP_SPEED = 0.9;          // px/ms — counts as a slash
const STILL_AFTER_MS = 70;       // no pointermove for this long = finger at rest
const PET_MS_REQUIRED = 500;     // contact needed to heal
const DOG_HEIGHT = 150;          // rendered px
const DOG_WIDTH = 108;
const PET_RADIUS = 82;           // generous: easy to pet
const YELP_RADIUS = 56;          // strict: hard to scare him by accident
const STAY_MS = 5200;            // how long he waits to be petted
const WALK_MS = 700;             // trot in / trot out
const SLASH_PENALTY = 150;
const VISIT_CHANCE = 0.75;       // not every level

type Phase = 'hidden' | 'arriving' | 'waiting' | 'healed' | 'hurt' | 'leaving';

interface HealerDogProps {
  /** Level is running (not sitting behind the instructions modal). */
  active: boolean;
  /** Current hearts — the dog only shows up when there is damage to undo. */
  lives: number;
  maxLives: number;
  /** Milliseconds left in the level; it won't appear with no time to pet it. */
  getTimeLeftMs: () => number;
  /** Restore a heart. Returns false if there was nothing to restore. */
  onHeal: () => boolean;
  /** Score change from slashing the dog (negative). */
  onScorePenalty: (points: number) => void;
  /**
   * True while he's on screen. The parent uses this to hold the level still —
   * no spawns, no clock, no escape penalties — so petting costs nothing.
   */
  onVisitChange: (visiting: boolean) => void;
}

export const HealerDog = ({
  active,
  lives,
  maxLives,
  getTimeLeftMs,
  onHeal,
  onScorePenalty,
  onVisitChange,
}: HealerDogProps) => {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [petProgress, setPetProgress] = useState(0);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const [spotX, setSpotX] = useState(0);

  const phaseRef = useRef<Phase>('hidden');
  const petMsRef = useRef(0);
  const dogCenterRef = useRef({ x: 0, y: 0 });
  const spawnedRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  // Props that change identity every render, kept in refs so the effects below
  // don't re-subscribe (and wipe their timers) on each parent re-render.
  const livesRef = useRef(lives);
  const getTimeLeftMsRef = useRef(getTimeLeftMs);
  const onHealRef = useRef(onHeal);
  const onScorePenaltyRef = useRef(onScorePenalty);
  const onVisitChangeRef = useRef(onVisitChange);
  useEffect(() => {
    livesRef.current = lives;
    getTimeLeftMsRef.current = getTimeLeftMs;
    onHealRef.current = onHeal;
    onScorePenaltyRef.current = onScorePenalty;
    onVisitChangeRef.current = onVisitChange;
  });

  // Hold the level still for the whole visit, and always hand it back — even
  // if the component unmounts mid-visit (level ended, game over).
  useEffect(() => {
    const visiting = phase !== 'hidden';
    onVisitChangeRef.current(visiting);
  }, [phase]);
  useEffect(() => () => onVisitChangeRef.current(false), []);

  const setPhaseSafe = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const leave = useCallback(() => {
    setPhaseSafe('leaving');
    addTimer(() => setPhaseSafe('hidden'), WALK_MS);
  }, [addTimer, setPhaseSafe]);

  // ── Spawn scheduling ──────────────────────────────────────────────────
  // Once per level, at a random moment, but only while the player is actually
  // down a heart — so it polls instead of firing blind, and can still show up
  // if the damage happens after its scheduled slot.
  useEffect(() => {
    if (!active || spawnedRef.current) return;
    if (Math.random() > VISIT_CHANCE) {
      spawnedRef.current = true;
      return;
    }

    const trySpawn = () => {
      if (spawnedRef.current) return;

      const timeLeft = getTimeLeftMsRef.current();
      if (livesRef.current >= maxLives || livesRef.current <= 0) {
        // Full health (or already out) — check again shortly, if there's still
        // enough level left for a visit to be worth anything.
        if (timeLeft > 8000) addTimer(trySpawn, 1000);
        return;
      }
      if (timeLeft < 8000) return; // too late in the level

      spawnedRef.current = true;
      const w = window.innerWidth;
      const fromLeft = Math.random() < 0.5;
      // Sit in the outer band of the screen: products and jokers are thrown
      // from the middle 70%, so the dog is out of the main slashing lane.
      const inset = w * 0.02 + Math.random() * (w * 0.1);
      setSide(fromLeft ? 'left' : 'right');
      setSpotX(fromLeft ? inset : w - DOG_WIDTH - inset);
      petMsRef.current = 0;
      setPetProgress(0);
      setPhaseSafe('arriving');
      soundManager.playSound('dogHappy');

      addTimer(() => {
        if (phaseRef.current === 'arriving') setPhaseSafe('waiting');
      }, WALK_MS);

      // Leave when the window is up — unless a pet is already underway, in
      // which case give it a moment to land rather than walking off mid-stroke.
      const leaveWhenIdle = () => {
        if (phaseRef.current !== 'waiting') return;
        if (petMsRef.current > 0) {
          addTimer(leaveWhenIdle, 700);
          return;
        }
        leave();
      };
      addTimer(leaveWhenIdle, WALK_MS + STAY_MS);
    };

    addTimer(trySpawn, 4000 + Math.random() * 6000); // first look 4-10s in
  }, [active, maxLives, addTimer, leave, setPhaseSafe]);

  // ── Pointer handling: rest a finger on him = heal, slash = yelp ────────
  useEffect(() => {
    if (phase !== 'waiting') return;

    // Live contact state. A still finger fires no pointermove events at all,
    // so the fill is driven by an animation frame loop reading this instead.
    const contact = { down: false, x: 0, y: 0, speed: 0, lastMoveT: 0 };
    let frame = 0;
    let lastFrameT = performance.now();

    const measureDog = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      dogCenterRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    measureDog();

    const distToDog = (x: number, y: number) => {
      const c = dogCenterRef.current;
      return Math.hypot(x - c.x, y - c.y);
    };

    const onDown = (e: PointerEvent) => {
      contact.down = true;
      contact.x = e.clientX;
      contact.y = e.clientY;
      contact.speed = 0;
      contact.lastMoveT = performance.now();
    };
    const onUp = () => { contact.down = false; };

    const onMove = (e: PointerEvent) => {
      if (!contact.down || phaseRef.current !== 'waiting') return;

      const now = performance.now();
      const dt = now - contact.lastMoveT;
      if (dt <= 0) return;
      const speed = Math.hypot(e.clientX - contact.x, e.clientY - contact.y) / dt;
      contact.x = e.clientX;
      contact.y = e.clientY;
      contact.speed = speed;
      contact.lastMoveT = now;

      const dist = distToDog(e.clientX, e.clientY);
      if (speed >= YELP_SPEED && dist <= YELP_RADIUS) {
        // Slashed. He's unharmed but scared off — and the heal is gone.
        contact.down = false;
        setPhaseSafe('hurt');
        soundManager.playSound('dogYelp');
        onScorePenaltyRef.current(-SLASH_PENALTY);
        addTimer(leave, 1000);
      }
    };

    // Fill while a finger rests on him (or drags gently across him).
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(now - lastFrameT, 100);
      lastFrameT = now;
      if (phaseRef.current !== 'waiting') return;

      // No movement for a moment means the finger has settled.
      if (now - contact.lastMoveT > STILL_AFTER_MS) contact.speed = 0;

      const petting =
        contact.down &&
        contact.speed <= GENTLE_MAX_SPEED &&
        distToDog(contact.x, contact.y) <= PET_RADIUS;

      if (!petting) {
        // Let go and the meter drains — keeps the gesture honest, and lets
        // him eventually wander off if the player never finishes.
        if (petMsRef.current > 0) {
          petMsRef.current = Math.max(0, petMsRef.current - dt * 0.9);
          setPetProgress(Math.min(1, petMsRef.current / PET_MS_REQUIRED));
        }
        return;
      }

      petMsRef.current += dt;
      setPetProgress(Math.min(1, petMsRef.current / PET_MS_REQUIRED));

      if (petMsRef.current >= PET_MS_REQUIRED) {
        setPhaseSafe('healed');
        const healed = onHealRef.current();
        soundManager.playSound(healed ? 'heal' : 'dogHappy');
        soundManager.playSound('dogHappy');
        addTimer(leave, 1500);
      }
    };
    frame = requestAnimationFrame(tick);

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    document.addEventListener('pointermove', onMove);
    window.addEventListener('resize', measureDog);
    // He bobs and the layout can shift; keep his hit centre fresh.
    const remeasure = window.setInterval(measureDog, 400);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', measureDog);
      clearInterval(remeasure);
    };
  }, [phase, addTimer, leave, setPhaseSafe]);

  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  if (phase === 'hidden') return null;

  const offscreenX = side === 'left' ? -DOG_WIDTH - 60 : window.innerWidth + 60;
  const targetX = phase === 'leaving' ? offscreenX : spotX;

  return (
    <>
      <motion.div
        ref={wrapRef}
        initial={{ x: offscreenX, opacity: 0 }}
        animate={{ x: targetX, opacity: phase === 'leaving' ? 0 : 1 }}
        transition={{ duration: WALK_MS / 1000, ease: phase === 'leaving' ? 'easeIn' : 'easeOut' }}
        className="absolute z-[65] pointer-events-none"
        style={{
          bottom: '8%',
          left: 0,
          width: DOG_WIDTH,
          height: DOG_HEIGHT,
          willChange: 'transform',
        }}
      >
        {/* Healing aura — green/gold, never enemy red */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: DOG_WIDTH * 1.9,
            height: DOG_WIDTH * 1.9,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(255,215,0,0.16) 45%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />

        <motion.img
          src={DOG_IMAGE}
          alt="Healer dog"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            filter:
              phase === 'hurt'
                ? 'drop-shadow(0 0 12px rgba(255,90,90,0.9)) saturate(0.6)'
                : 'drop-shadow(0 0 14px rgba(16,185,129,0.7)) drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
            transform: side === 'right' ? 'scaleX(-1)' : undefined,
          }}
          animate={
            phase === 'healed'
              ? { y: [0, -18, 0, -12, 0], rotate: [0, -6, 6, -3, 0] }
              : phase === 'hurt'
              ? { x: [0, -10, 8, -6, 0], rotate: [0, -8, 4, 0] }
              : { y: [0, -5, 0], rotate: [0, 1.5, 0, -1.5, 0] }
          }
          transition={
            phase === 'healed' || phase === 'hurt'
              ? { duration: 0.6 }
              : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }
        />

        {/* Petting progress */}
        {phase === 'waiting' && petProgress > 0 && (
          <div
            className="absolute left-1/2 rounded-full overflow-hidden"
            style={{
              bottom: -14,
              transform: 'translateX(-50%)',
              width: 76,
              height: 7,
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <div
              className="h-full"
              style={{
                width: `${petProgress * 100}%`,
                background: 'linear-gradient(90deg, #10b981, #ffd700)',
                transition: 'width 80ms linear',
              }}
            />
          </div>
        )}
      </motion.div>

      {/* "PET ME" call-out above the dog */}
      <AnimatePresence>
        {phase === 'waiting' && (
          <motion.div
            key="pet-me"
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="absolute z-[66] pointer-events-none"
            style={{
              left: spotX + DOG_WIDTH / 2,
              bottom: `calc(8% + ${DOG_HEIGHT + 18}px)`,
              transform: 'translateX(-50%)',
            }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="px-3 py-1.5 rounded-xl text-center whitespace-nowrap"
              style={{
                background: 'rgba(6, 30, 22, 0.88)',
                border: '1px solid rgba(16,185,129,0.7)',
                boxShadow: '0 0 18px rgba(16,185,129,0.35)',
              }}
            >
              <p
                className="text-emerald-300 font-bold text-[11px] tracking-wide"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                HOLD TO PET — DON&apos;T SLASH!
              </p>
              <p className="text-white/70 text-[10px] mt-0.5">
                Rest your finger on him for ❤️ +1 · game paused
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outcome banner */}
      <AnimatePresence>
        {(phase === 'healed' || phase === 'hurt') && (
          <motion.div
            key={`dog-${phase}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.35, ease: 'backOut' }}
            className="absolute z-[70] pointer-events-none text-center w-full px-6"
            style={{ left: 0, top: '38%' }}
          >
            {phase === 'healed' ? (
              <>
                <motion.p
                  className="text-4xl font-black"
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    background: 'linear-gradient(135deg, #34d399, #ffd700)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 10px rgba(16,185,129,0.6))',
                  }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  +1 ❤️
                </motion.p>
                <p
                  className="text-sm font-bold text-emerald-300 mt-1"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  GOOD HUMAN!
                </p>
              </>
            ) : (
              <>
                <p
                  className="text-2xl font-black text-red-300"
                  style={{ fontFamily: 'var(--font-pixel)', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}
                >
                  EASY! 🐾
                </p>
                <p className="text-xs font-bold text-red-200/90 mt-1">
                  Never slash the dog — pet gently next time (−{SLASH_PENALTY})
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
