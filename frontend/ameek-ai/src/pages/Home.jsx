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

  // throws on failure. this used to swallow the error and log the user in
  // with only their google profile - with no backend session, so every chat
  // request then failed with "session expired" and hid the real cause.
  const handleLogin = async (token) => {
    // a stale id from an earlier login must not outlive a failed new one
    localStorage.removeItem("sessionId");
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
      if (!data?.user) throw new Error('the server did not return a user');

      return data.user;
    } catch (error) {
      const status = error?.response?.status;
      const reason = error?.response?.data?.error || error?.response?.data?.message || error?.message;
      const serverError = new Error(
        status
          ? `Server login failed (${status}): ${reason}`
          : 'Could not reach the server. Check that the gateway is running and FRONTEND_URL allows this site.'
      );
      serverError.code = 'server-login';
      throw serverError;
    }
  };

  const googleLogin = async () => {
    setLoginError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken(true);

      const backendUser = await handleLogin(token);
      // the user model has no avatar field, so the google photo fills it
      dispatch(setUserData({ ...backendUser, avatar: backendUser.avatar || result.user.photoURL }));
    } catch (error) {
      console.error('Login error:', error?.code, error?.message);
      setLoginError(error?.code === 'server-login' ? error.message : loginErrorText(error));
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