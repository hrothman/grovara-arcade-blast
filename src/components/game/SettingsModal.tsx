import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Music, Zap } from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [musicVolume, setMusicVolume] = useState(30);
  const [sfxVolume, setSfxVolume] = useState(50);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSfxVolume = localStorage.getItem('sfxVolume');
    const savedMusicEnabled = localStorage.getItem('musicEnabled');
    const savedSfxEnabled = localStorage.getItem('sfxEnabled');

    if (savedMusicVolume) setMusicVolume(Number(savedMusicVolume));
    if (savedSfxVolume) setSfxVolume(Number(savedSfxVolume));
    if (savedMusicEnabled) setMusicEnabled(savedMusicEnabled === 'true');
    if (savedSfxEnabled) setSfxEnabled(savedSfxEnabled === 'true');
  }, []);

  const handleMusicVolumeChange = (value: number[]) => {
    const vol = value[0];
    setMusicVolume(vol);
    soundManager.setMusicVolume(vol / 100);
    localStorage.setItem('musicVolume', vol.toString());
  };

  const handleSfxVolumeChange = (value: number[]) => {
    const vol = value[0];
    setSfxVolume(vol);
    soundManager.setSFXVolume(vol / 100);
    localStorage.setItem('sfxVolume', vol.toString());
    
    // Play a test sound
    soundManager.playSound('placeProduct');
  };

  const handleMusicToggle = (checked: boolean) => {
    setMusicEnabled(checked);
    soundManager.setMusicMuted(!checked);
    localStorage.setItem('musicEnabled', checked.toString());
  };

  const handleSfxToggle = (checked: boolean) => {
    setSfxEnabled(checked);
    soundManager.setSFXMuted(!checked);
    localStorage.setItem('sfxEnabled', checked.toString());
    
    // Play a test sound when enabling
    if (checked) {
      soundManager.playSound('placeProduct');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-lg border-2 border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary" style={{ fontFamily: 'var(--font-pixel)' }}>
            SETTINGS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Music Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <Label htmlFor="music-toggle" className="text-base font-semibold" style={{ fontFamily: 'var(--font-pixel)' }}>
                  MUSIC
                </Label>
              </div>
              <Switch
                id="music-toggle"
                checked={musicEnabled}
                onCheckedChange={handleMusicToggle}
              />
            </div>

            {musicEnabled && (
              <div className="space-y-2 pl-7">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="text-primary font-bold">{musicVolume}%</span>
                </div>
                <Slider
                  value={[musicVolume]}
                  onValueChange={handleMusicVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Sound Effects Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <Label htmlFor="sfx-toggle" className="text-base font-semibold" style={{ fontFamily: 'var(--font-pixel)' }}>
                  SOUND FX
                </Label>
              </div>
              <Switch
                id="sfx-toggle"
                checked={sfxEnabled}
                onCheckedChange={handleSfxToggle}
              />
            </div>

            {sfxEnabled && (
              <div className="space-y-2 pl-7">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="text-primary font-bold">{sfxVolume}%</span>
                </div>
                <Slider
                  value={[sfxVolume]}
                  onValueChange={handleSfxVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Settings are saved automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
