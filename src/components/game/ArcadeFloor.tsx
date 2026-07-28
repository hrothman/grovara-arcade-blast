import { motion, useReducedMotion } from 'framer-motion';

/**
 * Synthwave perspective grid-floor horizon.
 *
 * The scrolling grid is a child of a `rotateX` wrapper, so animating the
 * child's `translateY` moves it *along the tilted plane* (toward the viewer) —
 * a pure compositor transform, so it stays smooth on mobile. A bright horizon
 * line + top fade blend it into the background.
 */
export const ArcadeFloor = () => {
  const reduce = useReducedMotion();

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[11] pointer-events-none overflow-hidden"
      style={{ height: '60%' }}
    >
      {/* Glowing horizon line where the floor meets the sky */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '32%',
          height: 2,
          background:
            'linear-gradient(90deg, transparent, #ff3df0 20%, #7cf7ff 50%, #ff3df0 80%, transparent)',
          boxShadow: '0 0 22px 5px rgba(255,61,240,0.55)',
          opacity: 0.8,
        }}
      />

      {/* Perspective grid plane */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: '32%', perspective: 340, perspectiveOrigin: '50% 0%' }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: 'rotateX(75deg)', transformOrigin: 'center bottom' }}
        >
          <motion.div
            className="absolute left-1/2 bottom-0"
            style={{
              width: '300%',
              height: '220%',
              marginLeft: '-150%',
              backgroundImage:
                'linear-gradient(rgba(236,72,153,0.6) 2px, transparent 2px), linear-gradient(90deg, rgba(124,247,255,0.45) 2px, transparent 2px)',
              backgroundSize: '52px 52px',
              willChange: 'transform',
            }}
            animate={reduce ? {} : { y: ['0px', '52px'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Fade the far grid softly into the sky */}
      <div
        className="absolute inset-x-0"
        style={{
          top: '32%',
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(15,10,30,0.85), transparent)',
        }}
      />
    </div>
  );
};
