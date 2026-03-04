import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, LogIn, UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AccountLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAccount: (emailOrUsername: string) => Promise<boolean>;
  onCreateAccount: () => void;
}

export const AccountLoadModal = ({
  isOpen,
  onClose,
  onLoadAccount,
  onCreateAccount,
}: AccountLoadModalProps) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoadAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const found = await onLoadAccount(emailOrUsername);
      if (!found) {
        setErrorMessage('Account not found');
      }
    } catch (error) {
      console.error('Error loading account:', error);
      setErrorMessage('Failed to load account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    onCreateAccount();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const handleBackToMenu = () => {
    setShowLoadForm(false);
    setEmailOrUsername('');
    setErrorMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md neon-border p-0 overflow-hidden">
        <div className="relative">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 gradient-radial-glow opacity-20 pointer-events-none" />
          
          <div className="relative p-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="arcade-text text-base text-foreground neon-glow flex items-center gap-2">
                <LogIn className="w-4 h-4 text-primary" />
                Welcome!
              </DialogTitle>

              <DialogDescription className="text-muted-foreground text-xs">
                {showLoadForm ? 'Enter your email or username to load your account' : 'Get started by loading your existing account or creating a new one'}
              </DialogDescription>
            </DialogHeader>

            {!showLoadForm ? (
              // Initial choice menu
              <div className="mt-4 space-y-3">
                {/* Load Account Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setShowLoadForm(true)}
                  className="btn-arcade w-full text-sm flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Load My Account
                </motion.button>

                {/* Create Account Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={handleCreateAccount}
                  className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-lg py-2 flex items-center justify-center gap-2 text-sm text-foreground border border-primary/30"
                >
                  <UserPlus className="w-4 h-4 text-primary" />
                  Create New Account
                </motion.button>

                {/* Skip Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleSkip}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
                >
                  Skip for now
                </motion.button>

                {/* Info Note */}
                <div className="bg-muted/30 rounded-md p-2 border border-border/50">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    You can create an account later to save your progress and connect with matched brands.
                  </p>
                </div>
              </div>
            ) : (
              // Load account form
              <form onSubmit={handleLoadAccount} className="mt-4">
                <div className="space-y-3">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={handleBackToMenu}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </button>

                  {/* Email or Username Input */}
                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <Mail className="w-3 h-3 text-primary" />
                      Email or Username
                    </label>
                    <Input
                      type="text"
                      placeholder="your@email.com or username"
                      value={emailOrUsername}
                      onChange={(e) => {
                        setEmailOrUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      disabled={isLoading}
                      className="bg-background/50 border-border focus:border-primary transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert variant="destructive" className="border-2 border-destructive/50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2 font-medium text-sm">
                          {errorMessage}
                        </AlertDescription>
                      </Alert>

                      {errorMessage === 'Account not found' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="mt-2 p-2 bg-muted/50 rounded-lg border border-border"
                        >
                          <p className="text-xs text-muted-foreground mb-1.5">
                            Don't have an account yet?
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateAccount}
                            className="w-full bg-primary hover:bg-primary/90 transition-colors rounded-lg py-1.5 flex items-center justify-center gap-2 text-sm text-primary-foreground font-medium"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Create New Account
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Load Account Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    type="submit"
                    disabled={isLoading}
                    className="btn-arcade w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Loading...' : 'Load Account'}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
