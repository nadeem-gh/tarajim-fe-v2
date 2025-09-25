'use client';
import { useState } from 'react';
import { login, getMe } from '@/lib/api';

export default function DebugPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testLogin() {
    setError(null);
    setResult(null);
    try {
      console.log('Testing login with:', username, password);
      const loginResult = await login(username, password);
      console.log('Login result:', loginResult);
      
      const meResult = await getMe();
      console.log('Me result:', meResult);
      
      setResult({ login: loginResult, me: meResult });
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e.message || 'Login failed');
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Debug Login</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input 
            className="w-full border p-2 rounded" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            className="w-full border p-2 rounded" 
            type="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
        </div>
        
        <button 
          onClick={testLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Login
        </button>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}
        
        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h3 className="font-semibold">Success!</h3>
            <pre className="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
