import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { Swords, Users, Grid3X3, User } from 'lucide-react';
import Grid from './Grid';
import Sidebar from './Sidebar';
import ActivityFeed from './ActivityFeed';
import { Spotlight, BackgroundBeams, TextGenerateEffect, Sparkles, Meteors } from './AceternityUI';
import './App.css';

const SERVER_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';

function App() {
  const [grid, setGrid] = useState([]);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [userColor, setUserColor] = useState('#6C5CE7');
  const [userCount, setUserCount] = useState(0);
  const [gridSize, setGridSize] = useState(30);
  const [cooldownMs, setCooldownMs] = useState(500);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [lastCaptureTime, setLastCaptureTime] = useState(0);
  const [myBlockCount, setMyBlockCount] = useState(0);
  const [recentCaptures, setRecentCaptures] = useState(new Set());

  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on('init', (data) => {
      setGrid(data.grid);
      setUserId(data.userId);
      setUsername(data.username);
      setUserColor(data.color);
      setGridSize(data.gridSize);
      setCooldownMs(data.cooldownMs);
      setLeaderboard(data.leaderboard);
      setUserCount(data.userCount);
      setActivity(data.activity || []);

      let count = 0;
      data.grid.forEach(row => row.forEach(cell => {
        if (cell && cell.userId === data.userId) count++;
      }));
      setMyBlockCount(count);
    });

    newSocket.on('blockUpdated', (data) => {
      setGrid(prevGrid => {
        const newGrid = [...prevGrid];
        newGrid[data.x] = [...newGrid[data.x]];
        newGrid[data.x][data.y] = {
          userId: data.userId,
          color: data.color,
          username: data.username,
        };
        return newGrid;
      });

      const key = `${data.x}-${data.y}`;
      setRecentCaptures(prev => new Set(prev).add(key));
      setTimeout(() => {
        setRecentCaptures(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 600);
    });

    newSocket.on('userCount', (data) => setUserCount(data.count));
    newSocket.on('leaderboard', (data) => setLeaderboard(data));
    newSocket.on('activity', (entry) => {
      setActivity(prev => [entry, ...prev].slice(0, 15));
    });
    newSocket.on('captureError', (data) => showToast(data.message, 'error'));
    newSocket.on('disconnect', () => showToast('Reconnecting...', 'error'));
    newSocket.on('reconnect', () => showToast('Reconnected!', 'info'));

    return () => newSocket.close();
  }, [showToast]);

  useEffect(() => {
    if (!userId || !grid.length) return;
    let count = 0;
    grid.forEach(row => row.forEach(cell => {
      if (cell && cell.userId === userId) count++;
    }));
    setMyBlockCount(count);
  }, [grid, userId]);

  const handleBlockClick = useCallback((x, y) => {
    if (!socket || !userId) return;
    setLastCaptureTime(Date.now());
    socket.emit('captureBlock', { x, y });
  }, [socket, userId]);

  if (!grid.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary">
        <Sparkles count={30} color="#6C5CE7" />
        <motion.div
          className="w-12 h-12 border-2 border-subtle border-t-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="text-sm text-gray-400 font-medium ml-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Connecting to Grid Wars...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-rows-[auto_1fr] lg:grid-cols-[280px_1fr_320px] h-screen w-full max-w-[1600px] mx-auto p-4 px-6 relative overflow-hidden gap-x-6 overflow-y-auto lg:overflow-hidden">
      <Spotlight size={500} color="rgba(108, 92, 231, 0.08)" />
      <BackgroundBeams />
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Meteors count={25} />
      </div>

      {/* header */}
      <motion.header
        className="col-span-3 flex items-center justify-between py-3 pb-4 gap-4 flex-wrap relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3.5">
          <motion.div
            className="w-11 h-11 bg-gradient-to-br from-accent to-accent-light rounded-xl flex items-center justify-center text-xl glow-accent cursor-pointer"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Swords size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </motion.div>
          <div>
            <motion.h1
              className="text-2xl font-extrabold tracking-tight text-gradient"
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Grid Wars
            </motion.h1>
            <p className="text-[0.65rem] text-muted font-bold tracking-[1.5px] uppercase mt-0.5">
              Real-time Territory Battle
            </p>
          </div>
        </div>

        <motion.div
          className="flex gap-2.5 items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div
            className="glass flex items-center gap-2 py-2 px-4 rounded-3xl text-[0.78rem] font-medium cursor-default"
            whileHover={{ scale: 1.05, borderColor: 'rgba(0, 184, 148, 0.4)' }}
          >
            <Users size={14} className="text-success" />
            <span className="font-semibold text-gray-200">{userCount} online</span>
          </motion.div>

          <motion.div
            className="glass flex items-center gap-2 py-2 px-4 rounded-3xl text-[0.78rem] font-medium cursor-default"
            whileHover={{ scale: 1.05, borderColor: 'rgba(108, 92, 231, 0.4)' }}
          >
            <Grid3X3 size={14} className="text-accent" />
            <span className="font-semibold text-gray-200">{gridSize * gridSize} blocks</span>
          </motion.div>

          <motion.div
            className="glass flex items-center gap-2.5 py-2 px-4 rounded-3xl"
            whileHover={{ scale: 1.03 }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-white/10 shrink-0"
              style={{ background: userColor, boxShadow: `0 0 10px ${userColor}` }}
            />
            <span className="font-bold text-sm text-gray-100">{username}</span>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* left sidebar: activity feed */}
      <motion.div
        className="h-full overflow-hidden py-2"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <ActivityFeed activity={activity} />
      </motion.div>

      {/* grid area */}
      <motion.main
        className="flex flex-col overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Grid
          grid={grid}
          gridSize={gridSize}
          userId={userId}
          userColor={userColor}
          onBlockClick={handleBlockClick}
          recentCaptures={recentCaptures}
        />
      </motion.main>

      {/* right sidebar: stats and leaderboard */}
      <motion.div
        className="h-full overflow-hidden py-2"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Sidebar
          leaderboard={leaderboard}
          username={username}
          userColor={userColor}
          myBlockCount={myBlockCount}
          userCount={userCount}
          gridSize={gridSize}
          lastCaptureTime={lastCaptureTime}
          cooldownMs={cooldownMs}
        />
      </motion.div>

      {/* toasts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              className={`py-2.5 px-5 rounded-3xl text-[0.78rem] font-medium backdrop-blur-xl flex items-center gap-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)] ${
                t.type === 'error'
                  ? 'bg-primary-200 border border-danger/30 shadow-[0_8px_40px_rgba(225,112,85,0.1)]'
                  : 'bg-primary-200 border border-subtle'
              }`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {t.type === 'error' ? '⚠' : '✓'} {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;