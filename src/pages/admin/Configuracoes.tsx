import { useEffect, useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import { configService } from "../../services/configService";

const Configuracoes = () => {
  const [precoPorQuilo, setPrecoPorQuilo] = useState<number>(0);
  const [precoSeguro, setPrecoSeguro] = useState<number>(0);
  const [carregado, setCarregado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sidebarAberta, setSidebarAberta] = useState(false);

  useEffect(() => {
    configService.carregar().then((config) => {
      setPrecoPorQuilo(config.precoPorQuilo);
      setPrecoSeguro(config.taxaPorSeguro);
      setCarregado(true);
    });
  }, []);

  const salvar = async () => {
    await configService.atualizar({ precoPorQuilo, taxaPorSeguro: precoSeguro });
    setMensagem("Valor atualizado com sucesso!");
    setTimeout(() => setMensagem(""), 3000);
  };

  if (!carregado) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="flex">
     <button
        className="md:hidden fixed top-4 left-4 z-50 bg-black text-white px-4 py-2 rounded"
        onClick={() => setSidebarAberta(true)}
      >
        ☰ Menu
      </button>

      <Sidebar mobileAberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} />

      <main className="flex-1 p-6 space-y-6 max-w-xl">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Preço por Quilo (R$)</label>
          <input
            type="number"
            step="0.01"
            value={precoPorQuilo}
            onChange={(e) => setPrecoPorQuilo(parseFloat(e.target.value))}
            className="p-2 border rounded w-full"
          />
          <label className="block text-sm font-medium">% de valor do Seguro</label>
          <input
            type="number"
            step="0.01"
            value={precoSeguro}
            onChange={(e) => setPrecoSeguro(parseFloat(e.target.value))}
            className="p-2 border rounded w-full"
          />
        </div>

        <button
          onClick={salvar}
          className="px-4 py-2 bg-black text-white rounded hover:opacity-80"
        >
          Salvar Configuração
        </button>

        {mensagem && <p className="text-green-600 mt-2">{mensagem}</p>}
      </main>
    </div>
  );
};

export default Configuracoes;
