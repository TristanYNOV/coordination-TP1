'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredAuthToken } from '../utils/auth';

type LoginPayload = {
  username: string;
  password: string;
};

type LoginResponse = {
  access_token?: string;
  message?: string;
};

const getAuthBaseUrl = () => {
  const explicitUrl = process.env.NEXT_PUBLIC_BACKEND_AUTH_URL;
  if (explicitUrl) {
    return explicitUrl;
  }
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return 'http://localhost:5005';
  }
  return backendUrl.replace(/:\d+$/, ':5005');
};

export default function LoginPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<LoginPayload>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authBaseUrl = useMemo(() => getAuthBaseUrl(), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${authBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.access_token) {
        setError(data.message ?? 'Impossible de se connecter.');
        return;
      }

      setStoredAuthToken(data.access_token);
      router.replace('/');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Erreur inconnue.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Connexion</h1>
        <p className="mb-6 text-sm text-gray-600">
          Connectez-vous pour récupérer votre jeton JWT et accéder aux API.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Nom d’utilisateur
            <input
              type="text"
              value={payload.username}
              onChange={(event) =>
                setPayload({ ...payload, username: event.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Mot de passe
            <input
              type="password"
              value={payload.password}
              onChange={(event) =>
                setPayload({ ...payload, password: event.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </label>
          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
