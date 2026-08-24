import React, { useEffect, useRef, useState } from 'react';
import Home from './pages/Home';
import SplashScreen from './components/SplashScreen';
import getCurrentUser from './features/getCurrentUser';
import { useDispatch } from 'react-redux';
import { setUserData } from './redux/userSlice';

// matches the splash animation sequence, which completes at 950ms. measured
// from first paint, so a slow session check never has time added on top of it.
const MIN_SPLASH_MS = 950;
const SPLASH_FADE_MS = 300;

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [exiting, setExiting] = useState(false);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const load = async () => {
      const data = await getCurrentUser();
      if (data) {
        console.log('Reloaded session user data:', data);
        dispatch(setUserData(data));
      } else {
        dispatch(setUserData(null));
      }
      setLoading(false);
    };
    load();
  }, [dispatch]);

  // once the session check is done, wait out any remaining minimum, then fade
  useEffect(() => {
    if (loading) return;
    const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAt.current));
    const timer = setTimeout(() => setExiting(true), remaining);
    return () => clearTimeout(timer);
  }, [loading]);

  // unmount only after the fade has finished
  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(() => setShowSplash(false), SPLASH_FADE_MS);
    return () => clearTimeout(timer);
  }, [exiting]);

  return (
    <>
      {showSplash && <SplashScreen exiting={exiting} />}

      {loading ? (
        <div className='hidden lg:flex h-screen items-center justify-center bg-[#0d0f14] text-white'>
          <div className='flex flex-col items-center gap-3'>
            <div className='h-12 w-12 rounded-full border-4 border-white/20 border-t-white animate-spin' />
            <p className='text-sm text-slate-300'>Checking session...</p>
          </div>
        </div>
      ) : (
        <Home />
      )}
    </>
  );
}

export default App
