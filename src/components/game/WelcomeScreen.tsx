import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Medal, Settings, Share2 } from 'lucide-react';
import { getCurrentUser, setCurrentUser as setCurrentUserSession, UserSession } from '@/lib/leaderboardManager';
import { RegistrationGateModal } from './RegistrationGateModal';
import { SettingsModal } from './SettingsModal';
import { ShareModal } from './ShareModal';
import { FloatingProducts } from './FloatingProducts';
import { PuppyMascot } from './PuppyMascot';
import { ArcadeFloor } from './ArcadeFloor';
import { registerUser, checkUsernameAvailable } from '@/services/userService';
import { submitToLeadwise } from '@/services/leadwiseService';
import { toast } from 'sonner';
import { soundManager } from '@/lib/soundManager';

export const WelcomeScreen = () => {
  const { startGame, goToLeaderboard, loadUserByEmail } = useGame();
  const reduceMotion = useReducedMotion();
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const musicStartedRef = useRef(false);

  // Start music on the very first user interaction (click/tap anywhere)
  useEffect(() => {
    const startMusicOnce = () => {
      if (musicStartedRef.current) return;
      musicStartedRef.current = true;
      soundManager.playBackgroundMusic();
      document.removeEventListener('pointerdown', startMusicOnce);
      document.removeEventListener('touchstart', startMusicOnce);
    };

    document.addEventListener('pointerdown', startMusicOnce, { once: true });
    document.addEventListener('touchstart', startMusicOnce, { once: true });

    return () => {
      document.removeEventListener('pointerdown', startMusicOnce);
      document.removeEventListener('touchstart', startMusicOnce);
    };
  }, []);

  // Check session user on mount
  useEffect(() => {
    const user = getCurrentUser();
    setSessionUser(user);
    console.log('Session user:', user);
  }, []);

  const handleStartGame = async () => {
    soundManager.unlockAudio();
    soundManager.playBackgroundMusic();

    // If user already has a session, load their DB profile first, then start
    if (sessionUser) {
      // Populate useGameSession's userId/currentUser so leaderboard & swipes work
      const identifier = sessionUser.email || sessionUser.username;
      if (identifier) {
        await loadUserByEmail(identifier);
      }
      startGame();
      return;
    }

    // Otherwise show registration gate
    setShowRegistration(true);
  };

  /**
   * Generate a leaderboard username from firstName.
   * If "John" is taken, try "JohnS", then "JohnSm", etc.
   */
  const generateUsername = async (firstName: string, lastName: string): Promise<string> => {
    let candidate = firstName;
    const available = await checkUsernameAvailable(candidate);
    if (available) return candidate;

    // Append last initial(s)
    for (let i = 1; i <= lastName.length; i++) {
      candidate = firstName + lastName.slice(0, i).toUpperCase();
      const ok = await checkUsernameAvailable(candidate);
      if (ok) return candidate;
    }

    // Fallback: append random digits
    candidate = firstName + Math.floor(Math.random() * 1000);
    return candidate;
  };

  const handleRegisterUser = async (
    email: string,
    firstName: string,
    lastName: string,
    company: string
  ) => {
    try {
      const username = await generateUsername(firstName, lastName);

      // Register user in database
      const registeredUser = await registerUser(username, email, firstName, lastName, company);
      if (!registeredUser) {
        throw new Error('Failed to register user');
      }

      console.log('User registered:', registeredUser);

      // Set current user session (expanded)
      setCurrentUserSession(username, email, firstName, lastName, company);
      setSessionUser({ username, email, firstName, lastName, company });

      // Refresh useGameSession's currentUser so recordLevel uses the registered username
      await loadUserByEmail(email);

      // Fire-and-forget Leadwise CRM submission
      submitToLeadwise({ email, firstName, lastName, company });

      setShowRegistration(false);
      toast.success(`Welcome, ${firstName}! Let's play!`);

      // Start the game
      startGame();
    } catch (error) {
      console.error('Error registering user:', error);
      toast.error('Failed to create account. Please try again.');
      throw error;
    }
  };

  const handleLoadAccount = async (email: string): Promise<boolean> => {
    const loaded = await loadUserByEmail(email);
    if (loaded) {
      toast.success('Welcome back! Your account has been loaded.');
      setShowRegistration(false);
      // Refresh session user
      const user = getCurrentUser();
      setSessionUser(user);
      // Start the game
      startGame();
    }
    return loaded;
  };

  return (
    <div className="h-screen max-h-screen relative flex flex-col overflow-hidden" style={{ maxHeight: '100dvh' }}>
      {/* Arcade cabinet neon frame (decorative, non-blocking) */}
      <div
        className="fixed inset-0 z-[45] pointer-events-none"
        style={{
          boxShadow:
            'inset 0 0 0 2px rgba(255,61,240,0.55), inset 0 0 24px 3px rgba(255,61,240,0.3), inset 0 0 0 5px rgba(124,247,255,0.16), inset 0 0 60px 8px rgba(139,92,246,0.18)',
        }}
      />

      {/* CRT scanlines (static = essentially free) */}
      <div
        className="fixed inset-0 z-[44] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
          opacity: 0.5,
        }}
      />

      {/* Top Bar: Share with Friends (right) */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center justify-end px-3 sm:px-4"
        style={{ top: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-card/80 backdrop-blur-sm border-2 border-primary/40 hover:border-primary/80 transition-colors"
          aria-label="Share with Friends"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="text-[9px] sm:text-[10px] text-primary font-bold whitespace-nowrap" style={{ fontFamily: 'var(--font-pixel)' }}>
            Share with Friends
          </span>
        </motion.button>
      </div>

      {/* Settings - Bottom Right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSettings(true)}
        className="fixed right-3 sm:right-4 bottom-3 sm:bottom-4 z-50 p-2 sm:p-2.5 rounded-full bg-card/80 backdrop-blur-sm border-2 border-primary/40 hover:border-primary/80 transition-colors"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </motion.button>

      {/* Gradient Background Layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/home/gradient.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Stars Overlay Layer */}
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: 'url(/home/stars.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
        }}
      />

      {/* Synthwave grid-floor horizon */}
      <ArcadeFloor />

      {/* Floating Products Layer */}
      <FloatingProducts />

      {/* Gamified glow orbs — blurred, slow pulse (transform/opacity only = GPU cheap) */}
      <div className="absolute inset-0 z-[12] pointer-events-none overflow-hidden" style={{ mixBlendMode: 'screen' }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '55vw', height: '55vw', maxWidth: 420, maxHeight: 420,
            top: '8%', left: '-10%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(236,72,153,0) 70%)',
            willChange: 'transform, opacity',
          }}
          animate={reduceMotion ? {} : { scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '55vw', height: '55vw', maxWidth: 420, maxHeight: 420,
            top: '18%', right: '-12%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(139,92,246,0) 70%)',
            willChange: 'transform, opacity',
          }}
          animate={reduceMotion ? {} : { scale: [1.2, 1, 1.2], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '45vw', height: '45vw', maxWidth: 340, maxHeight: 340,
            top: '2%', left: '30%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0) 70%)',
            willChange: 'transform, opacity',
          }}
          animate={reduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </div>

      {/* Golden-retriever mascot greeter */}
      <PuppyMascot />

      {/* TOP SECTION - Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-30 flex flex-col items-center justify-center text-center pt-24 sm:pt-20 md:pt-16 lg:pt-20 pb-4 sm:pb-6 flex-1 min-h-0"
        style={{ paddingTop: 'max(6rem, calc(env(safe-area-inset-top) + 4.5rem))' }}
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mb-1 sm:mb-2 md:mb-3 px-4 sm:px-6 md:px-8"
        >
          {/* Grovara.com Logo */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <img
              src="/grovara-logo.svg"
              alt="Grovara"
              className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 drop-shadow-lg"
            />
            <h2
              className="text-lg sm:text-xl md:text-2xl font-normal text-white tracking-wide"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              GROVARA.COM
            </h2>
          </div>

          {/* Main Title — neon arcade marquee emblem */}
          <motion.div
            className="relative inline-block px-5 py-2 sm:px-7 sm:py-3"
            animate={reduceMotion ? {} : { scale: [1, 1.035, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              borderRadius: 14,
              background:
                'linear-gradient(180deg, rgba(20,10,40,0.55) 0%, rgba(40,15,60,0.35) 100%)',
              boxShadow:
                '0 0 0 2px rgba(255,61,240,0.6), 0 0 22px 2px rgba(255,61,240,0.35), inset 0 0 18px rgba(124,247,255,0.15)',
            }}
          >
            {/* Corner brackets */}
            {[
              'top-[-3px] left-[-3px] border-t-2 border-l-2 rounded-tl-md',
              'top-[-3px] right-[-3px] border-t-2 border-r-2 rounded-tr-md',
              'bottom-[-3px] left-[-3px] border-b-2 border-l-2 rounded-bl-md',
              'bottom-[-3px] right-[-3px] border-b-2 border-r-2 rounded-br-md',
            ].map((pos, i) => (
              <span
                key={i}
                aria-hidden
                className={`absolute w-3.5 h-3.5 sm:w-4 sm:h-4 ${pos}`}
                style={{ borderColor: '#7cf7ff', boxShadow: '0 0 8px rgba(124,247,255,0.7)' }}
              />
            ))}

            <h1
              className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider leading-tight overflow-hidden"
              style={{
                fontFamily: 'var(--font-pixel)',
                textShadow:
                  '3px 3px 0px rgba(0,0,0,0.85), 0 0 18px rgba(236,72,153,0.7), 0 0 34px rgba(124,247,255,0.4)',
                fontSize: 'clamp(1.5rem, 6.5vw, 3.5rem)',
              }}
            >
              EXPO HERO
              {/* Shine sweep */}
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.75) 48%, transparent 62%)',
                    mixBlendMode: 'screen',
                    willChange: 'transform',
                  }}
                  initial={{ x: '-120%' }}
                  animate={{ x: '120%' }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
                />
              )}
            </h1>
          </motion.div>
        </motion.div>

        {/* Tagline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-2 sm:mb-3 md:mb-4 px-4 sm:px-6 md:px-8"
        >
          <div className="text-center">
            <p className="text-primary font-bold leading-snug" style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.7rem, 3.8vw, 1.125rem)' }}>
              Slash the Slimy Broker-Jokers.<br /><br />Save The Goods.
            </p>
          </div>
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Start Mission Button */}
          <motion.div
            className="relative mt-3 sm:mt-4 md:mt-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
          >
            {/* Pulsing glow ring behind the button */}
            {!reduceMotion && (
              <motion.div
                aria-hidden
                className="absolute -inset-1 rounded-xl sm:rounded-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                  filter: 'blur(14px)',
                  willChange: 'transform, opacity',
                }}
                animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.98, 1.04, 0.98] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              animate={reduceMotion ? {} : { y: [0, -3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              onClick={handleStartGame}
              className="relative px-14 sm:px-20 md:px-24 py-3.5 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold text-white rounded-lg sm:rounded-xl overflow-hidden flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-pixel)',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0,0,0,0.4)',
                border: '3px solid rgba(255,255,255,0.35)',
              }}
            >
              <span className="relative z-10">▶ PLAY</span>
              {/* Diagonal shine sweep across the button */}
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
                    willChange: 'transform',
                  }}
                  initial={{ x: '-130%' }}
                  animate={{ x: '130%' }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                />
              )}
            </motion.button>
          </motion.div>

          {/* Tap-to-play hint */}
          <motion.p
            className="mt-2 sm:mt-3 text-white/70 text-[8px] sm:text-[10px] tracking-widest"
            style={{ fontFamily: 'var(--font-pixel)' }}
            animate={reduceMotion ? {} : { opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            TAP TO START
          </motion.p>
        </div>
      </motion.div>

      {/* BOTTOM SECTION - Characters & Footer */}
      <div className="relative z-20 flex-shrink-0" style={{ height: 'clamp(200px, 40vh, 400px)', minHeight: '200px' }}>
        {/* Villain Character - Left */}
        <motion.div
          className="absolute bottom-0 left-0 z-20 pointer-events-none"
          style={{ height: '100%', width: '60%' }}
          initial={{ x: -100, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            y: [0, -8, 0],
            rotate: [0, -2, 0, 2, 0],
          }}
          transition={{
            x: { duration: 0.8, delay: 0.2 },
            opacity: { duration: 0.8, delay: 0.2 },
            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
            rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
        >
          <img
            src="/home/villain.png"
            alt="Villain"
            className="w-full h-full object-contain object-bottom"
            style={{ objectPosition: 'bottom left', filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.45))' }}
          />
        </motion.div>

        {/* Bird Character - Right */}
        <motion.div
          className="absolute bottom-0 right-0 z-20 pointer-events-none"
          style={{ height: '100%', width: '60%' }}
          initial={{ x: 100, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            y: [0, -10, 0],
            rotate: [0, 3, 0, -3, 0],
          }}
          transition={{
            x: { duration: 0.8, delay: 0.2 },
            opacity: { duration: 0.8, delay: 0.2 },
            y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.3 },
            rotate: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.3 },
          }}
        >
          <img
            src="/home/bird.png"
            alt="Bird"
            className="w-full h-full object-contain object-bottom"
            style={{ objectPosition: 'bottom right', filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.45))' }}
          />
        </motion.div>

        {/* Bottom Gradient Overlay - MUST be on top of characters */}
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            backgroundImage: 'url(/home/home_gradient.png)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'bottom',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Footer - Positioned at bottom over gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-2 sm:bottom-4 md:bottom-6 left-0 right-0 z-40 text-center px-2 sm:px-4"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Footer Links */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-2 sm:mb-3" style={{ fontFamily: 'var(--font-pixel)' }}>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={goToLeaderboard}
              className="flex items-center gap-1 sm:gap-2 hover:text-white transition-colors text-gray-300 text-[10px] sm:text-xs md:text-sm"
            >
              <Medal className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">View Leaderboard</span>
            </motion.button>
          </div>

          <p
            className="text-gray-300 text-[9px] xs:text-[10px] sm:text-xs md:text-sm px-2"
            style={{ fontFamily: 'var(--font-pixel)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            <span className="inline-block">Powered by Grovara</span>
          </p>
        </motion.div>
      </div>

      {/* Registration Gate Modal */}
      <RegistrationGateModal
        isOpen={showRegistration}
        onRegister={handleRegisterUser}
        onLoadAccount={handleLoadAccount}
      />

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      <ShareModal
        open={showShare}
        onOpenChange={setShowShare}
      />
    </div>
  );
};
