type ConfiguracaoSistema = {
    precoPorQuilo: number;
    taxaPorSeguro: number;
  };
  
  let config: ConfiguracaoSistema | null = null;
  
  export const configService = {
    carregar: async (): Promise<ConfiguracaoSistema> => {
      if (!config) {
        const response = await fetch("/mocks/config.json");
        config = await response.json();
      }
      return config as ConfiguracaoSistema;
    },
  
    atualizar: async (nova: ConfiguracaoSistema): Promise<void> => {
      config = nova;
    }
  };
  