import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Ingredients from './pages/Ingredients';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Employees from './pages/Employees';
import ReloadPrompt from './components/ReloadPrompt';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <ReloadPrompt />
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/employees" element={<Employees />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
