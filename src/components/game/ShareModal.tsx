import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareModal = ({ open, onOpenChange }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');

  const shareUrl = window.location.origin;
  const shareTitle = 'B3B Arcade - Grovara';
  const shareText = 'Play B3B Arcade and discover amazing brands on Grovara!';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
        toast.success('Thanks for sharing!');
      } catch (error) {
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
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border-2 border-primary/40 max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold text-center text-primary flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            <Share2 className="w-5 h-5" />
            SHARE THE FUN
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex rounded-lg bg-card/60 border border-primary/20 p-0.5">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'link'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            LINK
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'qr'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            QR CODE
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'link' ? (
          <div className="space-y-3">
            {/* Link Display */}
            <div className="bg-card/60 rounded-lg p-3 border border-primary/20">
              <p className="text-[10px] text-muted-foreground mb-1">Share Link:</p>
              <p className="text-sm font-mono text-primary break-all">{shareUrl}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {hasNativeShare && (
                <Button
                  onClick={handleNativeShare}
                  className="w-full py-5 text-sm font-bold"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  SHARE WITH FRIENDS
                </Button>
              )}
              <Button
                onClick={handleCopyLink}
                variant={hasNativeShare ? 'outline' : 'default'}
                className="w-full py-5 text-sm font-bold"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    COPY LINK
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Scan this QR code to share the game
            </p>
            <div className="bg-[#1a1a2e] rounded-xl p-4 shadow-lg">
              <img
                src="/who-are-you/Qq2cfTUZHzx0eWU.png"
                alt="QR Code"
                className="w-44 h-44 sm:w-48 sm:h-48"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
