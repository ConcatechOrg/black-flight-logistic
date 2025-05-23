import { useEffect, useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import QrScanner from "qr-scanner";
import {
  EncomendaPagamentoStatus,
  Order,
  orderService,
} from "../../services/encomendaService";
import ConfirmacaoCheckinModal from "../../components/admin/ConfirmacaoCheckinModal";
import { isEncomendaStatus, isPacoteStatus } from "../../utils/utils";
import { useLanguage } from "../../context/useLanguage";
import { remessaService } from "../../services/remessaService";
import { toast } from "react-toastify";
import PagamentoPendenteModal from "../../components/admin/PagamentoPendenteModal";
import { configService } from "../../services/configService";
import ConfirmarCodigoModal from "./ConfirmarCodigoModal";

function Leitor() {
  const { translations: t } = useLanguage();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [codigoLido, setCodigoLido] = useState<string>("");
  const [cameraAtiva, setCameraAtiva] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTipo, setModalTipo] = useState<
    "encomenda" | "pacote" | "remessa" | null
  >(null);
  const [modalCodigo, setModalCodigo] = useState<string>("");
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [valorTotal, setValorTotal] = useState(0);
  const [valorPago, setValorPago] = useState(0);
  const [encomendaAtual, setEncomendaAtual] = useState<Order | null>(null);
  const [dollarValue, setDollarValue] = useState(0);
  const [cafValue, setCafValue] = useState(0);
  const [cambioTax, setCambioTax] = useState(0);
  const [securityCodeModalAberto, setSecurityCodeModalAberto] = useState(false);

  useEffect(() => {
    if (!videoRef || !cameraAtiva) return;

    const scanner = new QrScanner(
      videoRef,
      (result) => {
        const codigo = result.data.trim();
        setCodigoLido(codigo);
        setCameraAtiva(false);
        processarCodigo(codigo);
      },
      {
        highlightScanRegion: true,
        preferredCamera: "environment",
      }
    );

    scanner.start();

    return () => {
      scanner.stop();
    };
  }, [videoRef, cameraAtiva]);
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      const config = await configService.buscar();
      setDollarValue(Number(config.dollar_value));
      setCambioTax(Number(config.cambio_tax));
      setCafValue(Number(config.caf_value));
    };
    carregarConfiguracoes();
  }, []);

  const processarCodigo = async (codigo: string) => {
    if (codigo.startsWith("E-")) {
      setModalTipo("encomenda");
      setModalCodigo(codigo);
      setModalAberto(true);
    } else if (codigo.startsWith("P-")) {
      setModalTipo("pacote");
      setModalCodigo(codigo);
      setModalAberto(true);
    } else if (codigo.startsWith("R-")) {
      setModalTipo("remessa");
      setModalCodigo(codigo);
      setModalAberto(true);
    } else {
      toast.error(t.alerta_codigo_invalido);
      setCameraAtiva(true);
    }
  };
  const confirmarSecurityCode = async (codigo: string) => {
    if (!encomendaAtual) return;
    if (!codigo.trim()) {
      toast.warn(t.codigo_vazio); // Adicione a chave de tradução se quiser
      return;
    }
    if (codigo !== encomendaAtual.security_code) {
      toast.error(t.codigo_incorreto);
      return;
    }

    // Atualiza status e segue fluxo
    encomendaAtual.status = "entregue";
    await salvarEncomendaAtualizada(encomendaAtual);
    setSecurityCodeModalAberto(false);
    limparEstado();
  };

  const atualizarStatus = async (status: string) => {
    if (modalTipo === "encomenda" && isEncomendaStatus(status)) {
      const id = modalCodigo.replace("E-", "");
      const encomenda = await orderService.buscarPorId(id);
      if (status === "entregue") {
        setEncomendaAtual(encomenda); // salva temporariamente
        setSecurityCodeModalAberto(true); // abre modal
        return; // interrompe fluxo
      }
      encomenda.status = status;

      // Atualiza pacotes com base no status da encomenda
      switch (status) {
        case "em_preparacao":
        case "em_transito":
        case "aguardando_retirada":
          // Todos os pacotes herdam o novo status
          encomenda.packages = encomenda.packages.map((p) => ({
            ...p,
            status,
          }));
          break;

        case "cancelada":
          // Só pacotes não entregues são cancelados
          encomenda.packages = encomenda.packages.map((p) =>
            p.status !== "entregue" ? { ...p, status: "cancelada" } : p
          );
          break;
      }

      if (["pendente", "parcial"].includes(encomenda.payment_status || "")) {
        setEncomendaAtual(encomenda);
        setValorTotal(Number(encomenda.total_value || "0"));
        setValorPago(Number(encomenda.paid_now || "0"));
        setModalPagamentoAberto(true);
        return; // interrompe aqui para aguardar confirmação no modal
      }
    }

    if (modalTipo === "pacote" && isPacoteStatus(status)) {
      const pacoteId = modalCodigo.replace("P-", "");
      const todas = await orderService.listar();
      const encomenda = todas.find((e) =>
        e.packages.some((p) => p.id === pacoteId)
      );
      if (!encomenda) return;

      encomenda.packages = encomenda.packages.map((p) =>
        p.id === pacoteId ? { ...p, status } : p
      );

      // await orderService.atualizar(encomenda); // Ative se quiser persistir
    }
    if (modalTipo === "remessa") {
      const id = modalCodigo.replace("R-", "");
      try {
        await remessaService.atualizarStatus(id, modalCodigo);
        toast.success(t.status_remessa_atualizado);
      } catch (err) {
        console.error("Erro ao atualizar status da remessa:", err);
        toast.error("Erro ao atualizar status da remessa.");
      } finally {
        limparEstado();
      }
      return;
    }

    limparEstado();
  };

  const confirmarPagamentoPendente = async (valorRestante: number) => {
    if (!encomendaAtual) return;

    encomendaAtual.paid_now = (valorPago + valorRestante).toString();
    encomendaAtual.payment_status = "pago";

    await salvarEncomendaAtualizada(encomendaAtual);
    setModalPagamentoAberto(false);
    limparEstado();
  };
  const salvarEncomendaAtualizada = async (encomenda: Order) => {
    try {
      await orderService.atualizar(encomenda.id, {
        from_account_id: encomenda.from_account.id,
        to_account_id: encomenda.to_account.id,
        status: encomenda.status || "",
        is_express: encomenda.is_express,
        scheduled_date: encomenda.scheduled_date || undefined,
        city: encomenda.city,
        state: encomenda.state,
        country: encomenda.country,
        number: encomenda.number,
        additional_info: encomenda.additional_info,
        cep: encomenda.cep,
        paid_now: encomenda.paid_now || "0",
        descount: encomenda.descount || "0",
        payment_type: encomenda.payment_type || "a_vista",
        payment_status: (encomenda.payment_status ||
          "pendente") as EncomendaPagamentoStatus,
        total_value: encomenda.total_value || "0",
        added_packages: [],
        removed_packages: [],
      });
      toast.success(t.status_encomenda_atualizado);
    } catch (error) {
      console.error("Erro ao atualizar encomenda:", error);
      toast.error("Erro ao atualizar encomenda");
    }
  };

  const limparEstado = () => {
    setModalAberto(false);
    setModalTipo(null);
    setModalCodigo("");
    setCodigoLido("");
    setEncomendaAtual(null);
    setCameraAtiva(true);
  };

  return (
    <div className="flex h-screen">
      <div className="md:top-0 md:left-0 md:h-screen md:w-64 bg-black text-white z-10">
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
      <main className="flex-1 pt-16 p-6 bg-[#fcf7f1] overflow-y-auto">
        <h1 className="text-2xl font-bold font-primary mb-6">
          {t.leitor_titulo}
        </h1>

        <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-orange shadow space-y-4">
          {cameraAtiva ? (
            <video
              ref={setVideoRef}
              className="w-full rounded-md shadow border border-gray-300"
            />
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-green-600 font-secondary text-sm">
                <span className="font-bold">{t.codigo_lido}:</span>{" "}
                <span className="break-all">{codigoLido}</span>
              </p>
              <button
                onClick={() => {
                  setCodigoLido("");
                  setCameraAtiva(true);
                }}
                className="px-4 py-2 bg-orange text-white rounded-md hover:opacity-90 text-sm font-secondary"
              >
                {t.ler_outro_codigo}
              </button>
            </div>
          )}
        </div>
      </main>

      <ConfirmacaoCheckinModal
        aberto={modalAberto}
        tipo={modalTipo || "encomenda"}
        codigo={modalCodigo}
        onFechar={() => {
          setModalAberto(false);
          setCameraAtiva(true);
        }}
        onConfirmar={atualizarStatus}
      />
      <PagamentoPendenteModal
        aberto={modalPagamentoAberto}
        valorTotal={valorTotal}
        valorPago={valorPago}
        dollarValue={dollarValue}
        cambioTax={cambioTax}
        cafValue={cafValue}
        onFechar={() => {
          setModalPagamentoAberto(false);
          setCameraAtiva(true);
        }}
        onConfirmar={confirmarPagamentoPendente}
      />
      <ConfirmarCodigoModal
        aberto={securityCodeModalAberto}
        onFechar={() => {
          setSecurityCodeModalAberto(false);
        }}
        onConfirmar={confirmarSecurityCode}
      />
    </div>
  );
}

export default Leitor;
