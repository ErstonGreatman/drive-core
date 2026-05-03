import type { JSX } from 'solid-js';
import { lazy } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { Layout } from './components/Layout';

const Home = lazy(() => import('./routes/Home'));
const About = lazy(() => import('./routes/About'));
const PilotBuilder = lazy(() => import('./routes/pilots/PilotBuilder'));
const PilotSheet = lazy(() => import('./routes/pilots/PilotSheet'));
const MechaBuilder = lazy(() => import('./routes/mecha/MechaBuilder'));
const MechaSheet = lazy(() => import('./routes/mecha/MechaSheet'));

export default function App(): JSX.Element {
  return (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/pilots/:id" component={PilotBuilder} />
      <Route path="/pilots/:id/sheet" component={PilotSheet} />
      <Route path="/mecha/:id" component={MechaBuilder} />
      <Route path="/mecha/:id/sheet" component={MechaSheet} />
    </Router>
  );
}
