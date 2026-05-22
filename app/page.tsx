'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Lock, Loader2 } from 'lucide-react';

export default function Gatekeeper() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Requirements: 8+ alphanumeric characters
    if (code.length < 8) {
      setError('Код должен состоять минимум из 8 символов');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Неверный или использованный код доступа');
      }

      // Successful login
      router.push('/lessons/1');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
          <KeyRound className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">NWO New Way Out</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xs">
            Введите ваш персональный код доступа для входа в систему
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              required
              minLength={8}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-center tracking-wider font-mono text-zinc-900 placeholder:text-zinc-300 placeholder:tracking-normal placeholder:font-sans"
              placeholder="Введите ключ доступа (8+ символов)"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl transition-all shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Проверка...
              </>
            ) : (
              'Войти'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
