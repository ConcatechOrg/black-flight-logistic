import { Fragment, useMemo, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Cliente } from "../../services/clienteService";

type Props = {
  label: string;
  clientes: Cliente[];
  selectedId: number | undefined;
  onSelect: (clienteId: number) => void;
  onCadastrarNovo: () => void;
};

const ClienteSelect = ({ label, clientes, selectedId, onSelect, onCadastrarNovo }: Props) => {
  const [query, setQuery] = useState("");

  const filteredClientes = useMemo(() => {
    if (!query) return clientes;
    const q = query.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefone.toLowerCase().includes(q)
    );
  }, [query, clientes]);


  return (
    <div>
      <Combobox value={selectedId} onChange={onSelect}>
        <Combobox.Label className="block mb-1 text-sm font-medium">{label}</Combobox.Label>
        <div className="relative">
          <Combobox.Input
            className="w-full border border-gray-300 rounded p-2"
            displayValue={(id: number | "") =>
              clientes.find((c) => c.id === id)?.nome || ""
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar por nome, e-mail ou telefone`}
          />
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-md max-h-60 overflow-auto">
              {filteredClientes.length === 0 ? (
                <div
                  onClick={onCadastrarNovo}
                  className="cursor-pointer px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                >
                  Cadastrar novo cliente
                </div>
              ) : (
                filteredClientes.map((cliente) => (
                  <Combobox.Option
                    key={cliente.id}
                    value={cliente.id}
                    className={({ active }) =>
                      `px-4 py-2 text-sm cursor-pointer ${
                        active ? "bg-gray-200" : ""
                      }`
                    }
                  >
                    <div className="font-semibold">{cliente.nome}</div>
                    <div className="text-xs text-gray-500">
                      {cliente.email} | {cliente.telefone}
                    </div>
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};

export default ClienteSelect;
