import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Medal, Settings, Share2 } from 'lucide-react';
import { getCurrentUser, setCurrentUser as setCurrentUserSession, UserSession } from '@/lib/leaderboardManager';
import { RegistrationGateModal } from './RegistrationGateModal';
import { SettingsModal } from './SettingsModal';
import { ShareModal } from './ShareModal';
import { FloatingProducts } from './FloatingProducts';
import { registerUser, checkUsernameAvailable } from '@/services/userService';
import { submitToLeadwise } from '@/services/leadwiseService';
import { toast } from 'sonner';
import { soundManager } from '@/lib/soundManager';
import { preloadGameImages } from '@/lib/assetLoader';

export const WelcomeScreen = () => {
  const { startGame, goToLeaderboard, loadUserByEmail } = useGame();
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

  // Warm the browser cache with all game art while the player is on the
  // welcome screen, so hitting "Play" jumps straight into the game with
  // no visible loading bar. Fire-and-forget — never blocks the UI.
  useEffect(() => {
    preloadGameImages();
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
      {/* Top Bar: Sweets & Snacks Expo branding (left) + Share with Friends (right) */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-4"
        style={{ top: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        {/* Sweets & Snacks Expo Logo - Top Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-full bg-white/90 backdrop-blur-sm border-2 border-primary/40 p-1 sm:p-1.5"
        >
          <img
            src="/home/sse-logo-header-final-1-215x221-1.png"
            alt="Sweets & Snacks Expo"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </motion.div>

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

      {/* Floating Products Layer */}
      <FloatingProducts />

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

          {/* Main Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-0.5 sm:mb-1 tracking-wider leading-tight px-2"
            style={{
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.5rem, 6.5vw, 3.5rem)',
            }}
          >
            B3B BLASTER
          </h1>
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

        {/* Announcement Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mx-4 sm:mx-6 md:mx-8 mb-1"
        >
          <motion.div
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border-2 border-warning/60 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
            }}
            animate={{
              borderColor: ['rgba(255,215,0,0.6)', 'rgba(236,72,153,0.6)', 'rgba(255,215,0,0.6)'],
              boxShadow: [
                '0 0 20px rgba(255,215,0,0.2)',
                '0 0 20px rgba(236,72,153,0.2)',
                '0 0 20px rgba(255,215,0,0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p
              className="text-warning font-bold leading-tight"
              style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.8rem, 4vw, 1.15rem)' }}
            >
              Sweets &amp; Snacks Expo
            </p>
            <p
              className="text-white/90 font-bold mt-1 leading-tight"
              style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.6rem, 2.8vw, 0.8rem)' }}
            >
              Las Vegas, Nevada
            </p>
          </motion.div>
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Start Mission Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="px-12 sm:px-16 md:px-20 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg font-bold text-white rounded-lg sm:rounded-xl relative overflow-hidden mt-3 sm:mt-4 md:mt-5"
            style={{
              fontFamily: 'var(--font-pixel)',
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0,0,0,0.4)',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            PLAY
          </motion.button>
        </div>
      </motion.div>

      {/* BOTTOM SECTION - Characters & Footer */}
      <div className="relative z-20 flex-shrink-0" style={{ height: 'clamp(200px, 40vh, 400px)', minHeight: '200px' }}>
        {/* Villain Character - Left (recoils, irritated, when the bird goads him) */}
        <motion.div
          className="absolute bottom-0 left-0 z-20 pointer-events-none"
          style={{ height: '100%', width: '60%' }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ x: { duration: 0.8, delay: 0.2 }, opacity: { duration: 0.8, delay: 0.2 } }}
        >
          {/* Irritation symbols above the hat — pop on each jab beat */}
          <motion.div
            aria-hidden
            className="absolute"
            style={{ left: '32%', top: '4%', fontSize: 'clamp(1.1rem, 5vw, 2rem)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
            animate={{
              opacity: [0, 0, 0, 1, 0.35, 1, 0, 0],
              scale: [0.4, 0.4, 0.5, 1.2, 0.85, 1.25, 0.5, 0.4],
              rotate: [0, 0, 0, -10, 4, -12, 0, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
          >
            💢
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute"
            style={{ left: '46%', top: '10%', fontSize: 'clamp(0.8rem, 3.6vw, 1.4rem)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
            animate={{
              opacity: [0, 0, 0, 0.9, 0.2, 0.95, 0, 0],
              scale: [0.3, 0.3, 0.4, 1, 0.7, 1.05, 0.4, 0.3],
              y: [0, 0, 0, -4, 2, -6, 0, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
          >
            💦
          </motion.div>

          {/* Cowering / recoil choreography — synced to the bird's jabs */}
          <motion.div
            className="w-full h-full"
            style={{ transformOrigin: 'bottom center' }}
            animate={{
              x: [0, 0, 0, '-7%', '-2%', '-9%', 0, 0],
              y: [0, -6, 0, 7, 3, 8, 0, 0],
              rotate: [0, -2, 0, -9, -4, -11, 0, 0],
              scale: [1, 1, 1, 0.95, 0.98, 0.93, 1, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
          >
            <motion.img
              src="/home/villain.png"
              alt="Villain"
              className="w-full h-full object-contain object-bottom"
              style={{ objectPosition: 'bottom left' }}
              animate={{
                filter: [
                  'drop-shadow(0 0 8px rgba(236,72,153,0.6)) hue-rotate(0deg) brightness(1)',
                  'drop-shadow(0 0 14px rgba(139,92,246,0.6)) hue-rotate(15deg) brightness(1)',
                  'drop-shadow(0 0 10px rgba(236,72,153,0.5)) hue-rotate(0deg) brightness(1)',
                  'drop-shadow(0 0 22px rgba(239,68,68,0.85)) hue-rotate(-25deg) brightness(1.12)',
                  'drop-shadow(0 0 12px rgba(236,72,153,0.5)) hue-rotate(0deg) brightness(1)',
                  'drop-shadow(0 0 22px rgba(239,68,68,0.85)) hue-rotate(-25deg) brightness(1.12)',
                  'drop-shadow(0 0 8px rgba(236,72,153,0.6)) hue-rotate(0deg) brightness(1)',
                  'drop-shadow(0 0 8px rgba(236,72,153,0.6)) hue-rotate(0deg) brightness(1)',
                ],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
            />
          </motion.div>
        </motion.div>

        {/* Bird Character - Right (a serene deity that goads the broker) */}
        <motion.div
          className="absolute bottom-0 right-0 z-20 pointer-events-none"
          style={{ height: '100%', width: '60%' }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ x: { duration: 0.8, delay: 0.2 }, opacity: { duration: 0.8, delay: 0.2 } }}
        >
          {/* Divine aura / halo behind the bird */}
          <motion.div
            aria-hidden
            className="absolute rounded-full"
            style={{
              right: '4%',
              bottom: '6%',
              width: '78%',
              height: '78%',
              background:
                'radial-gradient(circle, rgba(255,236,170,0.6) 0%, rgba(255,205,90,0.3) 38%, rgba(255,205,90,0) 70%)',
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.32, 0.4, 0.5, 0.9, 0.55, 0.95, 0.4, 0.32],
              scale: [1, 1.05, 1.08, 1.28, 1.12, 1.3, 1.05, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
          />

          {/* Angry red aura — erupts on each jab at the broker */}
          <motion.div
            aria-hidden
            className="absolute rounded-full"
            style={{
              right: '2%',
              bottom: '4%',
              width: '86%',
              height: '86%',
              background:
                'radial-gradient(circle, rgba(255,70,45,0.7) 0%, rgba(225,30,30,0.4) 40%, rgba(225,30,30,0) 72%)',
              filter: 'blur(10px)',
              mixBlendMode: 'screen',
            }}
            animate={{
              opacity: [0, 0.04, 0.12, 0.9, 0.32, 0.95, 0.1, 0],
              scale: [0.9, 0.95, 1.02, 1.34, 1.12, 1.36, 1.0, 0.9],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
          />

          {/* Twinkling sparkles */}
          {[
            { left: '24%', top: '20%', size: '1.4rem', delay: 0 },
            { left: '60%', top: '10%', size: '1rem', delay: 0.8 },
            { left: '44%', top: '32%', size: '1.2rem', delay: 1.6 },
            { left: '14%', top: '40%', size: '0.9rem', delay: 2.4 },
          ].map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute"
              style={{ left: s.left, top: s.top, fontSize: s.size, filter: 'drop-shadow(0 0 4px rgba(255,220,120,0.8))' }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], y: [0, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
            >
              ✨
            </motion.span>
          ))}

          {/* Goad choreography — winds up, then double beak-jab toward the broker */}
          <motion.div
            className="w-full h-full"
            style={{ transformOrigin: 'bottom center' }}
            animate={{
              x: [0, 0, '2%', '-15%', '-4%', '-17%', 0, 0],
              y: [0, -10, -6, 12, 5, 13, 0, 0],
              rotate: [0, 3, 7, -13, -5, -15, 0, 0],
              scale: [1, 1.01, 1.04, 1.15, 1.06, 1.17, 1, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
          >
            <motion.img
              src="/home/bird.png"
              alt="Bird"
              className="w-full h-full object-contain object-bottom"
              style={{ objectPosition: 'bottom right' }}
              animate={{
                filter: [
                  'drop-shadow(0 0 10px rgba(255,215,120,0.7)) brightness(1)',
                  'drop-shadow(0 0 16px rgba(255,235,170,0.8)) brightness(1.05)',
                  'drop-shadow(0 0 20px rgba(255,225,140,0.85)) brightness(1.08)',
                  'drop-shadow(0 0 34px rgba(255,55,40,1)) brightness(1.16) saturate(1.3)',
                  'drop-shadow(0 0 18px rgba(255,150,90,0.85)) brightness(1.06) saturate(1.1)',
                  'drop-shadow(0 0 36px rgba(255,45,35,1)) brightness(1.2) saturate(1.35)',
                  'drop-shadow(0 0 12px rgba(255,215,120,0.7)) brightness(1)',
                  'drop-shadow(0 0 10px rgba(255,215,120,0.7)) brightness(1)',
                ],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2, times: [0, 0.42, 0.5, 0.56, 0.62, 0.68, 0.76, 1] }}
            />
          </motion.div>
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
