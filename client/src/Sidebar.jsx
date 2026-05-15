import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardSpotlight, Meteors } from './AceternityUI';
import { Target, Box, Map, Users, TrendingUp, Trophy } from 'lucide-react';

function CooldownBar({ lastCaptureTime, cooldownMs }) {
  const [progress, setProgress] = useState(100);
  const [remaining, setRemaining] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!lastCaptureTime) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - lastCaptureTime;
      const pct = Math.min((elapsed / cooldownMs) * 100, 100);
      setProgress(pct);
      setRemaining(Math.max(0, cooldownMs - elapsed));
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [lastCaptureTime, cooldownMs]);

  const ready = progress >= 100;

  return (
    <div className="w-full mt-3 relative z-[3]">
      <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${ready ? 'cooldown-ready' : 'cooldown-active'}`}
          style={{ width: `${progress}%` }}
          layout
          transition={{ duration: 0.05 }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[0.62rem] text-muted font-mono">
        <span>{ready ? '✓ Ready' : '⏳ Cooldown'}</span>
        <span className="font-bold">{ready ? `${cooldownMs}ms` : `${remaining}ms`}</span>
      </div>
    </div>
  );
}

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

function Sidebar({ leaderboard, username, userColor, myBlockCount, userCount, gridSize, lastCaptureTime, cooldownMs }) {
  const totalBlocks = gridSize * gridSize;
  const capturedBlocks = leaderboard.reduce((sum, e) => sum + e.blockCount, 0);
  const capturedPct = totalBlocks > 0 ? ((capturedBlocks / totalBlocks) * 100).toFixed(1) : '0';
  const maxBlocks = leaderboard.length > 0 ? leaderboard[0].blockCount : 1;

  return (
    <aside className="flex flex-col gap-3.5 h-full overflow-y-auto pr-1 pb-4 scrollbar-thin">

      {/* stats panel */}
      <CardSpotlight className="glass glass-hover rounded-2xl p-4 relative overflow-hidden shrink-0" borderColor="rgba(108, 92, 231, 0.3)">
        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-subtle relative z-[3]">
          <Target size={16} className="text-accent" />
          <span className="text-[0.75rem] font-bold uppercase tracking-[1.5px] text-gray-400">Your Stats</span>
        </div>

        <div className="grid grid-cols-2 gap-2 relative z-[3]">
          {[
            { value: myBlockCount, label: 'Blocks', icon: Box },
            { value: `${capturedPct}%`, label: 'Map Claimed', icon: Map },
            { value: userCount, label: 'Players', icon: Users },
            { value: totalBlocks - capturedBlocks, label: 'Unclaimed', icon: TrendingUp },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="text-center py-3 px-2 bg-white/[0.015] rounded-xl border border-subtle cursor-default hover:border-accent/30 hover:shadow-[0_0_20px_rgba(108,92,231,0.08)] transition-all"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-2xl font-extrabold font-mono text-gradient-stat pb-1 flex justify-center items-center gap-1">
                 {stat.value}
              </div>
              <div className="flex items-center justify-center gap-1 text-[0.6rem] text-muted uppercase tracking-wider mt-1 font-semibold">
                <stat.icon size={10} className="opacity-70" /> {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        <CooldownBar lastCaptureTime={lastCaptureTime} cooldownMs={cooldownMs} />
      </CardSpotlight>

      {/* leaderboard */}
      <CardSpotlight className="glass glass-hover rounded-2xl p-4 relative overflow-hidden shrink-0" borderColor="rgba(253, 203, 110, 0.2)">
        <Meteors count={5} />

        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-subtle relative z-[3]">
          <Trophy size={16} className="text-[#FDCB6E] drop-shadow-[0_0_8px_rgba(253,203,110,0.8)]" />
          <span className="text-[0.75rem] font-bold uppercase tracking-[1.5px] text-gray-400">Leaderboard</span>
        </div>

        <motion.div
          className="flex flex-col gap-1 relative z-[3]"
          variants={listContainer}
          initial="hidden"
          animate="show"
          key={leaderboard.map(e => `${e.username}-${e.blockCount}`).join(',')}
        >
          {leaderboard.length === 0 && (
            <div className="text-sm text-muted text-center py-3">No captures yet. Be the first!</div>
          )}
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.username}
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg relative"
              variants={listItem}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', x: 4 }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-extrabold shrink-0 ${
                i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'bg-white/5 text-muted'
              }`}>
                {i + 1}
              </div>

              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
              />

              <div className={`text-[0.78rem] font-medium flex-1 truncate ${
                entry.username === username ? 'text-accent-light font-semibold' : ''
              }`}>
                {entry.username}
                {entry.username === username && ' (you)'}
              </div>

              <div className="text-[0.72rem] font-bold font-mono text-gray-400 min-w-[20px] text-right">
                {entry.blockCount}
              </div>

              <motion.div
                className="absolute bottom-0 left-0 h-0.5 rounded-sm opacity-25"
                style={{ background: entry.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(entry.blockCount / Math.max(maxBlocks, 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </CardSpotlight>

    </aside>
  );
}

export default React.memo(Sidebar);
