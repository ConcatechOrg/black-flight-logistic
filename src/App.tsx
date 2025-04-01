import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Rastreamento from './pages/Rastreamento';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Encomendas from './pages/admin/Encomendas';
import Remessas from './pages/admin/Remessas';
import RemessaDetalhes from './pages/admin/RemessaDetalhes';
import Configuracoes from './pages/admin/Configuracoes';

function App() {
  return (
    <Router>
      <Routes>
        {/* Site público */}
        <Route path="/" element={<Home />} />
        <Route path="/rastreamento" element={<Rastreamento />} />

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/clientes" element={<Clientes />} />
        <Route path="/admin/encomendas" element={<Encomendas />} />
        <Route path="/admin/remessas" element={<Remessas />} />
        <Route path="/admin/remessas/:id" element={<RemessaDetalhes />} />
        <Route path="/admin/configuracoes" element={<Configuracoes />} />

      </Routes>
    </Router>
  );
}

export default App;
