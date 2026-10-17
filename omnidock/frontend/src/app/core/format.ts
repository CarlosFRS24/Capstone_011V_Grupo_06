/** "125" -> "2 h 5 min" */
export function duracion(min?: number | null): string {
  if (min == null) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function segundosRestantes(isoFin: string): number {
  return Math.max(0, Math.floor((new Date(isoFin).getTime() - Date.now()) / 1000));
}

/** 754 -> "12:34" */
export function mmss(seg: number): string {
  const m = Math.floor(seg / 60), s = seg % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Tiempo transcurrido desde un instante, "01:23:45" */
export function hhmmss(desdeIso: string): string {
  const t = Math.max(0, Math.floor((Date.now() - new Date(desdeIso).getTime()) / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "09:15" en hora local */
export function hora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "Hoy", "Ayer" o "20 sep" (con año si no es el actual) */
export function etiquetaDia(iso: string): string {
  const d = new Date(iso), hoy = new Date();
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((dia(hoy) - dia(d)) / 86400000);
  if (dif === 0) return 'Hoy';
  if (dif === 1) return 'Ayer';
  const base = `${d.getDate()} ${MESES[d.getMonth()]}`;
  return d.getFullYear() === hoy.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "04 oct 2026, 14:32" */
export function fechaHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${hora(iso)}`;
}

/** "Camila Soto" -> "CS" */
export function iniciales(nombre?: string | null): string {
  const p = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '—';
}

/** "Sede Maipu - Acceso Norte" -> ["Sede Maipu", "Acceso Norte"] */
export function partirUbicacion(u: string): [string, string] {
  const i = u.indexOf(' - ');
  return i < 0 ? [u, ''] : [u.slice(0, i), u.slice(i + 3)];
}
