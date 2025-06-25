import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WineList from './pages/WineList';
import WineDetail from './pages/WineDetail';
import AddWine from './pages/AddWine';
import EditWine from './pages/EditWine';
import RackVisualization from './pages/RackVisualization';
import MemoryManagement from './pages/MemoryManagement';
import MemoryDetail from './pages/MemoryDetail';
import AddMemory from './pages/AddMemory';
import Archives from './pages/Archives';

const App: FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wines" element={<WineList />} />
          <Route path="/wines/add" element={<AddWine />} />
          <Route path="/wines/:id" element={<WineDetail />} />
          <Route path="/wines/:id/edit" element={<EditWine />} />
          <Route path="/rack" element={<RackVisualization />} />
          <Route path="/memories" element={<MemoryManagement />} />
          <Route path="/memories/add" element={<AddMemory />} />
          <Route path="/memories/:id" element={<MemoryDetail />} />
          <Route path="/archives" element={<Archives />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;