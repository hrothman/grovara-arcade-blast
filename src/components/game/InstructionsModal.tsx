import { motion } from 'framer-motion';
import { Play, ShieldCheck } from 'lucide-react';
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
        className="sm:max-w-md bg-card/95 backdrop-blur-md neon-border p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <div className="relative">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 gradient-radial-glow opacity-20 pointer-events-none" />

          <div className="relative p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="arcade-text text-2xl text-foreground neon-glow flex items-center gap-2 justify-center">
                How to Play
              </DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              {/* Instruction 1: Slice the slimes */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <img src="/enemies/broker.png" alt="Broker Joker" className="w-10 h-10 object-contain flex-shrink-0" />
                <div>
                  <p className="text-foreground">
                    <span className="font-bold text-red-400">Slice the slimes</span> — swipe the Broker Joker (red glow) to score!
                  </p>
                </div>
              </motion.div>

              {/* Instruction 2: Protect products */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <div className="mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-foreground">
                    <span className="font-bold text-emerald-400">Protect</span> products (green glow) — slicing them costs a life!
                  </p>
                </div>
              </motion.div>

              {/* Start Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={onStart}
                className="btn-arcade w-full text-lg flex items-center justify-center gap-3 mt-6"
              >
                <Play className="w-5 h-5" />
                Start Playing!
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
