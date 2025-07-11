import { Routes, Route } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';

// Páginas de la app
import Dashboard from '../pages/Dashboard.jsx';
import Transactions from '../pages/Transactions.jsx';
import Categories from '../pages/Categories.jsx';
import Budgets from '../pages/Budgets.jsx';
import Statistics from '../pages/Statistics.jsx';
import Settings from '../pages/Settings.jsx';
import Profile from '../pages/Profile..jsx';
import NotFound from '../pages/NotFound.jsx';
import Cards from '../pages/Cards.jsx'; // crea esta página
import PaymentHistory from '../pages/PaymentHistory.jsx';

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="transactions" element={<Transactions />} />
      <Route path="categories" element={<Categories />} />
      <Route path="budgets" element={<Budgets />} />
      <Route path="statistics" element={<Statistics />} />
      <Route path="settings" element={<Settings />} />
      <Route path="historial" element={<PaymentHistory />} />
      <Route path="profile" element={<Profile />} />


      <Route path="/cards" element={<Cards />} />

      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default AppRouter;
