import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, email: string) => Promise<void>;
  title?: string;
  description?: string;
  initialEmail?: string;
  submitButtonText?: string;
  showMatchesInfo?: boolean;
  matchCount?: number;
  matchType?: string;
}

export const UserInfoModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Save Your Progress",
  description = "Create an account to save your matches and scores",
  initialEmail = '',
  submitButtonText = "Save & Continue",
  showMatchesInfo = false,
  matchCount = 0,
  matchType = "matches",
}: UserInfoModalProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(username, email);
    } catch (error) {
      console.error('Error submitting user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md neon-border p-0 overflow-hidden">
        <div className="relative">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 gradient-radial-glow opacity-20 pointer-events-none" />
          
          <div className="relative p-6">
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="arcade-text text-2xl text-foreground neon-glow">
                  {title}
                </DialogTitle>
              </div>
              
              <DialogDescription className="text-muted-foreground text-sm">
                {description}
              </DialogDescription>

              {showMatchesInfo && matchCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-primary/10 rounded-lg p-3 border border-primary/30 mt-2"
                >
                  <p className="text-sm text-primary font-medium">
                    🎯 You matched with {matchCount} {matchType}!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll use your contact info to connect you with the businesses you're interested in.
                  </p>
                </motion.div>
              )}
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="space-y-4">
                {/* Email Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-border focus:border-primary transition-colors"
                    autoComplete="email"
                  />
                </motion.div>

                {/* Username Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Username
                  </label>
                  <Input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                    disabled={isLoading}
                    className="bg-background/50 border-border focus:border-primary transition-colors"
                    maxLength={20}
                    autoComplete="username"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    No spaces, max 20 characters
                  </p>
                </motion.div>

                {/* Privacy Note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50"
                >
                  <p className="text-xs text-muted-foreground">
                    🔒 Your information is secure and will only be used to facilitate connections 
                    with matched businesses and save your game progress.
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-arcade w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : submitButtonText}
                </motion.button>
              </div>
            </form>

            {/* Skip Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Skip for now
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
