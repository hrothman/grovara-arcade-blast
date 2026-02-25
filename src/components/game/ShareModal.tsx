import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareModal = ({ open, onOpenChange }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = window.location.origin;
  const shareTitle = 'B3B Arcade - Grovara';
  const shareText = 'Check out this awesome game! Build your shelf and connect with amazing brands on Grovara! 🎮';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
        toast.success('Thanks for sharing! 🎉');
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share');
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard! 🎉');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border-2 border-primary/40 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-pixel)' }}>
            <Share2 className="w-6 h-6" />
            SHARE THE FUN
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Invite your friends to play B3B Arcade and discover amazing brands!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share Message */}
          <div className="bg-card/60 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-muted-foreground italic">
              "{shareText}"
            </p>
          </div>

          {/* Link Display */}
          <div className="bg-card/60 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Share Link:</p>
            <p className="text-sm font-mono text-primary break-all">{shareUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {hasNativeShare && (
              <Button
                onClick={handleNativeShare}
                className="w-full py-6 text-base font-bold"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                <Share2 className="w-5 h-5 mr-2" />
                SHARE WITH FRIENDS
              </Button>
            )}

            <Button
              onClick={handleCopyLink}
              variant={hasNativeShare ? "outline" : "default"}
              className="w-full py-6 text-base font-bold"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  COPIED!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  COPY LINK
                </>
              )}
            </Button>
          </div>

          {/* Social Media Hints */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Share on your favorite platforms: WhatsApp, Instagram, Twitter, Facebook & more!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
