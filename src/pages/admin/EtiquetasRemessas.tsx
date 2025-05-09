import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "../../components/admin/Sidebar";
import { remessaService, Shipment } from "../../services/remessaService";
import { useLanguage } from "../../context/useLanguage";
import QRCodeComLogo from "../../components/shared/QRCodeComLogo";

function EtiquetaRemessa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { translations: t } = useLanguage();

  const [remessa, setRemessa] = useState<Shipment | null>(null);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    remessaService.buscarPorId(id).then(setRemessa);
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
    pdf.save(`etiquetas-remessa-${id}.pdf`);
  };

  if (!remessa) {
    return <p className="p-6">{t.carregando || "Carregando..."}</p>;
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="md:fixed md:top-0 md:left-0 md:h-screen md:w-64 bg-black text-white border-r z-10">
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-black text-white px-4 py-2 rounded"
          onClick={() => setSidebarAberta(true)}
        >
          ☰ {t.menu}
        </button>
        <Sidebar
          mobileAberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
        />
      </div>

      <main className="md:ml-64 h-full overflow-y-auto bg-[#fcf8f5] p-6 space-y-6 pt-16 md:pt-6 print:p-4 print:overflow-visible">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <h1 className="text-2xl font-bold font-primary text-black">
            {t.etiqueta_titulo || "Etiqueta de Remessa"}
          </h1>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <button
              onClick={exportarPDF}
              className="px-4 py-2 bg-orange text-white rounded hover:opacity-90 text-sm font-secondary"
            >
              {t.etiqueta_exportar_pdf}
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-black text-white rounded hover:opacity-80 text-sm font-secondary"
            >
              {t.etiqueta_imprimir}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm font-secondary"
            >
              {t.voltar}
            </button>
          </div>
        </div>
        <section className="border p-4 rounded bg-white shadow">
          <h2 className="text-xl font-bold mb-2">
            {t.etiqueta_titulo || "Etiqueta de Remessa"}
          </h2>
          <p className="text-sm text-gray-700">
            <strong>{t.etiqueta_data_geracao || "Data"}:</strong>{" "}
            {remessa.inserted_at.split("T")[0]}
          </p>
          <p className="text-sm text-gray-700">
            <strong>{"País de destino"}:</strong> {remessa.country}
          </p>
          <p className="text-sm text-gray-700">
            <strong>{"ID da Remessa"}:</strong> R-
            {remessa.id}
          </p>
        </section>
        <div ref={pdfRef} className="space-y-6">
          <section className="border p-6 rounded bg-white shadow flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold mb-4">
              {"Código da Remessa"}
            </h2>
            <QRCodeComLogo value={`R-${remessa.id}`} size={128} />
            <p className="text-sm text-gray-600 mt-2">ID: R-{remessa.id}</p>
            <p className="text-sm text-gray-600 mt-1">
              {t.etiqueta_data_geracao || "Data"}:{" "}
              {remessa.inserted_at.split("T")[0]}
            </p>
            <p className="text-sm text-gray-600">
              {"País de destino"}: {remessa.country}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default EtiquetaRemessa;
