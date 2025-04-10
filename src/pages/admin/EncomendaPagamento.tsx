import { useEffect, useState } from "react";
import { useParams, useNavigate,  } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import { clienteService, Cliente } from "../../services/clienteService";
import {
  encomendaService,
  Encomenda,
  FormaPagamento,
} from "../../services/encomendaService";

function EncomendaPagamento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [remetente, setRemetente] = useState<Cliente | null>(null);
  const [destinatario, setDestinatario] = useState<Cliente | null>(null);
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("à vista");
  const [desconto, setDesconto] = useState("");
  const [mostrarMaisOpcoes, setMostrarMaisOpcoes] = useState(false);
  const [valorPagoInput, setValorPagoInput] = useState("");
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [pacotesSelecionados, setPacotesSelecionados] = useState<number[]>([]);
  const togglePacote = (id: number) => {
    setPacotesSelecionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const toggleTodos = () => {
    if (!encomenda) return;

    if (pacotesSelecionados.length === encomenda.pacotes.length) {
      setPacotesSelecionados([]);
    } else {
      setPacotesSelecionados(encomenda.pacotes.map((p) => p.id));
    }
  };

  const estaSelecionado = (id: number) => pacotesSelecionados.includes(id);

  useEffect(() => {
    if (!id) return;

    const carregar = async () => {
      const encomendaEncontrada = await encomendaService.buscarPorId(
        Number(id)
      );
      setEncomenda(encomendaEncontrada);
      setFormaPagamento(encomendaEncontrada.formaPagamento || "à vista");
      setPacotesSelecionados(encomendaEncontrada.pacotes.map((p) => p.id));
      const remetente = await clienteService.buscarPorId(
        encomendaEncontrada.remetenteId
      );
      const destinatario = await clienteService.buscarPorId(
        encomendaEncontrada.destinatarioId
      );

      setRemetente(remetente);
      setDestinatario(destinatario);
    };

    carregar();
  }, [id]);

  if (!encomenda || !remetente || !destinatario) return <p>Carregando...</p>;

  const valorBase = encomenda.valorTotal || 0;
  const valorDesconto = desconto ? parseFloat(desconto) : 0;
  const valorFinal = Math.max(0, valorBase - valorDesconto);
  const valorPago =
    formaPagamento === "à vista" ? valorFinal : parseFloat(valorPagoInput) || 0;

  const statusPagamento =
    valorPago >= valorFinal ? "pago" : valorPago > 0 ? "parcial" : "pendente";

  const salvarPagamento = async () => {
    await encomendaService.atualizar({
      ...encomenda,
      formaPagamento,
      valorPago,
      statusPagamento,
      valorTotal: valorFinal,
    });

    navigate("/admin/encomendas");
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* Sidebar fixa */}
      <div className="md:fixed md:top-0 md:left-0 md:h-screen md:w-64 md:bg-white border-r z-10">
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-black text-white px-4 py-2 rounded"
          onClick={() => setSidebarAberta(true)}
        >
          ☰ Menu
        </button>

        <Sidebar
          mobileAberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
        />
      </div>

      {/* Conteúdo principal com scroll */}
      <main className="md:ml-64 h-full overflow-y-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Conferência de Pagamento</h1>

        {/* Remetente */}
        <section className="space-y-1">
          <h2 className="text-lg font-semibold">Remetente</h2>
          <p>
            {remetente.nome} - {remetente.email} - {remetente.telefone}
          </p>
          <p className="text-sm text-gray-600">{remetente.endereco}</p>
        </section>

        {/* Destinatário */}
        <section className="space-y-1">
          <h2 className="text-lg font-semibold">Destinatário</h2>
          <p>
            {destinatario.nome} - {destinatario.email} - {destinatario.telefone}
          </p>
          <p className="text-sm text-gray-600">{destinatario.endereco}</p>
        </section>

        {/* Pacotes */}
        <section className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Pacotes</h2>
            <button
              onClick={toggleTodos}
              className="text-sm text-blue-600 hover:underline"
            >
              {pacotesSelecionados.length === encomenda.pacotes.length
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </button>
          </div>
          <ul className="space-y-2">
            {encomenda.pacotes.map((p) => (
              <li key={p.id} className="p-2 border rounded bg-white">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={estaSelecionado(p.id)}
                    onChange={() => togglePacote(p.id)}
                    className="mt-1"
                  />
                  <div>
                    📦 <strong>{p.descricao}</strong> - {p.peso}kg
                    <br />
                    💰 R$ {p.valorCalculado?.toFixed(2)}{" "}
                    {p.valorDeclarado && (
                      <span className="ml-2 text-sm">
                        🛡️ Seguro: R$ {p.valorDeclarado.toFixed(2)}
                      </span>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Forma de pagamento */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Forma de Pagamento</h2>
          <select
            value={formaPagamento}
            onChange={(e) =>
              setFormaPagamento(e.target.value as FormaPagamento)
            }
            className="p-2 border rounded"
          >
            <option value="à vista">À vista</option>
            <option value="parcelado">Parcelado</option>
            <option value="na retirada">Na retirada</option>
          </select>
        </section>

        {/* Valor pago agora */}
        {formaPagamento === "parcelado" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Valor pago agora (R$)
            </label>
            <input
              type="number"
              className="p-2 border rounded"
              value={valorPagoInput}
              onChange={(e) => setValorPagoInput(e.target.value)}
            />
          </div>
        )}

        {/* Desconto */}
        <button
          onClick={() => setMostrarMaisOpcoes(!mostrarMaisOpcoes)}
          className="text-blue-600 hover:underline"
        >
          {mostrarMaisOpcoes ? "Ocultar opções" : "Mais opções"}
        </button>

        {mostrarMaisOpcoes && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Desconto (R$)
            </label>
            <input
              type="number"
              className="p-2 border rounded"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
            />
          </div>
        )}

        {/* Totais */}
        <p className="text-lg font-semibold mt-4">
          Valor final:{" "}
          <span className="text-green-700">R$ {valorFinal.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-700">
          <strong>Status do pagamento:</strong> {statusPagamento}
        </p>

        {/* Ações */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={salvarPagamento}
            className="px-4 py-2 bg-black text-white rounded hover:opacity-80"
          >
            Confirmar e Salvar
          </button>
          <button
            onClick={() => navigate(`/admin/encomendas/${encomenda.id}/etiquetas`, {
              state: { pacotesSelecionados },
            })}
            className="px-4 py-2 bg-blue-600 text-black rounded hover:bg-blue-700"
          >
            Gerar Etiquetas
          </button>
          <button
            onClick={() => navigate("/admin/encomendas")}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Voltar para Encomendas
          </button>
        </div>
      </main>
    </div>
  );
}

export default EncomendaPagamento;
