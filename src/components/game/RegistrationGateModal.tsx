import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  LogIn,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  User,
  Building2,
} from 'lucide-react';
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

type View = 'menu' | 'newPlayer' | 'returningPlayer';

interface RegistrationGateModalProps {
  isOpen: boolean;
  onRegister: (
    email: string,
    firstName: string,
    lastName: string,
    company: string
  ) => Promise<void>;
  onLoadAccount: (email: string) => Promise<boolean>;
}

export const RegistrationGateModal = ({
  isOpen,
  onRegister,
  onLoadAccount,
}: RegistrationGateModalProps) => {
  const [view, setView] = useState<View>('menu');

  // New player form
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Returning player form
  const [loadEmail, setLoadEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForms = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setCompany('');
    setLoadEmail('');
    setErrorMessage('');
  };

  const handleBackToMenu = () => {
    resetForms();
    setView('menu');
  };

  // --- New Player ---
  const handleNewPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      toast.error('Please enter your last name');
      return;
    }
    if (!company.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister(email.trim(), firstName.trim(), lastName.trim(), company.trim());
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Returning Player ---
  const handleLoadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loadEmail.trim()) {
      setErrorMessage('Please enter your email');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const found = await onLoadAccount(loadEmail.trim());
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md bg-card/95 backdrop-blur-md neon-border p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <div className="relative">
          <div className="absolute inset-0 gradient-radial-glow opacity-20 pointer-events-none" />

          <div className="relative p-4">
            {/* ======== MENU VIEW ======== */}
            {view === 'menu' && (
              <>
                <DialogHeader className="space-y-1.5">
                  <DialogTitle className="arcade-text text-base text-foreground neon-glow flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-primary" />
                    Register to Play
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Create an account or load your existing one to start
                    playing
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setView('newPlayer')}
                    className="btn-arcade w-full text-sm flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    New Player
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setView('returningPlayer')}
                    className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-lg py-2 flex items-center justify-center gap-2 text-sm text-foreground border border-primary/30"
                  >
                    <LogIn className="w-4 h-4 text-primary" />
                    Returning Player
                  </motion.button>
                </div>
              </>
            )}

            {/* ======== NEW PLAYER VIEW ======== */}
            {view === 'newPlayer' && (
              <>
                <DialogHeader className="space-y-1">
                  <DialogTitle className="arcade-text text-base text-foreground neon-glow">
                    New Player
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Fill in your details to start playing
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleNewPlayerSubmit} className="mt-3">
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleBackToMenu}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>

                    {/* Email */}
                    <div>
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                        <Mail className="w-3 h-3 text-primary" />
                        Email *
                      </label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-background/50 border-border focus:border-primary transition-colors"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    {/* First Name & Last Name — side by side */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-primary" />
                          First Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-background/50 border-border focus:border-primary transition-colors"
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-primary" />
                          Last Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="Smith"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-background/50 border-border focus:border-primary transition-colors"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3 h-3 text-primary" />
                        Company *
                      </label>
                      <Input
                        type="text"
                        placeholder="Acme Corp"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-background/50 border-border focus:border-primary transition-colors"
                        autoComplete="organization"
                      />
                    </div>

                    {/* Privacy note */}
                    <div className="bg-muted/30 rounded-md p-2 border border-border/50">
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Your information is secure and will only be used to
                        save your game progress and connect you with brands.
                      </p>
                    </div>

                    {/* Submit */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-arcade w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Registering...' : 'Register & Play'}
                    </motion.button>
                  </div>
                </form>
              </>
            )}

            {/* ======== RETURNING PLAYER VIEW ======== */}
            {view === 'returningPlayer' && (
              <>
                <DialogHeader className="space-y-1.5">
                  <DialogTitle className="arcade-text text-base text-foreground neon-glow flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-primary" />
                    Welcome Back!
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Enter your email to load your account
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleLoadSubmit} className="mt-4">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleBackToMenu}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>

                    <div>
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                        <Mail className="w-3 h-3 text-primary" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={loadEmail}
                        onChange={(e) => {
                          setLoadEmail(e.target.value);
                          setErrorMessage('');
                        }}
                        disabled={isLoading}
                        className="bg-background/50 border-border focus:border-primary transition-colors"
                        autoFocus
                      />
                    </div>

                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert
                          variant="destructive"
                          className="border-2 border-destructive/50"
                        >
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
                              onClick={() => {
                                resetForms();
                                setView('newPlayer');
                              }}
                              className="w-full bg-primary hover:bg-primary/90 transition-colors rounded-lg py-1.5 flex items-center justify-center gap-2 text-sm text-primary-foreground font-medium"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Register as New Player
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

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
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
