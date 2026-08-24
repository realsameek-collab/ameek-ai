import api from "../../utils/axios";
import { auth } from "../../utils/firebase";

const getCurrentUser = async () => {
  try {
    // Gateway /api/me validates the session cookie created at login.
    const { data } = await api.get('/api/me');
    return data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 400) {
      console.log('No valid session cookie on reload');
      return null;
    }
    console.log('getCurrentUser error', error);
    return null;
  }
};

export default getCurrentUser;