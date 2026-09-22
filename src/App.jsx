import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SoldierView from './pages/SoldierView';
import AdminView from './pages/AdminView';
import RoutineUpdatesView from './pages/RoutineUpdatesView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SoldierView />} />
        <Route path="/routine" element={<RoutineUpdatesView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}
