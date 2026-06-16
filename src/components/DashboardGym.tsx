import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { hevyService } from '@/services/hevy';
import { Dumbbell, Calendar, Clock, TrendingUp, Flame, Bike, Waves, Sun, Moon, LayoutDashboard } from "lucide-react";

const getMuscleGroup = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('remo') || t.includes('jalón') || t.includes('row') || t.includes('dominada') || t.includes('pull') || t.includes('lat')) return 'Espalda';
  if (t.includes('pecho') || t.includes('aperturas') || t.includes('press') || t.includes('chest') || t.includes('pec')) return 'Pecho';
  if (t.includes('hombro') || t.includes('vuelos') || t.includes('elevación') || t.includes('shoulder') || t.includes('deltoides') || t.includes('encogimiento')) return 'Hombros';
  if (t.includes('bíceps') || t.includes('curl')) return 'Bíceps';
  if ((t.includes('tríceps') || t.includes('extensión')) && !t.includes('pierna') && !t.includes('pantorrilla')) return 'Tríceps';
  if (t.includes('pierna') || t.includes('sentadilla') || t.includes('prensa') || t.includes('pantorrilla') || t.includes('abducción') || t.includes('hack') || t.includes('leg') || t.includes('cuádriceps') || t.includes('femoral')) return 'Piernas';
  if (t.includes('torso') || t.includes('abdominales') || t.includes('crunch') || t.includes('core')) return 'Core';
  return 'Otros';
};

const MUSCLE_COLORS: Record<string, string> = {
  'Espalda': '#3b82f6',
  'Pecho': '#ef4444',
  'Hombros': '#eab308',
  'Bíceps': '#8b5cf6',
  'Tríceps': '#06b6d4',
  'Piernas': '#22c55e',
  'Core': '#f97316',
  'Otros': '#94a3b8',
};

