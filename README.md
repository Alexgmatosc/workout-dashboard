# 🏋️ Workout & Multisport Dashboard

Un dashboard de rendimiento deportivo y composición corporal moderno, interactivo y personal. Integra automáticamente entrenamientos de fuerza desde **Hevy API**, datos de composición corporal desde tu báscula inteligente **Renpho**, y métricas de natación y ciclismo en una sola interfaz estética con modo oscuro/claro y gráficos avanzados.

![Dashboard Preview](public/renpho_data.json)

---

## ✨ Características Principales

### 📊 Dashboard Global & Gráfico de Correlación
- **Gráfico Combinado de Doble Eje Y**: Visualiza en la misma línea temporal la relación directa entre el **Volumen de Entrenamiento en Gimnasio (kg)** y tus **Índices Corporales (Peso, % Grasa Corporal, Masa Muscular)**.
- **Controles de Conmutación**: Filtra interactivamente entre *Volumen vs. Peso*, *Volumen vs. % Grasa* y *Volumen vs. Masa Muscular*.
- **Heatmap de Consistencia**: Resumen visual de los días activos del mes.

### 🏋️ Gimnasio (Integración Hevy)
- Sincronización de entrenamientos de fuerza y rutinas mediante **Hevy API**.
- Cálculo de volumen total (kg cargados), duración de sesiones, repeticiones y récords personales (PRs).
- Estimación automática de **e1RM** (1 Repetición Máxima) por ejercicio.
- Distribución de volumen por **Grupos Musculares** (Espalda, Pecho, Piernas, Hombros, Bíceps, Tríceps, Core).

### ⚖️ Composición Corporal (Báscula Inteligente Renpho)
- Extracción de datos en tiempo real a través de **`renpho-api`**.
- Tarjetas de KPIs: **Peso (kg)**, **% Grasa Corporal**, **Masa Muscular (kg)**, **IMC**, **% Agua Corporal** y **Edad Metabólica**.
- Gráficos históricos de evolución y tabla detallada de pesadas recientes con deltas de cambio (ej. `-0.4 kg`).

### 🏊 Natación & 🚴 Ciclismo
- Seguimiento de metros nadados, velocidad media y desniveles en salidas ciclistas.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualización de Datos**: [Recharts](https://recharts.org/)
- **Iconos & Componentes**: [Lucide React](https://lucide.dev/), [Shadcn UI](https://ui.shadcn.com/)
- **Extracción de Datos de Báscula**: Python 3 + [`renpho-api`](https://pypi.org/project/renpho-api/)
- **Serverless / Cloud**: Vercel Functions (Node.js & Python) + `vercel.json`

---

## 🚀 Instalación y Uso Local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Alexgmatosc/workout-dashboard.git
cd workout-dashboard

# Instalar dependencias de Node
pnpm install

# Crear entorno virtual de Python e instalar renpho-api
python3 -m venv .venv
.venv/bin/pip install renpho-api python-dotenv
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_HEVY_API_KEY="tu_api_key_de_hevy"
RENPHO_EMAIL="tu_email_de_renpho"
RENPHO_PASSWORD="tu_password_de_renpho"
```

### 3. Iniciar el Servidor de Desarrollo

El comando `pnpm dev` ejecutará automáticamente el script de sincronización con Renpho antes de iniciar Vite:

```bash
pnpm dev
```

Si deseas sincronizar tus datos de la báscula de forma manual en cualquier momento:

```bash
pnpm run sync-renpho
```

---

## ☁️ Despliegue en Vercel

El proyecto viene preparado con Serverless Functions (`api/renpho.py` y `api/hevy.js`) y `vercel.json` para desplegar en un clic:

1. Conecta tu repositorio de GitHub en [Vercel](https://vercel.com).
2. Añade las siguientes **Environment Variables** en el panel de Vercel:
   - `VITE_HEVY_API_KEY`
   - `RENPHO_EMAIL`
   - `RENPHO_PASSWORD`
3. Haz clic en **Deploy**. Vercel compilará la aplicación e iniciará las funciones Serverless automáticas para Renpho y Hevy.

---

## 📝 Licencia

Licencia MIT. Desarrollado para el seguimiento deportivo y de salud personal.
