import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SoldierView from './pages/SoldierView';
import AdminView from './pages/AdminView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SoldierView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}
