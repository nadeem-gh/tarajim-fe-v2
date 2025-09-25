'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Nav() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateAuth = () => {
      const has = !!localStorage.getItem('access');
      const userRole = localStorage.getItem('role');
      const user = localStorage.getItem('username');
      console.log('Nav updateAuth - has token:', has, 'role:', userRole, 'username:', user);
      setIsAuthed(has);
      setRole(userRole);
      setUsername(user);
    };
    
    // Initial check
    updateAuth();
    
    // Listen for storage changes
    const onStorage = () => updateAuth();
    window.addEventListener('storage', onStorage);
    
    // Also listen for custom auth events
    window.addEventListener('auth-changed', onStorage);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onStorage);
    };
  }, []);

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      // Trigger auth change event
      window.dispatchEvent(new Event('auth-changed'));
    }
    setIsAuthed(false);
    setRole(null);
    setUsername(null);
    router.push('/login');
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold">Tarajim</Link>
        <Link href="/dashboard" className="text-sm text-gray-700">Dashboard</Link>
        <Link href="/books" className="text-sm text-gray-700">Books</Link>
        <Link href="/profiles" className="text-sm text-gray-700">Profiles</Link>
        {(role === 'requester' || role === 'translator') && (
          <Link href="/translations/requests" className="text-sm text-gray-700">Requests</Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {isAuthed && username && (
            <>
              <span className="text-sm text-gray-600">Welcome, {username}</span>
              <Link href={`/profiles/${username}`} className="text-sm text-gray-700">My Profile</Link>
              <Link href="/profile/edit" className="text-sm text-gray-700">Edit Profile</Link>
            </>
          )}
          {isAuthed && role === 'requester' && (
            <Link href="/payments" className="text-sm text-green-700">Payments</Link>
          )}
          {isAuthed && role === 'translator' && (
            <Link href="/assignments" className="text-sm text-blue-700">My Assignments</Link>
          )}
          {!isAuthed ? (
            <>
              <Link href="/login" className="text-sm text-gray-700">Login</Link>
              <Link href="/register" className="text-sm text-gray-700">Register</Link>
            </>
          ) : (
            <button onClick={logout} className="text-sm text-red-600">Logout</button>
          )}
        </div>
      </div>
    </nav>
  );
}

