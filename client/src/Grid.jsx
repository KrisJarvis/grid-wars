import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Cell = React.memo(({ x, y, cell, isMine, justCaptured, onClick, onHover }) => {
  const isCaptured = cell !== null;

  let cls = 'grid-cell';
  if (isCaptured) cls += ' claimed';
  if (isMine) cls += ' mine';
  if (justCaptured) cls += ' just-captured';

  return (
    <div
      className={cls}
      style={{ '--cell-color': cell ? cell.color : undefined }}
      onClick={() => onClick(x, y)}
      onMouseEnter={(e) => onHover(e, cell, x, y)}
    >
      {/* inner glow for captured blocks */}
      {isCaptured && (
        <div className="absolute inset-0 rounded-[inherit] box-border border border-white/20 mix-blend-overlay pointer-events-none" />
      )}
    </div>
  );
}, (prev, next) => {
  // Ultra-strict equality check to guarantee zero wasted renders
  return prev.cell === next.cell && 
         prev.isMine === next.isMine && 
         prev.justCaptured === next.justCaptured;
});

function Grid({ grid, gridSize, userId, userColor, onBlockClick, recentCaptures }) {
  const [tooltip, setTooltip] = useState(null);

  const handleBlockHover = useCallback((e, cell, x, y) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, cell, coords: { x, y } });
  }, []);

  const playPopSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Audio context might be blocked before first user interaction
    }
  }, []);

  const handleCellClick = useCallback((x, y) => {
    playPopSound();
    onBlockClick(x, y);
  }, [onBlockClick, playPopSound]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 relative overflow-auto scrollbar-thin">
      <div 
        className="w-full min-w-[500px] max-w-[82vh] aspect-square grid bg-[#0c0c14]/80 backdrop-blur-sm border border-subtle rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-2 gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {grid.map((row, x) =>
          row.map((cell, y) => {
            const key = `${x}-${y}`;
            return (
              <Cell 
                key={key}
                x={x}
                y={y}
                cell={cell}
                isMine={cell && cell.userId === userId}
                justCaptured={recentCaptures.has(key)}
                onClick={handleCellClick}
                onHover={handleBlockHover}
              />
            );
          })
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="fixed pointer-events-none z-[100] bg-primary-200 border border-subtle rounded-xl py-2 px-3 text-xs backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] whitespace-nowrap -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {tooltip.cell ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-extrabold tracking-wide" style={{ color: tooltip.cell.color }}>
                  {tooltip.cell.username}
                </span>
                <span className="font-mono text-[0.65rem] text-gray-400 bg-black/40 px-1.5 py-0.5 rounded">
                  [{tooltip.coords.x}, {tooltip.coords.y}]
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-semibold text-gray-300">Unclaimed</span>
                <span className="font-mono text-[0.65rem] text-gray-500 bg-black/40 px-1.5 py-0.5 rounded">
                  [{tooltip.coords.x}, {tooltip.coords.y}]
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(Grid);