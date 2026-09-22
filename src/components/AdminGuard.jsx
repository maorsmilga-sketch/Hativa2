import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function AdminGuard({ children }) {
  const { user, loading, isAdmin, signOutAdmin } = useAuth();
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  async function handleGoogleSignIn() {
    setAuthError('');
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('שגיאה בהתחברות עם Google. נסו שוב.');
      }
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <Layout title="לוח בקרה — מנהל" subtitle="טוען...">
        <p className="text-center text-olive-600">מאמת הרשאות...</p>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="כניסת מנהל" subtitle="התחברות מאובטחת — חטיבת כרמלי">
        <div className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md">
          <p className="text-sm text-olive-700">
            גישה למנהלים בלבד. התחברו עם חשבון Google מורשה.
          </p>
          <button
            type="button"
            disabled={signingIn}
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-olive-300 bg-white py-3 font-semibold text-olive-900 hover:bg-olive-50 disabled:opacity-60"
          >
            {signingIn ? 'מתחבר...' : 'התחברות עם Google'}
          </button>
          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
          <Link to="/" className="block text-center text-sm text-olive-600 underline">
            חזרה לדף ההרשמה
          </Link>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="אין הרשאה" subtitle="חשבון Google לא מורשה">
        <div className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md text-center">
          <p className="text-sm text-olive-800">
            החשבון <strong>{user.email}</strong> אינו ברשימת המנהלים.
          </p>
          <button
            type="button"
            onClick={signOutAdmin}
            className="w-full rounded-xl bg-olive-700 py-3 font-semibold text-white"
          >
            התנתקות
          </button>
          <Link to="/" className="block text-sm text-olive-600 underline">
            חזרה לדף ההרשמה
          </Link>
        </div>
      </Layout>
    );
  }

  return children;
}
