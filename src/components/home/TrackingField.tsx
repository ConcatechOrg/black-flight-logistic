/* eslint-disable @typescript-eslint/no-explicit-any */
import { FiSearch } from "react-icons/fi";
import { RefObject } from "react";
import { useLanguage } from "../../context/useLanguage";
import { TrackingResponse } from "../../services/trackingService";
import { adicionarDiasEntrega, pacoteStatusToString } from "../../utils/utils";

export interface TrackingFieldProps {
  codigoDigitado: string;
  setCodigoDigitado: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resultado: boolean;
  limpar: () => void;
  resultadoRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  error: string | null;
  info: TrackingResponse | null;
}

const TrackingField = ({
  codigoDigitado,
  setCodigoDigitado,
  handleSubmit,
  resultado,
  limpar,
  resultadoRef,
  loading,
  error,
  info,
}: TrackingFieldProps) => {
  const { translations: t } = useLanguage();
  return (
    <div
      id="rastreamento"
      className={`w-full transition-all duration-500 ${
        resultado
          ? "relative translate-y-0 mt-8"
          : "absolute top-full -translate-y-1/3"
      }`}
    >
      <div className="relative w-full max-w-3xl mx-auto">
        {/* Faixa laranja */}
        <div className="absolute -top-2 left-0 w-full h-4 bg-orange rounded-t-xl z-0" />

        <div className="relative bg-white rounded-xl shadow-md p-6 md:p-8 text-center z-10">
          <h2 className="text-xl font-bold text-black mb-4">
            {t.tracking_title}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-stretch gap-4 mb-6"
          >
            <div className="flex items-center flex-1 border border-gray-300 rounded-md px-4 py-2 bg-gray-50">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                name="codigo"
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value)}
                placeholder={t.tracking_placeholder}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t.tracking_button
                )}
              </button>
              {resultado && (
                <button
                  type="button"
                  onClick={limpar}
                  className="bg-orange/80 text-white font-semibold px-4 py-2 rounded-md hover:bg-orange transition"
                >
                  {t.tracking_clear_button}
                </button>
              )}
            </div>
          </form>

          {/* Erro */}
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {/* Resultado */}
          {resultado && info && (
            <div ref={resultadoRef} className="text-left space-y-4 mt-6">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold">{t.tracking_code_label}</span>{" "}
                  <span className="text-orange font-bold">
                    {info.tracking_code}
                  </span>
                  <br />
                  <span className="text-gray-600">
                    {t.tracking_estimated_delivery}{" "}
                    {adicionarDiasEntrega(info.inserted_at,info.is_express)}
                  </span>
                </div>
                <span className="text-blue-600 bg-blue-100 text-xs px-2 py-1 rounded-full">
                  {info.status.replace("_", " ")}
                </span>
              </div>

              {/* Linha do tempo */}
              <div className="space-y-4">
                {info.history_status.map((h: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-14 text-xs text-right">
                      <p>{h.data}</p>
                      <p>{h.hora}</p>
                    </div>

                    <div className="flex flex-col items-center mt-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          i === 0 ? "bg-blue-600" : "bg-orange"
                        }`}
                      />
                      {i < info.history_status.length - 1 && (
                        <div className="w-[2px] h-6 bg-orange" />
                      )}
                    </div>

                    <div className="text-sm">
                      <p className="font-bold">
                        {pacoteStatusToString(h.status, t)}{" "}
                      </p>
                      <p className="text-gray-600">
                        {h.status === "em_preparacao" ||
                        h.status === "em_transito"
                          ? `${info.from_account.adresses[0].city} - ${info.from_account.adresses[0].state} - ${info.from_account.adresses[0].country}`
                          : `${info.to_account.adresses[0].city} - ${info.to_account.adresses[0].state} - ${info.to_account.adresses[0].country}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingField;