export default function DashboardAtleta() {
  // Estados de navegación y tema
  const [activeSection, setActiveSection] = useState<'global' | 'gym' | 'swim' | 'bike'>('global');
  const [darkMode, setDarkMode] = useState<boolean>(true); // Por defecto en oscuro

  // Estados de datos (Gimnasio)
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalVolume: 0, totalDuration: 0, workoutCount: 0 });
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Datos mockeados realistas para Natación y Bicicleta (reemplazar por tus servicios/API correspondientes)
  const swimData = [
    { fecha: '01 May', largos: 20, metros: 500, minutos: 25 },
    { fecha: '05 May', largos: 25, metros: 625, minutos: 30 },
    { fecha: '10 May', largos: 30, metros: 750, minutos: 32 },
    { fecha: '14 May', largos: 40, metros: 1000, minutos: 42 },
  ];

  const bikeData = [
    { fecha: '12 May', km: 10, velocidadMed: 24.5, elevacion: 45 },
    { fecha: '13 May', km: 12, velocidadMed: 26.1, elevacion: 50 },
    { fecha: '15 May', km: 25, velocidadMed: 28.3, elevacion: 120 }, // Simulación de Alleycat o salida larga
    { fecha: '18 May', km: 10, velocidadMed: 25.0, elevacion: 45 },
  ];

  const getWorkoutVolume = (workout: any) => workout.exercises?.reduce(
    (exerciseAcc: number, exercise: any) =>
      exerciseAcc +
      (exercise.sets?.reduce(
        (setAcc: number, set: any) => setAcc + ((set.weight_kg || 0) * (set.reps || 0)),
        0
      ) || 0),
    0
  ) || 0;

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await hevyService.getRecentWorkouts(1, 30); 
        setWorkouts(data);

        let volumeAccumulator = 0;
        let durationAccumulator = 0;
        const prs: Record<string, any> = {};
        const weeksMap: Record<string, any> = {};
        
        [...data].reverse().forEach((workout) => {
          const vol = getWorkoutVolume(workout);
          
          let duration = 0;
          if (workout.start_time && workout.end_time) {
            const start = new Date(workout.start_time).getTime();
            const end = new Date(workout.end_time).getTime();
            duration = Math.max(0, Math.round((end - start) / 60000));
          } else {
            duration = workout.duration_minutes || 0;
          }
          workout.calculated_duration = duration;
          durationAccumulator += duration;

          if (workout.start_time) {
            const dateObj = new Date(workout.start_time);
            const weekNum = getWeekNumber(dateObj);
            const year = dateObj.getFullYear();
            const weekKey = `${year}-W${weekNum}`;

            if (!weeksMap[weekKey]) {
              weeksMap[weekKey] = { name: `Sem. ${weekNum}`, volumen: 0, sesiones: 0 };
            }
            weeksMap[weekKey].volumen += vol;
            weeksMap[weekKey].sesiones += 1;
          }

          workout.exercises?.forEach((exercise: any) => {
            exercise.sets?.forEach((set: any) => {
              if (set.weight_kg && set.reps) {
                const setVolume = set.weight_kg * set.reps;
                volumeAccumulator += setVolume;

                const exerciseName = exercise.title || "Ejercicio";
                if (!prs[exerciseName] || set.weight_kg > prs[exerciseName].weight) {
                  prs[exerciseName] = {
                    weight: set.weight_kg,
                    reps: set.reps,
                    date: workout.start_time ? new Date(workout.start_time).toLocaleDateString() : 'Reciente'
                  };
                }
              }
            });
          });
        });

        setMetrics({
          totalVolume: volumeAccumulator,
          totalDuration: durationAccumulator,
          workoutCount: data.length
        });
        setPersonalRecords(Object.entries(prs).map(([name, info]) => ({ name, ...info })).slice(0, 6));
        setChartData(Object.values(weeksMap));
      } catch (e) {
        console.error("Error cargando entrenamientos", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const allExercisesData = useMemo(() => {
    const exercisesMap: Record<string, any[]> = {};

    [...workouts].reverse().forEach(workout => {
      workout.exercises?.forEach((exercise: any) => {
        const title = exercise.title;
        if (!title) return;

        let maxWeight = 0;
        let totalVolume = 0;
        let bestEstimated1RM = 0;

        exercise.sets?.forEach((set: any) => {
          const weight = set.weight_kg || 0;
          const reps = set.reps || 0;
          if (weight > 0 && reps > 0) {
            totalVolume += weight * reps;
            if (weight > maxWeight) maxWeight = weight;
            
            const estimated1RM = weight * (1 + reps / 30);
            if (estimated1RM > bestEstimated1RM) {
              bestEstimated1RM = Math.round(estimated1RM * 10) / 10;
            }
          }
        });

        if (maxWeight > 0) {
          if (!exercisesMap[title]) {
            exercisesMap[title] = [];
          }
          
          const dateObj = workout.start_time ? new Date(workout.start_time) : null;
          exercisesMap[title].push({
            fecha: dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Reciente',
            pesoMax: maxWeight,
            volumen: totalVolume,
            e1rm: bestEstimated1RM
          });
        }
      });
    });

    return exercisesMap;
  }, [workouts]);

  const filteredExercises = useMemo(() => {
    return Object.entries(allExercisesData)
      .filter(([title]) => title.toLowerCase().includes(searchFilter.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [allExercisesData, searchFilter]);

  const muscleGroupData = useMemo(() => {
    const groups: Record<string, number> = {};
    workouts.forEach(workout => {
      workout.exercises?.forEach((exercise: any) => {
        if (!exercise.title) return;
        const group = getMuscleGroup(exercise.title);
        
        let setsCount = 0;
        exercise.sets?.forEach((set: any) => {
          if (set.reps && set.weight_kg) setsCount += 1;
        });

        if (setsCount > 0) {
          groups[group] = (groups[group] || 0) + setsCount;
        }
      });
    });
    
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [workouts]);

  const { chartsToShow, tableToShow } = useMemo(() => {
    const charts: any[] = [];
    const table: any[] = [];
    filteredExercises.forEach(([title, history]) => {
      if (history.length >= 2) {
        charts.push([title, history]);
      } else {
        table.push([title, history]);
      }
    });
    return { chartsToShow: charts, tableToShow: table };
  }, [filteredExercises]);

  const globalData = useMemo(() => {
    let totalGymHours = 0;
    let totalSwimHours = 0;
    let totalBikeHours = 0;
    
    const weeklyLoadMap: Record<string, { name: string; gym: number; swim: number; bike: number; dateValue: number }> = {};
    const activityHeatmap: Record<string, boolean> = {};

    workouts.forEach(w => {
      const duration = w.calculated_duration || 0;
      totalGymHours += duration / 60;
      if (w.start_time) {
        const dateObj = new Date(w.start_time);
        const dateStr = dateObj.toISOString().split('T')[0];
        activityHeatmap[dateStr] = true;
        
        const weekNum = getWeekNumber(dateObj);
        const weekKey = `${dateObj.getFullYear()}-W${weekNum}`;
        if (!weeklyLoadMap[weekKey]) weeklyLoadMap[weekKey] = { name: `S${weekNum}`, gym: 0, swim: 0, bike: 0, dateValue: dateObj.getTime() };
        weeklyLoadMap[weekKey].gym += duration / 60;
      }
    });

    swimData.forEach(s => {
       totalSwimHours += s.minutos / 60;
       const d = parseInt(s.fecha.split(' ')[0]);
       const dateStr = `2026-05-${d.toString().padStart(2, '0')}`;
       activityHeatmap[dateStr] = true;
       const weekKey = `2026-W${Math.ceil(d/7) + 17}`; 
       if (!weeklyLoadMap[weekKey]) weeklyLoadMap[weekKey] = { name: `S${Math.ceil(d/7) + 17}`, gym: 0, swim: 0, bike: 0, dateValue: new Date(dateStr).getTime() };
       weeklyLoadMap[weekKey].swim += s.minutos / 60;
    });

    bikeData.forEach(b => {
      const hours = b.km / b.velocidadMed;
      totalBikeHours += hours;
       const d = parseInt(b.fecha.split(' ')[0]);
       const dateStr = `2026-05-${d.toString().padStart(2, '0')}`;
       activityHeatmap[dateStr] = true;
       const weekKey = `2026-W${Math.ceil(d/7) + 17}`; 
       if (!weeklyLoadMap[weekKey]) weeklyLoadMap[weekKey] = { name: `S${Math.ceil(d/7) + 17}`, gym: 0, swim: 0, bike: 0, dateValue: new Date(dateStr).getTime() };
       weeklyLoadMap[weekKey].bike += hours;
    });

    const sortedWeeklyLoad = Object.values(weeklyLoadMap).sort((a, b) => a.dateValue - b.dateValue);
    
    const totals = [
      { name: 'Gimnasio', hours: totalGymHours },
      { name: 'Ciclismo', hours: totalBikeHours },
      { name: 'Natación', hours: totalSwimHours }
    ].sort((a, b) => b.hours - a.hours);

    return {
      totalHours: totalGymHours + totalSwimHours + totalBikeHours,
      totalActiveDays: Object.keys(activityHeatmap).length,
      topSport: totals[0].hours > 0 ? totals[0].name : 'Ninguno',
      weeklyLoad: sortedWeeklyLoad,
      activityHeatmap
    };
  }, [workouts]);

  if (loading) {
    return (
      <div className={`w-full min-h-screen p-8 ${darkMode ? 'dark bg-zinc-950' : 'bg-zinc-50'}`}>
        <div className="mx-auto max-w-6xl flex flex-col gap-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    // Forzamos la clase .dark basándonos en el estado local de React
    <div className={`w-full min-h-screen font-sans ${darkMode ? 'dark bg-zinc-950 text-zinc-50' : 'bg-zinc-50 text-zinc-900'} transition-colors duration-200`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        
        {/* BARRA SUPERIOR E INTERRUPTOR DE TEMA */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2 font-bold tracking-tight text-xl">
            <LayoutDashboard className="text-primary size-5" />
            <span>Multisport Dashboard</span>
          </div>
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-xs font-medium shadow-xs"
          >
            {darkMode ? (
              <>
                <Sun className="size-4 text-amber-500" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="size-4 text-indigo-500" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>
        </div>

        {/* NAVEGACIÓN SECCIONES PRINCIPALES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:flex sm:items-center bg-zinc-200/60 dark:bg-zinc-900/60 p-1 rounded-xl w-full sm:w-fit border border-zinc-200/80 dark:border-zinc-800/80">
          <button
            onClick={() => setActiveSection('global')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeSection === 'global' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
          >
            <LayoutDashboard className="size-4" />
            <span>Resumen</span>
          </button>
          <button
            onClick={() => setActiveSection('gym')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeSection === 'gym' ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
          >
            <Dumbbell className="size-4" />
            <span>Gimnasio</span>
          </button>
          <button
            onClick={() => setActiveSection('swim')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeSection === 'swim' ? 'bg-white dark:bg-zinc-800 text-sky-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
          >
            <Waves className="size-4" />
            <span>Natación</span>
          </button>
          <button
            onClick={() => setActiveSection('bike')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeSection === 'bike' ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
          >
            <Bike className="size-4" />
            <span>Ciclismo</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* ================= CONTENIDO: GLOBAL ===================== */}
        {/* ======================================================== */}
        {activeSection === 'global' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-zinc-900 dark:text-zinc-100">Carga Combinada</h2>
                <p className="text-sm text-muted-foreground">Resumen global de todos tus esfuerzos: Gimnasio, Natación y Ciclismo.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Total Invertido</CardTitle>
                  <Clock className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {Math.floor(globalData.totalHours)}h {Math.round((globalData.totalHours % 1) * 60)}m
                  </div>
                </CardContent>
              </Card>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Días Activos (Historial)</CardTitle>
                  <Calendar className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{globalData.totalActiveDays} días</div>
                </CardContent>
              </Card>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Deporte Principal</CardTitle>
                  <Flame className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{globalData.topSport}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="text-zinc-400 size-4" /> Carga Semanal por Deporte (Horas)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ChartContainer config={{ gym: { label: "Gimnasio", color: "#f97316" }, swim: { label: "Natación", color: "#0ea5e9" }, bike: { label: "Ciclismo", color: "#10b981" } }} className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalData.weeklyLoad}>
                      <CartesianGrid vertical={false} className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] fill-muted-foreground" />
                      <YAxis tickLine={false} axisLine={false} className="text-[10px] fill-muted-foreground" tickFormatter={(v) => `${v.toFixed(1)}h`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="gym" stackId="a" fill="var(--color-gym)" radius={[0, 0, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="bike" stackId="a" fill="var(--color-bike)" radius={[0, 0, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="swim" stackId="a" fill="var(--color-swim)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Consistencia de Entrenamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {/* Generamos un heatmap visual de los últimos 30 días */}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    const dateStr = d.toISOString().split('T')[0];
                    const isActive = globalData.activityHeatmap[dateStr];
                    return (
                      <div 
                        key={dateStr} 
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-colors ${isActive ? 'bg-primary border border-primary/20' : 'bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800'}`}
                        title={`${dateStr}: ${isActive ? 'Entrenaste' : 'Descanso'}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>Hace 30 días</span>
                  <span>Hoy</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* ================= CONTENIDO: GIMNASIO =================== */}
        {/* ======================================================== */}
        {activeSection === 'gym' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header Adaptable */}
            <div className="grid gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Rutina de Fuerza</h2>
                <p className="text-sm text-muted-foreground">Métricas integradas desde Hevy para optimizar tu sobrecarga progresiva.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  <Flame className="size-3.5 fill-orange-500/20" />
                  <span>Racha Activa</span>
                </div>
                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none">Sincronizado</Badge>
              </div>
            </div>

            <Tabs defaultValue="overview" className="flex flex-col gap-4">
              <TabsList className="w-fit bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <TabsTrigger value="overview">Panel General</TabsTrigger>
                <TabsTrigger value="exercise-history">Progreso por Ejercicio</TabsTrigger>
                <TabsTrigger value="records">PRs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Volumen Total Bloque</CardTitle>
                      <Dumbbell className="text-muted-foreground size-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight">{metrics.totalVolume.toLocaleString()} kg</div>
                    </CardContent>
                  </Card>
                  <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Sesiones Analizadas</CardTitle>
                      <Calendar className="text-muted-foreground size-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight">{metrics.workoutCount} entrenos</div>
                    </CardContent>
                  </Card>
                  <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo de Trabajo</CardTitle>
                      <Clock className="text-muted-foreground size-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight">
                        {metrics.totalDuration > 60 
                          ? `${Math.floor(metrics.totalDuration / 60)}h ${metrics.totalDuration % 60}m` 
                          : `${metrics.totalDuration} min`}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                  <Card className="col-span-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="text-zinc-400 size-4" /> Consistencia Semanal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ChartContainer config={{ volumen: { label: "Volumen", color: "hsl(var(--primary))" } }} className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid vertical={false} className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="3 3" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] fill-muted-foreground" />
                            <YAxis tickLine={false} axisLine={false} className="text-[10px] fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                            <Bar dataKey="volumen" fill="currentColor" className="text-primary" radius={[4, 4, 0, 0]} maxBarSize={35} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="col-span-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                    <CardHeader><CardTitle className="text-sm font-semibold">Historial Reciente</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2">
                        {workouts.slice(0, 5).map((w: any) => {
                          const dateObj = w.start_time ? new Date(w.start_time) : null;
                          const dateStr = dateObj ? dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Reciente';
                          const timeStr = dateObj ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                          return (
                            <div key={w.id} className="flex flex-col gap-1 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900">
                              <div className="flex justify-between items-center">
                                <span className="font-bold truncate max-w-[180px] text-zinc-900 dark:text-zinc-100">{w.title}</span>
                                <span className="text-zinc-500 font-medium shrink-0 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{w.calculated_duration || 0} min</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                <span className="flex items-center gap-1"><Calendar className="size-3" /> {dateStr} {timeStr && `• ${timeStr}`}</span>
                                <span className="flex items-center gap-1"><Dumbbell className="size-3" /> {w.exercises?.length || 0} ejer.</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="exercise-history" className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <input
                    type="text"
                    placeholder="🔍 Filtrar ejercicio..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full sm:w-[260px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                  />
                </div>

                {/* Distribución Muscular */}
                {muscleGroupData.length > 0 && (
                  <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Distribución Muscular (Series)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="h-[160px] w-full sm:w-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={muscleGroupData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {muscleGroupData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={MUSCLE_COLORS[entry.name] || MUSCLE_COLORS['Otros']} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col sm:w-full max-h-[160px] overflow-y-auto">
                        {muscleGroupData.map((mg) => (
                          <div key={mg.name} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MUSCLE_COLORS[mg.name] || MUSCLE_COLORS['Otros'] }} />
                              <span className="font-medium">{mg.name}</span>
                            </div>
                            <span className="text-muted-foreground">{mg.value} series</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráficas de Tendencia (>= 2 puntos) */}
                {chartsToShow.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 mt-4 text-zinc-900 dark:text-zinc-100">Tendencias de Progreso</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {chartsToShow.map(([title, history]) => {
                        const currentMax = history[history.length - 1]?.pesoMax || 0;
                        const group = getMuscleGroup(title);
                        const groupColor = MUSCLE_COLORS[group] || 'currentColor';
                        return (
                          <Card key={title} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <CardTitle className="text-xs font-bold truncate max-w-[180px]" title={title}>{title}</CardTitle>
                                  <span className="text-[10px] text-muted-foreground" style={{ color: groupColor }}>{group}</span>
                                </div>
                                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded" title="Peso Máximo">{currentMax} kg</span>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <ChartContainer config={{ pesoMax: { label: "Peso Máx." }, volumen: { label: "Volumen" } }} className="h-[100px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={history} margin={{ left: -15, right: 5 }}>
                                    <defs>
                                      <linearGradient id={`grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={groupColor} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={groupColor} stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800" strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha" tickLine={false} axisLine={false} className="text-[9px] fill-zinc-400" />
                                    <YAxis tickLine={false} axisLine={false} className="text-[9px] fill-zinc-400" domain={['dataMin - 5', 'dataMax + 5']} />
                                    <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                                    <Area type="monotone" dataKey="pesoMax" stroke={groupColor} strokeWidth={2} fill={`url(#grad-${title.replace(/[^a-zA-Z0-9]/g, '')})`} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </ChartContainer>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tabla de Ejercicios Esporádicos (< 2 puntos) */}
                {tableToShow.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Ejercicios Esporádicos</h3>
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                      <CardContent className="p-4">
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {tableToShow.map(([title, history]) => {
                            const currentMax = history[0]?.pesoMax || 0;
                            const dateStr = history[0]?.fecha || '';
                            const group = getMuscleGroup(title);
                            return (
                              <div key={title} className="flex justify-between items-center p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                                <div className="flex flex-col">
                                  <span className="font-bold truncate max-w-[150px]" title={title}>{title}</span>
                                  <span className="text-[10px] text-muted-foreground">{dateStr} • <span style={{ color: MUSCLE_COLORS[group] || 'inherit' }}>{group}</span></span>
                                </div>
                                <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">{currentMax} kg</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="records">
                <div className="grid gap-4 sm:grid-cols-2">
                  {personalRecords.map((pr: any, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                      <div>
                        <p className="text-sm font-bold text-foreground truncate max-w-[220px]">{pr.name}</p>
                        <span className="text-[10px] text-zinc-400">{pr.date}</span>
                      </div>
                      <div className="text-right bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">
                        <span className="text-sm font-black text-primary block">{pr.weight} kg</span>
                        <span className="text-[10px] text-zinc-400">{pr.reps} reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ======================================================== */}
        {/* ================= CONTENIDO: NATACIÓN ================== */}
        {/* ======================================================== */}
        {activeSection === 'swim' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-sky-600 dark:text-sky-400">Rendimiento en Piscina</h2>
                <p className="text-sm text-muted-foreground">Volumen de entrenamiento, control de distancia total y capacidad aeróbica.</p>
              </div>
              <Waves className="text-sky-500 size-8 shrink-0 hidden md:block opacity-80" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Distancia Máxima</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-sky-600 dark:text-sky-400">1,000 metros</div></CardContent>
              </Card>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Mejor Marca (40 Largos)</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">42 minutos</div></CardContent>
              </Card>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Largos Totales (Mes)</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">115 vueltas</div></CardContent>
              </Card>
            </div>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader><CardTitle className="text-sm font-semibold">Progresión de Volumen (Metros Acumulados)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ metros: { label: "Metros Nadados" } }} className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={swimData}>
                      <CartesianGrid vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800" strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" className="text-[10px] fill-zinc-400" />
                      <YAxis className="text-[10px] fill-zinc-400" tickFormatter={(v) => `${v}m`} />
                      <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                      <Area type="monotone" dataKey="metros" stroke="#0284c7" strokeWidth={2.5} fill="url(#swimGradient)" />
                      <defs>
                        <linearGradient id="swimGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* ================= CONTENIDO: CICLISMO =================== */}
        {/* ======================================================== */}
        {activeSection === 'bike' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-emerald-600 dark:text-emerald-400">Rendimiento Ciclista</h2>
                <p className="text-sm text-muted-foreground">Métricas de velocidad media, entrenamientos urbanos en piñón fijo y distancias.</p>
              </div>
              <Bike className="text-emerald-500 size-8 shrink-0 hidden md:block opacity-80" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Velocidad Media Máxima</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">28.3 km/h</div></CardContent>
              </Card>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Última Distancia Larga</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">25.0 km</div></CardContent>
              </Card>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Desnivel Acumulado</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">260 m</div></CardContent>
              </Card>
            </div>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader><CardTitle className="text-sm font-semibold">Análisis de Velocidad Media por Salida</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ velocidadMed: { label: "Velocidad Media" } }} className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bikeData}>
                      <CartesianGrid vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800" strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" className="text-[10px] fill-zinc-400" />
                      <YAxis className="text-[10px] fill-zinc-400" tickFormatter={(v) => `${v} km/h`} />
                      <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                      <Line type="monotone" dataKey="velocidadMed" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}