import { motion } from 'framer-motion';
import { Play, ShieldCheck, Banana, Flame } from 'lucide-react';
import { DOG_IMAGE } from './HealerDog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InstructionsModalProps {
  isOpen: boolean;
  onStart: () => void;
}

export const InstructionsModal = ({ isOpen, onStart }: InstructionsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[92vw] max-w-sm sm:max-w-md max-h-[88vh] bg-card/95 backdrop-blur-md neon-border p-0 overflow-y-auto rounded-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <div className="relative">
          <div className="absolute inset-0 gradient-radial-glow opacity-20 pointer-events-none" />

          <div className="relative px-4 py-5 sm:p-6">
            <DialogHeader className="space-y-1 mb-4 sm:mb-5">
              <DialogTitle className="arcade-text text-lg sm:text-2xl text-foreground neon-glow flex items-center gap-2 justify-center">
                How to Play
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5 sm:space-y-3">
              {/* Instruction 1: Slice the slimes */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2.5 sm:gap-3 bg-muted/30 rounded-lg p-2.5 sm:p-3 border border-border/50"
              >
                <img src="/enemies/broker.png" alt="Broker Joker" className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" />
                <p className="text-foreground text-xs sm:text-sm leading-snug">
                  <span className="font-bold text-red-400">Slash the slimes</span> — swipe the Broker Jokers (red glow) to score!
                </p>
              </motion.div>

              {/* Instruction 2: Protect products */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2.5 sm:gap-3 bg-muted/30 rounded-lg p-2.5 sm:p-3 border border-border/50"
              >
                <ShieldCheck className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400 flex-shrink-0" />
                <p className="text-foreground text-xs sm:text-sm leading-snug">
                  <span className="font-bold text-emerald-400">Protect</span> products (green glow) — slicing them costs a life!
                </p>
              </motion.div>

              {/* Instruction 3: Dancing Banana */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2.5 sm:gap-3 bg-muted/30 rounded-lg p-2.5 sm:p-3 border border-yellow-500/30"
                style={{ background: 'rgba(255, 215, 0, 0.08)' }}
              >
                <Banana className="w-7 h-7 sm:w-9 sm:h-9 text-yellow-400 flex-shrink-0" />
                <p className="text-foreground text-xs sm:text-sm leading-snug">
                  <span className="font-bold text-yellow-400">Catch the Banana!</span> — a dancing banana flies by randomly. Slash it for <span className="font-bold text-yellow-300">+2000 pts!</span>
                </p>
              </motion.div>

              {/* Instruction 4: Hot streak = extra time */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-2.5 sm:gap-3 bg-muted/30 rounded-lg p-2.5 sm:p-3 border border-orange-500/30"
                style={{ background: 'rgba(255, 140, 0, 0.08)' }}
              >
                <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-orange-400 fill-orange-400/40 flex-shrink-0" />
                <p className="text-foreground text-xs sm:text-sm leading-snug">
                  <span className="font-bold text-orange-400">Stay hot!</span> — slash 5 jokers in a row
                  without losing a heart to earn{' '}
                  <span className="font-bold text-emerald-300">+5 seconds</span> (once per level). Lose a
                  heart and the streak resets.
                </p>
              </motion.div>

              {/* Instruction 5: The healer dog */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2.5 sm:gap-3 rounded-lg p-2.5 sm:p-3 border border-emerald-500/40"
                style={{ background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <img
                  src={DOG_IMAGE}
                  alt="Healer dog"
                  className="w-9 h-9 sm:w-11 sm:h-11 object-contain flex-shrink-0"
                />
                <p className="text-foreground text-xs sm:text-sm leading-snug">
                  <span className="font-bold text-emerald-400">Never slash the dog!</span> — when you&apos;re
                  hurt he comes to help and the game pauses. Just{' '}
                  <span className="font-bold text-emerald-300">hold your finger on him</span> to get a heart
                  back. Swipe him fast and he runs off.
                </p>
              </motion.div>

              {/* Start Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onStart}
                className="btn-arcade w-full text-sm sm:text-lg flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-5 py-2.5 sm:py-3"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Playing!
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
