import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RenphoData } from "@/services/renpho";
import { Scale, Activity, Flame, Droplets, HeartPulse, ArrowUpRight, ArrowDownRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line } from "recharts";

interface RenphoBodyMetricsProps {
  data: RenphoData | null;
  loading: boolean;
}

export const RenphoBodyMetrics: React.FC<RenphoBodyMetricsProps> = ({ data, loading }) => {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d'>('all');

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.measurements || data.measurements.length === 0) {
    return (
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100 p-8 text-center">
        <Scale className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No se encontraron datos de Renpho</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
          Ejecuta <code className="bg-slate-800 px-2 py-1 rounded text-cyan-400">pnpm run sync-renpho</code> para sincronizar los datos de tu báscula Renpho.
        </p>
      </Card>
    );
  }

  const measurements = [...data.measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = measurements[measurements.length - 1];
  const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

  // Filtrado por tiempo
  const filteredMeasurements = measurements.filter((m) => {
    if (timeRange === 'all') return true;
    const mDate = new Date(m.date).getTime();
    const now = new Date().getTime();
    const days = timeRange === '30d' ? 30 : 90;
    return (now - mDate) <= (days * 24 * 60 * 60 * 1000);
  });

  // Cálculo de diferencias
  const weightDiff = previous ? (latest.weight_kg - previous.weight_kg) : 0;
  const fatDiff = previous ? (latest.body_fat_percent - previous.body_fat_percent) : 0;
  const muscleDiff = previous ? (latest.muscle_mass_kg - previous.muscle_mass_kg) : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Composición Corporal Renpho</h2>
              {data.is_sample_data ? (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                  Modo Demo / Muestra
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                  Sincronizado
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Última actualización: {new Date(latest.timestamp || latest.date).toLocaleString('es-ES')} ({measurements.length} pesadas registradas)
            </p>
          </div>
        </div>

        {/* Filtros de Rango */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              timeRange === '30d' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30 Días
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              timeRange === '90d' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            90 Días
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              timeRange === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Peso */}
        <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400">Peso Corporal</span>
              <Scale className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{latest.weight_kg} <span className="text-sm font-normal text-slate-400">kg</span></div>
            {previous && (
              <div className={`flex items-center gap-1 text-xs mt-2 ${weightDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {weightDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : weightDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>{weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)} kg</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* % Grasa Corporal */}
        <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400">Grasa Corporal</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{latest.body_fat_percent} <span className="text-sm font-normal text-slate-400">%</span></div>
            {previous && (
              <div className={`flex items-center gap-1 text-xs mt-2 ${fatDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fatDiff < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : fatDiff > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>{fatDiff > 0 ? `+${fatDiff.toFixed(1)}` : fatDiff.toFixed(1)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Masa Muscular */}
        <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400">Masa Muscular</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{latest.muscle_mass_kg} <span className="text-sm font-normal text-slate-400">kg</span></div>
            {previous && (
              <div className={`flex items-center gap-1 text-xs mt-2 ${muscleDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {muscleDiff > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : muscleDiff < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>{muscleDiff > 0 ? `+${muscleDiff.toFixed(1)}` : muscleDiff.toFixed(1)} kg</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IMC */}
        <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400">Índice IMC</span>
              <HeartPulse className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{latest.bmi}</div>
            <div className="text-xs text-slate-400 mt-2">
              {latest.bmi < 18.5 ? 'Bajo peso' : latest.bmi < 25 ? 'Normal' : latest.bmi < 30 ? 'Sobrepeso' : 'Elevado'}
            </div>
          </CardContent>
        </Card>

        {/* Agua Corporal */}
        <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400">Agua Corporal</span>
              <Droplets className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{latest.water_percent} <span className="text-sm font-normal text-slate-400">%</span></div>
            <div className="text-xs text-slate-400 mt-2">Nivel hidratación</div>
          </CardContent>
        </Card>

        {/* Edad Metabólica */}
        <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400">Edad Metabólica</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{latest.metabolic_age} <span className="text-sm font-normal text-slate-400">años</span></div>
            <div className="text-xs text-slate-400 mt-2">BMR: {latest.bmr} kcal</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Evolución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Peso y % Grasa Corporal */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="text-md font-semibold text-slate-200 flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              Evolución de Peso y % Grasa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredMeasurements} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} stroke="#06b6d4" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} stroke="#f59e0b" tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                    labelFormatter={(value) => `Fecha: ${value}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area yAxisId="left" type="monotone" dataKey="weight_kg" name="Peso (kg)" stroke="#06b6d4" fillOpacity={1} fill="url(#weightGradient)" strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="body_fat_percent" name="% Grasa Corporal" stroke="#f59e0b" fillOpacity={1} fill="url(#fatGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Masa Muscular vs Agua Corporal */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="text-md font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Masa Muscular (kg) y % Hidratación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredMeasurements} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#3b82f6" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} stroke="#38bdf8" tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line yAxisId="left" type="monotone" dataKey="muscle_mass_kg" name="Masa Muscular (kg)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="water_percent" name="% Agua Corporal" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial en Tabla */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle className="text-md font-semibold text-slate-200">Historial Reciente de Pesadas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">% Grasa</th>
                <th className="px-4 py-3">Masa Muscular</th>
                <th className="px-4 py-3">IMC</th>
                <th className="px-4 py-3">% Agua</th>
                <th className="px-4 py-3">Edad Metabólica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[...filteredMeasurements].reverse().slice(0, 10).map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">{m.date}</td>
                  <td className="px-4 py-3 font-semibold text-cyan-400">{m.weight_kg} kg</td>
                  <td className="px-4 py-3 text-amber-400">{m.body_fat_percent}%</td>
                  <td className="px-4 py-3 text-blue-400">{m.muscle_mass_kg} kg</td>
                  <td className="px-4 py-3 text-slate-300">{m.bmi}</td>
                  <td className="px-4 py-3 text-sky-400">{m.water_percent}%</td>
                  <td className="px-4 py-3 text-emerald-400">{m.metabolic_age} años</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
