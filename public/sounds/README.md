# Sound Effects Directory

## Background Music
Place your background music file here:

- **background-music.mp3** - Your looping background music track
  - This will play continuously during gameplay
  - Recommended: Upbeat arcade-style music, 30-60 seconds loop
  - Format: MP3 recommended (also supports OGG, WAV)
  - Recommended file size: Under 2MB

## Sound Effects
**Sound effects are automatically generated using ZzFX!** No audio files needed.

The game includes these built-in arcade-style sound effects:
- ✨ **place-product** - Pop sound when products are placed on shelves
- 💥 **enemy-hit** - Impact sound when enemies take damage
- 💀 **enemy-kill** - Explosion sound when enemies are defeated
- 🚨 **item-stolen** - Negative alarm when items are stolen
- 🎉 **level-complete** - Victory fanfare when level ends
- ⭐ **rare-item** - Sparkle sound for ultra-rare products

These are generated procedurally using the ZzFX library (under 1KB!), giving you authentic retro arcade sounds without any audio files.

## Volume Levels
- Background Music: 30% volume
- Sound Effects: 50% volume

You can adjust these in `/src/lib/soundManager.ts` if needed.

## What You Need to Add
**Just one file:** `background-music.mp3`

That's it! All sound effects are handled automatically.
