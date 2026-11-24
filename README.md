# Organizador - Clone Interativo do Monday.com

Aplicação completa inspirada no **Monday.com**, reproduzindo a interface, organização por grupos, colunas customizáveis, modos de visualização (**Tabela / Quadro**, **Kanban** e **Calendário**) e edição em tempo real de todas as propriedades.

---

## 🚀 Como Executar

Basta abrir o arquivo `index.html` em qualquer navegador moderno (Edge, Brave, Chrome, Opera, etc.):

- **Opção 1**: Dê um **duplo clique** em `index.html` na pasta `D:\Projetos\Organizador`.
- **Opção 2**: Arraste o arquivo `index.html` para a janela do seu navegador preferido.

> **Sem dependências**: Não requer Node.js, compilação ou instalação de pacotes.

---

## 🎯 Funcionalidades Implementadas

### 1. Visualizações Alternáveis (Views)
- **Quadro Principal (Tabela)**:
  - Grupos recolhíveis/expansíveis (*Tarefas pendentes*, *Concluído*, etc.).
  - Cores temáticas por grupo com seletor de paleta.
  - Linhas com tarefas, seleção por checkbox e contador dinâmico.
  - **Rodapé de Resumo com**:
    - Barra segmentada com proporções de Status (Verde, Laranja, Vermelho).
    - Intervalo consolidado de Prazo (`nov 22 - 24`).
    - Barra segmentada de Prioridades (Baixa, Média, Alta).
    - Soma total de orçamento (`$1.600 Total`).
    - Contagem de arquivos anexados.
    - Intervalo total do cronograma (`nov 22 - 27`).
- **Quadro Kanban**:
  - Colunas automáticas organizadas por Status (*Não iniciado*, *Em andamento*, *Parado*, *Feito*).
  - **Arrastar e Soltar (Drag & Drop)** nativo entre colunas que atualiza o status instantaneamente.
  - Cards detalhados com grupo de origem, responsável, badge de prioridade e orçamento.
- **Calendário Mensal**:
  - Visualização completa do mês com navegação (< anterior / hoje / próximo >).
  - Tarefas posicionadas diretamente nos dias correspondentes à sua data de prazo.
  - Pílulas coloridas de acordo com o status.
  - Clique em qualquer dia para agendar uma nova tarefa rapidamente.

### 2. Edição em Tempo Real
- **Nomes e Grupos**: Clique no título do quadro, no nome de um grupo ou no nome de uma tarefa para renomear na hora.
- **Status**: Seletor visual com cores autênticas do Monday (*Feito*, *Em andamento*, *Parado*, *Em revisão*, *Não iniciado*).
- **Prioridades**: Badges com as cores exatas (*Crítica*, *Alta*, *Média*, *Baixa*, *-*).
- **Responsáveis**: Atribuição com avatares e iniciais coloridas (Allan Nunes, etc.) e opção para convidar novos membros.
- **Prazos**: Seletor de data integrado.
- **Orçamento**: Edição direta de valores monetários.
- **Cronograma**: Definição de intervalos (Data inicial e Data final).
- **Arquivos**: Gerenciador de anexos com simulação de upload e remoção.

### 3. Gaveta Lateral de Detalhes (Drawer)
- Clique no ícone de balão de mensagem de qualquer tarefa para abrir a gaveta lateral.
- Permite editar notas descritivas com salvamento automático.
- **Checklist de Subtarefas**: Adicione subtarefas, marque como concluídas e acompanhe a barra de progresso.
- Visualização consolidada de todas as propriedades e anexos.

### 4. Busca, Filtros e Persistência
- **Busca Global e Local**: Filtre tarefas em tempo real por nome ou status.
- **Filtro Rápido por Status**: Visualize apenas itens *Em andamento*, *Feitos*, *Parados* ou *Todos*.
- **Persistência Local (LocalStorage)**: Todas as alterações (novas tarefas, novos grupos, alterações de status, responsáveis ou prazos) são salvas automaticamente no navegador e não se perdem ao recarregar.

---

## 📁 Estrutura de Arquivos

```
D:\Projetos\Organizador\
│
├── index.html     # Estrutura HTML5 com barra superior, lateral, toolbar e modais
├── styles.css     # Estilização autêntica com tokens de cores do Monday.com
├── app.js         # Lógica reativa, drag & drop, Kanban, Calendário e LocalStorage
└── README.md      # Guia de uso e documentação
```

