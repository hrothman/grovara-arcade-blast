import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Frown, RefreshCw, Medal } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser } from '@/lib/leaderboardManager';

export const GameOverScreen = () => {
  const { gameState, resetGame, goToSwipe } = useGame();
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const playerRowRef = useRef<HTMLDivElement>(null);

  // Load merged leaderboard on mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      const currentUser = getCurrentUser();
      const entries = await getLeaderboard(50);
      // Map to simple format
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score
      }));
      const displayUsername = currentUser?.username || username;
      // Only add temporary player if not logged in
      const withPlayer = currentUser
        ? mapped
        : [
            ...mapped,
            { username: displayUsername, score: gameState.totalScore }
          ];
      setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
    };
    loadLeaderboard();
  }, [username, gameState.totalScore]);

  const displayUsername = getCurrentUser()?.username || username;
  const playerRank = leaderboard.findIndex(entry => entry.username === displayUsername) + 1;

  // Auto-scroll to player position with acceleration
  useEffect(() => {
    if (leaderboardRef.current && playerRowRef.current) {
      const container = leaderboardRef.current;
      const playerRow = playerRowRef.current;
      const targetScroll = playerRow.offsetTop - container.offsetTop - 100;

      if (targetScroll > 0) {
        let currentScroll = 0;
        let velocity = 0;
        const acceleration = 0.5;
        const maxVelocity = 30;

        const animate = () => {
          if (currentScroll < targetScroll) {
            velocity = Math.min(velocity + acceleration, maxVelocity);
            currentScroll += velocity;
            container.scrollTop = Math.min(currentScroll, targetScroll);
            requestAnimationFrame(animate);
          }
        };

        setTimeout(() => animate(), 1000);
      }
    }
  }, []);

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />
      
      <div className="relative z-10 text-center max-w-md mx-auto w-full">
        {/* Game over icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/20 rounded-full">
            <Frown className="w-10 h-10 text-destructive" />
          </div>
        </div>

        <h2 className="arcade-text text-3xl font-bold text-foreground mb-2">
          GAME OVER
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Too many friendly hits! Remember: protect the good brands.
        </p>

        {/* Stats */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Final Score</span>
              <span className="arcade-text text-2xl text-warning score-glow">
                {gameState.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Levels Completed</span>
              <span className="arcade-text text-lg text-foreground">
                {gameState.levels.length} / 3
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Leaderboard</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              Rank #{playerRank}
            </span>
          </div>

          <div 
            ref={leaderboardRef}
            className="max-h-64 overflow-y-auto space-y-1 pr-2 custom-scrollbar"
          >
            {leaderboard.map((entry, idx) => {
              const isPlayer = entry.username === displayUsername;
              const rank = idx + 1;
              
              return (
                <div
                  key={entry.username}
                  ref={isPlayer ? playerRowRef : null}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isPlayer 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-background/50 hover:bg-background/70'
                  }`}
                >
                  <span className={`arcade-text text-sm w-8 text-center ${
                    rank === 1 ? 'text-warning' :
                    rank === 2 ? 'text-muted-foreground' :
                    rank === 3 ? 'text-orange-400' :
                    'text-muted-foreground'
                  }`}>
                    {rank <= 3 ? '🏆' : rank}
                  </span>
                  <span className={`flex-1 font-medium ${
                    isPlayer ? 'text-primary' : 'text-foreground'
                  }`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  <span className={`arcade-text text-sm ${
                    isPlayer ? 'text-primary' : 'text-warning'
                  }`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => {
              resetGame();
            }}
            type="button"
            className="btn-arcade text-lg w-full max-w-xs flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-5 h-5" />
            BACK TO START
          </button>
          <button
            onClick={() => {
              goToSwipe();
            }}
            type="button"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 w-full"
          >
            <span className="text-sm">See brands / buyers anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
