import { motion } from 'framer-motion';
import { Play, ArrowLeft, ArrowRight, Store } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SwipeInstructionsModalProps {
  isOpen: boolean;
  onStart: () => void;
  itemType: 'BRANDS' | 'BUYERS';
}

export const SwipeInstructionsModal = ({ isOpen, onStart, itemType }: SwipeInstructionsModalProps) => {
  const title = itemType === 'BRANDS' 
    ? 'Want these brands in your store?' 
    : 'Want to connect with these buyers?';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-card/95 backdrop-blur-md neon-border p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 gradient-radial-glow opacity-20 pointer-events-none" />
          
          <div className="relative p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="arcade-text text-2xl text-foreground neon-glow flex items-center gap-2 justify-center">
                <Store className="w-6 h-6 text-primary" />
                {title}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              {/* Instruction 1: Swipe Right */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <div className="mt-0.5">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground">
                    <span className="font-bold text-primary">Swipe right</span> to match
                  </p>
                </div>
              </motion.div>

              {/* Instruction 2: Swipe Left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <div className="mt-0.5">
                  <ArrowLeft className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground">
                    <span className="font-bold text-primary">Swipe left</span> to skip
                  </p>
                </div>
              </motion.div>

              {/* Start Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onStart}
                className="btn-arcade w-full text-lg flex items-center justify-center gap-3 mt-6"
              >
                <Play className="w-5 h-5" />
                Start Swiping!
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
