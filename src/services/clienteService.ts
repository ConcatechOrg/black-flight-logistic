export type Cliente = {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
};

// Dados mockados em memória
let clientes: Cliente[] = [];

export const clienteService = {
  listar: async (): Promise<Cliente[]> => {
    return Promise.resolve(clientes);
  },

  adicionar: async (cliente: Omit<Cliente, "id">): Promise<Cliente> => {
    const novoCliente = { ...cliente, id: Date.now() };
    clientes.push(novoCliente);
    return Promise.resolve(novoCliente);
  },

  remover: async (id: number): Promise<void> => {
    clientes = clientes.filter((c) => c.id !== id);
    return Promise.resolve();
  },
};
