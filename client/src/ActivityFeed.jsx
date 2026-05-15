import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardSpotlight } from './AceternityUI';
import { Radio, Zap, UserPlus, UserMinus, Target } from 'lucide-react';

function ActivityFeed({ activity }) {
  return (
    <aside className="flex flex-col h-full overflow-y-auto pl-1 pb-4 scrollbar-thin">
      <CardSpotlight className="glass glass-hover rounded-2xl p-4 relative overflow-hidden shrink-0 flex-1 flex flex-col min-h-0" borderColor="rgba(0, 184, 148, 0.2)">
        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-subtle relative z-[3] shrink-0">
          <Radio size={16} className="text-accent animate-pulse-dot drop-shadow-[0_0_8px_rgba(108,92,231,0.8)]" />
          <span className="text-[0.75rem] font-bold uppercase tracking-[1.5px] text-gray-400">Live Activity</span>
          <div className="ml-auto flex items-center h-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto relative z-[3] scrollbar-xs">
          {activity.length === 0 && (
            <div className="text-sm text-muted text-center py-3">Waiting for action...</div>
          )}
          <AnimatePresence initial={false}>
            {activity.map((entry) => (
              <motion.div
                key={entry.id || entry.timestamp}
                className="flex items-start gap-2.5 py-2 px-2 rounded-lg text-[0.73rem] text-gray-400 leading-relaxed hover:bg-white/[0.02]"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <span className="shrink-0 mt-px">
                  {entry.type === 'capture' && <Zap size={14} className="text-accent" />}
                  {entry.type === 'join' && <UserPlus size={14} className="text-success" />}
                  {entry.type === 'leave' && <UserMinus size={14} className="text-muted" />}
                </span>
                <div className="flex-1 min-w-0">
                  {entry.type === 'capture' && (
                    <div>
                      <strong className="font-semibold" style={{ color: entry.color }}>{entry.username}</strong>
                      {entry.prevOwner
                        ? <> stole from <strong className="text-white/70 font-semibold">{entry.prevOwner}</strong></>
                        : <> claimed</>
                      }
                      <span className="ml-1.5 font-mono text-[0.62rem] text-muted/70 bg-white/[0.03] px-1 py-px rounded">[{entry.x},{entry.y}]</span>
                    </div>
                  )}
                  {entry.type === 'join' && (
                    <div><strong className="font-semibold" style={{ color: entry.color }}>{entry.username}</strong> joined</div>
                  )}
                  {entry.type === 'leave' && (
                    <div><strong className="font-semibold" style={{ color: entry.color }}>{entry.username}</strong> left</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardSpotlight>
    </aside>
  );
}

export default React.memo(ActivityFeed);
