import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate,useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "../../components/admin/Sidebar";
import { encomendaService, Encomenda } from "../../services/encomendaService";
import { clienteService, Cliente } from "../../services/clienteService";
import QRCodeComLogo from "../../components/shared/QRCodeComLogo";


function EtiquetaEncomenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [remetente, setRemetente] = useState<Cliente | null>(null);
  const [destinatario, setDestinatario] = useState<Cliente | null>(null);
  const dataGeracao = new Date().toLocaleString();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
const pacotesSelecionados: number[] = location.state?.pacotesSelecionados ?? [];
const pacotesParaImprimir = encomenda?.pacotes.filter(p =>
  pacotesSelecionados.includes(p.id)
);

  useEffect(() => {
    if (!id) return;
    encomendaService.buscarPorId(Number(id)).then((dados) => {
      setEncomenda(dados);
      clienteService.buscarPorId(dados.remetenteId).then(setRemetente);
      clienteService.buscarPorId(dados.destinatarioId).then(setDestinatario);
    });
  }, [id]);

  const exportarPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`etiquetas-encomenda-${id}.pdf`);
  };

  if (!encomenda || !remetente || !destinatario) return <p>Carregando...</p>;

  return (
    <div className="flex h-screen">
      {/* Botão para mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-black text-white px-4 py-2 rounded"
        onClick={() => setSidebarAberta(true)}
      >
        ☰ Menu
      </button>

      <Sidebar mobileAberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} />

      <main className="flex-1 overflow-y-auto p-6 space-y-6 print:p-4 print:w-full print:overflow-visible">
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold">Etiquetas da Encomenda</h1>
          <div className="flex gap-2">
            <button
              onClick={exportarPDF}
              className="px-4 py-2 bg-blue-600 text-black rounded hover:opacity-90"
            >
              Exportar PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-black text-white rounded hover:opacity-80"
            >
              Imprimir
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Voltar
            </button>
          </div>
        </div>

        <div ref={pdfRef} className="space-y-6">
          {/* Info do remetente e destinatário */}
          <section className="border p-4 rounded bg-white shadow">
            <h2 className="font-semibold mb-2">Remetente</h2>
            <p>{remetente.nome}</p>
            <p className="text-sm text-gray-600">{remetente.endereco}</p>

            <h2 className="font-semibold mt-4 mb-2">Destinatário</h2>
            <p>{destinatario.nome}</p>
            <p className="text-sm text-gray-600">{destinatario.endereco}</p>

            <p className="text-sm text-gray-500 mt-2">
              Data de geração: {dataGeracao}
            </p>
          </section>

          {/* QR da encomenda */}
          <section className="border p-4 rounded bg-white shadow">
            <h2 className="text-lg font-semibold mb-2">Código da Encomenda</h2>
            <div className="flex flex-col items-start gap-2">
              <QRCodeComLogo value={`E-${encomenda.id}`} size={128} />
              <p className="text-sm text-gray-600">ID: E-{encomenda.id}</p>
            </div>
          </section>

          {/* QR dos pacotes */}
          {(pacotesParaImprimir ?? []).length > 0 && (
            <section className="border p-4 rounded bg-white shadow print:break-before-page">
              <h2 className="text-lg font-semibold mb-4">Códigos dos Pacotes</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {pacotesParaImprimir?.map((pacote) => (
                  <div
                    key={pacote.id}
                    className="border p-4 rounded bg-gray-50  flex flex-col items-center"
                  >
                    <QRCodeComLogo value={`P-${pacote.id}`} size={128} />
                    <p className="mt-2 text-sm">
                      <strong>{pacote.descricao}</strong> - {pacote.peso}kg
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default EtiquetaEncomenda;
