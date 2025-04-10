import { useEffect, useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import { clienteService, Cliente } from "../../services/clienteService";
import { remessaService } from "../../services/remessaService";
import { configService } from "../../services/configService";
import { useNavigate } from "react-router-dom";

import {
  encomendaService,
  Pacote,
  PacoteStatus,
} from "../../services/encomendaService";
import ClienteForm, {
  ClienteFormData,
} from "../../components/admin/ClienteForm";
import ClienteSelect from "../../components/admin/ClienteSelect";

function converterEnderecoParaCampos(endereco: string): ClienteFormData {
  const match = endereco.match(/^(.*), (.*) - (.*), (.*) - (.*), (.*)$/);
  if (!match) {
    return {
      nome: "",
      telefone: "",
      email: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    };
  }

  return {
    nome: "",
    telefone: "",
    email: "",
    rua: match[1],
    numero: match[2],
    bairro: match[3],
    cidade: match[4],
    estado: match[5],
    cep: match[6],
  };
}
function NovaEncomenda() {
  const navigate = useNavigate();
  const [precoPorQuilo, setPrecoPorQuilo] = useState<number>(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const [remetenteId, setRemetenteId] = useState<number | undefined>(undefined);
  const [destinatarioId, setDestinatarioId] = useState<number | undefined>(
    undefined
  );
  const [editandoRemetente, setEditandoRemetente] = useState(false);
  const [editandoDestinatario, setEditandoDestinatario] = useState(false);
  const [showRemetenteForm, setShowRemetenteForm] = useState(false);
  const [showDestinatarioForm, setShowDestinatarioForm] = useState(false);
  const [valorDeclaradoPacote, setValorDeclaradoPacote] = useState("");
  const [taxaSeguro, setTaxaSeguro] = useState<number>(0);

  const [endereco, setEndereco] = useState({
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [descricaoPacote, setDescricaoPacote] = useState("");
  const [pesoPacote, setPesoPacote] = useState("");
  const [statusPacote, setStatusPacote] =
    useState<PacoteStatus>("em preparação");

  useEffect(() => {
    clienteService.listar().then(setClientes);

    configService.carregar().then((conf) => {
      setPrecoPorQuilo(conf.precoPorQuilo);
      setTaxaSeguro(conf.taxaPorSeguro);
    });
  }, []);

  const adicionarPacote = () => {
    if (!descricaoPacote || !pesoPacote) return;

    const peso = parseFloat(pesoPacote);
    const declarado = valorDeclaradoPacote
      ? parseFloat(valorDeclaradoPacote)
      : 0;
    const valorCalculado = peso * precoPorQuilo;
    const valorSeguro = declarado * (taxaSeguro / 100);
    const valorTotal = valorCalculado + valorSeguro;

    const novo: Pacote = {
      id: Date.now(),
      descricao: descricaoPacote,
      peso,
      status: statusPacote,
      valorCalculado,
      valorDeclarado: declarado,
      valorTotal,
    };

    setPacotes([...pacotes, novo]);
    setDescricaoPacote("");
    setPesoPacote("");
    setStatusPacote("em preparação");
    setValorDeclaradoPacote("");
  };

  const salvarEncomenda = async () => {
    if (!remetenteId || !destinatarioId || pacotes.length === 0) return;

    const valorTotal = pacotes.reduce(
      (soma, p) => soma + (p.valorTotal || 0),
      0
    );

    const nova = await encomendaService.adicionar({
      remetenteId,
      destinatarioId,
      enderecoEntrega: endereco,
      status: "em preparação",
      pacotes,
      valorTotal,
    });

    // Agrupar em remessa automaticamente
    await remessaService.adicionarEncomendaOuCriar(nova, endereco.cidade); // ou endereço.estado ou país fixo se tiver

    setRemetenteId(undefined);
    setDestinatarioId(undefined);
    setEndereco({
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    });
    setPacotes([]);
  };

  const salvarNovoCliente = async (
    form: ClienteFormData,
    tipo: "remetente" | "destinatario"
  ) => {
    const endereco = `${form.rua}, ${form.numero} - ${form.bairro}, ${form.cidade} - ${form.estado}, ${form.cep}`;
    const novo = await clienteService.adicionar({
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      endereco,
    });
    await clienteService.listar().then(setClientes);
    if (tipo === "remetente") {
      setRemetenteId(novo.id);
      setShowRemetenteForm(false);
    } else {
      setDestinatarioId(novo.id);
      setShowDestinatarioForm(false);
    }
  };

  const remetenteSelecionado = clientes.find((c) => c.id === remetenteId);
  const destinatarioSelecionado = clientes.find((c) => c.id === destinatarioId);

  return (
    <div className="flex">
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

      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold">Encomendas</h1>

        {/* Remetente */}
        <div>
          <ClienteSelect
            label="Remetente"
            clientes={clientes}
            selectedId={remetenteId}
            onSelect={setRemetenteId}
            onCadastrarNovo={() => {
              setShowRemetenteForm(true);
              setShowDestinatarioForm(false);
            }}
          />
          {remetenteId && (
            <button
              onClick={() => {
                setEditandoRemetente(true);
                setShowRemetenteForm(false);
              }}
              className="text-sm text-blue-600 mt-1 hover:underline"
            >
              Ver endereço
            </button>
          )}
          {showRemetenteForm && (
            <ClienteForm
              onSubmit={(form) => salvarNovoCliente(form, "remetente")}
              onCancel={() => setShowRemetenteForm(false)}
            />
          )}
          {editandoRemetente && remetenteSelecionado && (
            <ClienteForm
              initialData={{
                ...converterEnderecoParaCampos(remetenteSelecionado.endereco),
                nome: remetenteSelecionado.nome,
                telefone: remetenteSelecionado.telefone,
                email: remetenteSelecionado.email,
              }}
              onSubmit={async (form) => {
                const endereco = `${form.rua}, ${form.numero} - ${form.bairro}, ${form.cidade} - ${form.estado}, ${form.cep}`;
                await clienteService.atualizar(remetenteId!, {
                  nome: form.nome,
                  telefone: form.telefone,
                  email: form.email,
                  endereco,
                });
                await clienteService.listar().then(setClientes);
                setEditandoRemetente(false);
              }}
              onCancel={() => setEditandoRemetente(false)}
            />
          )}
        </div>

        {/* Destinatário */}
        <div>
          <ClienteSelect
            label="Destinatário"
            clientes={clientes}
            selectedId={destinatarioId}
            onSelect={(id) => {
              setDestinatarioId(id);
              const selecionado = clientes.find((c) => c.id === id);
              if (selecionado) {
                setEndereco(converterEnderecoParaCampos(selecionado.endereco));
              }
            }}
            onCadastrarNovo={() => {
              setShowDestinatarioForm(true);
              setShowRemetenteForm(false);
            }}
          />
          {destinatarioId && (
            <button
              onClick={() => {
                setEditandoDestinatario(true);
                setShowDestinatarioForm(false);
              }}
              className="text-sm text-blue-600 mt-1 hover:underline"
            >
              Ver endereço
            </button>
          )}
          {showDestinatarioForm && (
            <ClienteForm
              onSubmit={(form) => salvarNovoCliente(form, "destinatario")}
              onCancel={() => setShowDestinatarioForm(false)}
            />
          )}
          {editandoDestinatario && destinatarioSelecionado && (
            <ClienteForm
              initialData={{
                ...converterEnderecoParaCampos(
                  destinatarioSelecionado.endereco
                ),
                nome: destinatarioSelecionado.nome,
                telefone: destinatarioSelecionado.telefone,
                email: destinatarioSelecionado.email,
              }}
              onSubmit={async (form) => {
                const enderecoStr = `${form.rua}, ${form.numero} - ${form.bairro}, ${form.cidade} - ${form.estado}, ${form.cep}`;
                await clienteService.atualizar(destinatarioId!, {
                  nome: form.nome,
                  telefone: form.telefone,
                  email: form.email,
                  endereco: enderecoStr,
                });
                await clienteService.listar().then(setClientes);
                setEndereco({
                  rua: form.rua,
                  numero: form.numero,
                  bairro: form.bairro,
                  cidade: form.cidade,
                  estado: form.estado,
                  cep: form.cep,
                });
                setEditandoDestinatario(false);
              }}
              onCancel={() => setEditandoDestinatario(false)}
            />
          )}
        </div>
        {/* Endereço de Entrega */}
        {destinatarioId && (
          <div className="grid md:grid-cols-2 gap-4">
            {["rua", "numero", "bairro", "cidade", "estado", "cep"].map(
              (campo) => (
                <input
                  key={campo}
                  name={campo}
                  placeholder={campo[0].toUpperCase() + campo.slice(1)}
                  value={endereco[campo as keyof typeof endereco]}
                  onChange={(e) =>
                    setEndereco({ ...endereco, [campo]: e.target.value })
                  }
                  className="p-2 border rounded"
                />
              )
            )}
          </div>
        )}

        {/* Pacotes */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Pacotes</h2>
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <input
              placeholder="Descrição"
              className="p-2 border rounded"
              value={descricaoPacote}
              onChange={(e) => setDescricaoPacote(e.target.value)}
            />
            <input
              placeholder="Peso (kg)"
              type="number"
              className="p-2 border rounded"
              value={pesoPacote}
              onChange={(e) => setPesoPacote(e.target.value)}
            />
            <input
              placeholder="Valor declarado (opcional)"
              type="number"
              className="p-2 border rounded"
              value={valorDeclaradoPacote}
              onChange={(e) => setValorDeclaradoPacote(e.target.value)}
            />
            <select
              className="p-2 border rounded"
              value={statusPacote}
              onChange={(e) => setStatusPacote(e.target.value as PacoteStatus)}
            >
              <option value="em preparação">Em preparação</option>
              <option value="em transito">Em trânsito</option>
              <option value="aguardando retirada">Aguardando retirada</option>
              <option value="entregue">Entregue</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <button
              onClick={adicionarPacote}
              className="px-4 py-2 bg-blue-600 text-black rounded hover:opacity-90"
            >
              Adicionar
            </button>
          </div>

          {pacotes.length > 0 && (
            <>
              <ul className="space-y-2 mt-2">
                {pacotes.map((p) => (
                  <li key={p.id} className="p-2 bg-white rounded border">
                    <p>
                      <strong>{p.descricao}</strong> - {p.peso}kg ({p.status})
                      <br />
                      💰 Custo: R$ {p.valorCalculado.toFixed(2)}
                      {p.valorDeclarado !== undefined &&
                        p.valorDeclarado > 0 && (
                          <span className="ml-2">
                            🛡️ Seguro: R${" "}
                            {(p.valorDeclarado * (taxaSeguro / 100)).toFixed(2)}
                          </span>
                        )}
                      <p className="text-sm text-gray-600">
                        Total do pacote: R$ {p.valorTotal?.toFixed(2)}
                      </p>
                    </p>
                  </li>
                ))}
              </ul>

              {/* Total estimado */}
              <p className="mt-2 text-sm font-semibold">
                Valor total estimado:{" "}
                <span className="text-green-700">
                  R${" "}
                  {pacotes
                    .reduce(
                      (soma, p) =>
                        soma + p.valorCalculado + (p.valorDeclarado || 0),
                      0
                    )
                    .toFixed(2)}
                </span>
              </p>
            </>
          )}
        </div>

        <button
          onClick={salvarEncomenda}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:opacity-80 mr-2"
        >
          Salvar Encomenda
        </button>

        {/* Botão de pagamento */}
        <button
          onClick={async () => {
            if (!remetenteId || !destinatarioId || pacotes.length === 0) return;

            const valorTotal = pacotes.reduce(
              (soma, p) =>
                soma + (p.valorCalculado || 0) + (p.valorDeclarado || 0),
              0
            );

            const nova = await encomendaService.adicionar({
              remetenteId,
              destinatarioId,
              enderecoEntrega: endereco,
              status: "em preparação",
              pacotes,
              valorTotal,
            });

            await remessaService.adicionarEncomendaOuCriar(
              nova,
              endereco.cidade
            );
            navigate(`/admin/encomendas/${nova.id}/pagamento`);
          }}
          className="mt-2 px-4 py-2 bg-green-600 text-black rounded hover:opacity-80"
        >
          Ir para pagamento
        </button>
      </main>
    </div>
  );
}

export default NovaEncomenda;
