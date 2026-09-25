import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, googleProvider } from '../../utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import api from '../../utils/axios';
import { FcGoogle } from "react-icons/fc";
import { setUserData } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';

// a failed popup used to be swallowed, so the window just flashed and closed
// with no hint why. the code is kept in the text so it can be looked up.
const loginErrorText = (error) => {
  switch (error?.code) {
    case 'auth/unauthorized-domain':
      return `This domain (${window.location.hostname}) is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.`;
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is missing or invalid. Check VITE_FIREBASE_API_KEY and redeploy.';
    case 'auth/popup-blocked':
      return 'The browser blocked the sign-in popup. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in window was closed before finishing.';
    default:
      return `Sign-in failed (${error?.code || error?.message || 'unknown error'}).`;
  }
};

function Home() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userData);
  const [loginError, setLoginError] = React.useState('');
  console.log('Redux user state:', user);

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post('/auth/login', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // cookie fallback: mobile browsers block the cross-domain session
      // cookie, so keep the id and let the axios interceptor send it as
      // Authorization: Bearer on every later request
      if (data?.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
      }

      return data?.user || null;
    } catch (error) {
      console.log('Auth backend login error ignored:', error?.message || error);
      return null;
    }
  };

  const googleLogin = async () => {
    setLoginError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken(true);
      console.log('Firebase token:', token);

      const backendUser = await handleLogin(token);
      const fallbackUser = {
        name: result.user.displayName,
        email: result.user.email,
        avatar: result.user.photoURL,
      };

      const activeUser = backendUser || fallbackUser;
      if (activeUser) {
        dispatch(setUserData(activeUser));
      }

      console.log('Signed in, token sent to backend', activeUser);
    } catch (error) {
      console.error('Google login error:', error?.code, error?.message);
      setLoginError(loginErrorText(error));
    }
  }

  return (
    <div className='h-[100dvh] flex bg-[#0d0f14] text-white overflow-hidden'>
<SideBar/>
<ChatArea/>
<Artifact/>






      {!user && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
          <div className='w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>
                Welcome to Ameek AI
              </h2>
              <p className='text-[13px] text-slate-500'>
                Please login to continue using the app.
              </p>

            </div>

            <button
              className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer'
              onClick={googleLogin}
            >
              <FcGoogle size={15} className='text-white' />
              Continue With Google
            </button>

            {loginError && (
              <p className='text-[12px] leading-snug text-red-400'>
                {loginError}
              </p>
            )}

          </div>

        </div>
      )}

      {user && (
        <div className='h-screen bg-[#0d0f14]' />
      )}

    </div>
  );
}

export default Home