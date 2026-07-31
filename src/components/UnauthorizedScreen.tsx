import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldAlert, KeyRound, ArrowRight } from "lucide-react";
import { authLib } from '@/lib/auth';

interface UnauthorizedScreenProps {
  onSuccess: () => void;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({ onSuccess }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    const validTokens = authLib.getValidTokens();

    if (validTokens.includes(cleanToken)) {
      authLib.saveToken(cleanToken);
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Acceso Protegido</h1>
          <p className="text-sm text-slate-400">
            Se requiere un token de acceso válido para ver tu Workout Dashboard.
          </p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Ingresa tu Token de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Introduce tu token aquí..."
                  className={`w-full px-4 py-2.5 rounded-lg bg-slate-950 border ${
                    error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  } text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors`}
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Token incorrecto. Inténtalo de nuevo.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
              >
                <span>Acceder al Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Tip: Puedes acceder directamente añadiendo <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400">?token=TU_TOKEN</code> a la URL.
        </p>
      </div>
    </div>
  );
};
