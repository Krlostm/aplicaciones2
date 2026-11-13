import {
  BookOpen,
  Database,
  Network,
  RadioTower,
  Code2,
  Calculator,
  Sigma,
  Atom,
  FlaskConical,
  ChartNoAxesCombined,
  Languages,
  MonitorCog,
} from 'lucide-react';

const icons = [
  [/base.*datos|sql/, Database],
  [/estructur.*datos/, Network],
  [/redes|comunicacion/, RadioTower],
  [/programacion|algoritm/, Code2],
  [/calculo/, Calculator],
  [/matematic|algebra/, Sigma],
  [/fisica/, Atom],
  [/quimica/, FlaskConical],
  [/estadistica/, ChartNoAxesCombined],
  [/ingles|idioma/, Languages],
  [/sistema.*operativ/, MonitorCog],
];
export default function SubjectIcon({ subject, ...props }) {
  const normalized = (subject || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const Icon = icons.find(([pattern]) => pattern.test(normalized))?.[1] || BookOpen;
  return <Icon {...props} aria-hidden="true" />;
}
