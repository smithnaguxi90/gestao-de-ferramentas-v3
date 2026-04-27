# ⚙️ Gestão de Ferramentas COENG v3

Sistema completo de gestão de ferramentas com painel de controle responsivo, scanner de QR Code, geração de recibos PDF e auditoria completa.

## 🚀 Tecnologias

- **Vite** - Build tool ultra-rápido
- **Tailwind CSS v4** - Framework CSS utilitário
- **Firebase v11** - Auth + Firestore (real-time)
- **Chart.js** - Gráficos interativos
- **HTML5 QR Code** - Leitor de QR Code (USB + câmera)
- **SheetJS (XLSX)** - Importação/Exportação Excel
- **jsPDF** - Geração de recibos e etiquetas PDF
- **Vitest** - Framework de testes unitários

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Rodar testes
npm test

# Rodar testes com coverage
npm run test:coverage
```

## 📁 Estrutura do Projeto

```
gestao-de-ferramentas-v3/
├── src/                    # Código fonte
│   ├── index.html         # Página principal
│   ├── css/
│   │   └── main.css       # Estilos Tailwind
│   └── js/
│       ├── app.js         # Aplicação principal
│       ├── firebase-config.js  # Configuração centralizada
│       └── modules/       # Módulos refatorados
│           ├── utils.js   # Funções utilitárias
│           ├── logger.js  # Sistema de logging
│           ├── auth.js    # Autenticação
│           ├── data.js    # Operações de dados
│           └── README.md  # Guia de migração
├── tests/                  # Testes unitários
│   ├── setup.js           # Configuração dos testes
│   ├── utils.test.js      # Testes de utils
│   └── logger.test.js     # Testes de logger
├── dist/                   # Build de produção
├── img/                    # Imagens de ferramentas
├── backup-database.mjs    # Script de backup
├── export-firebase-data.mjs # Script de exportação
├── populate.html          # Popular banco de dados
├── vite.config.js         # Configuração do Vite
├── vitest.config.js       # Configuração do Vitest
├── package.json           # Dependências e scripts
└── README.md              # Este arquivo
```

## 🔒 Segurança e Melhorias

### Correções Implementadas (v3.1)

✅ **Configuração centralizada**: Firebase config em único arquivo  
✅ **Catch blocks corrigidos**: Todos os errors agora são logados  
✅ **Bug async/await**: Operações Firestore agora são aguardadas  
✅ **URLs consistentes**: Mesma CDN para bibliotecas externas  
✅ **Proteção de dados**: Arquivos de backup protegidos no .gitignore  
✅ **Logging consistente**: Sistema de logging centralizado  
✅ **Estrutura de testes**: Vitest configurado com testes iniciais

### Melhorias Implementadas

#### ✅ Fase 1 (Crítica) - COMPLETA

- ✅ **Contadores no header**: Cards com totais de usuários (Total, Ativos, Admins, Usuários)
- ✅ **Filtros por nível de acesso**: Botões de filtro (Todos, Administradores, Usuários Padrão, Ativos, Inativos)
- ✅ **Avatares com iniciais**: Exibição de iniciais do nome do usuário nos avatares
- ✅ **Toggle rápido de status**: Botão de toggle de status com feedback visual e sonoro

#### ✅ Fase 2 (Importante) - COMPLETA

- ✅ **Detalhes do último login expandidos**: Informações completas de data, hora, IP e dispositivo com ícones
- ✅ **Ordenação de usuários**: Botões de ordenação (nome, email, último login, status) com indicadores visuais
- ✅ **Hover effects**: Melhorias visuais nos cards (shadow-xl, translate-y, scale, transições 300ms)
- ✅ **Ícones com tooltips**: Tooltips emoji + title em todos os ícones, badges e botões

#### ✅ Fase 3 (Refinamento) - COMPLETA

- ✅ **Empty state melhorado**: Ilustração SVG, mensagens contextuais (com/sem filtros), botão de ação
- ✅ **Paginação**: Navegação por páginas (9 usuários/página), botões Anterior/Próximo, seletor de páginas
- ✅ **Log de atividades**: Detalhes expandidos do último login com IP, dispositivo e data/hora

### Correções Ortográficas Implementadas

✅ **Fase de Correção Ortográfica - COMPLETA**

- ✅ **68+ correções aplicadas** em todo o código JavaScript
- ✅ **PDF de Termo de Responsabilidade**: Todos os acentos corrigidos (GESTÃO, conservação, condições, etc.)
- ✅ **Mensagens de validação**: "são obrigatórios", "já cadastrado", "não informado"
- ✅ **Títulos de navegação**: "Visão Geral", "Catálogo de Inventário", "Gestão de Ferramentas"
- ✅ **Labels de campos**: "Responsável", "Movimentação", "Patrimônio", "Descrição"
- ✅ **Mensagens de erro**: "Sessão expirada", "Faça login novamente", "Nível de acesso"
- ✅ **Terminologia consistente**: "Usuário Padrão" padronizado em todo o sistema

### Correções de Bugs Implementadas

✅ **Remoção da Funcionalidade de Upload de Avatar**

- ✅ **Upload de avatar removido**: Funcionalidade de upload de foto de perfil removida do sistema
- ✅ **Modal removido**: Modal de upload removido do HTML
- ✅ **Funções removidas**: Funções `openAvatarUploadModal`, `closeAvatarUploadModal`, `handleAvatarUpload`, `saveAvatar`, `removeAvatar` removidas do JavaScript
- ✅ **Avatares estáticos**: Avatares agora exibem apenas as iniciais do nome do usuário

### Próximas Melhorias Recomendadas

⚠️ **Rotacionar senha do Firebase** (senha exposta no .env)  
🔧 **Completar refatoração** de módulos restantes  
📝 **Adicionar testes E2E** (Playwright/Cypress)  
🚀 **Configurar CI/CD** (GitHub Actions)

## 🎨 Personalização

### Cores do Tema

Edite as variáveis em `src/css/main.css`:

```css
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-500: #2563eb;
  --color-brand-600: #1d4ed8;
  /* ... */
}
```

### Configuração do Firebase

Todas as configurações em `src/js/firebase-config.js`:

```javascript
export const firebaseConfig = { ... };
export const CONFIG = { ... };
export const COLLECTIONS = { ... };
```

## 🌐 Acesso

Após iniciar o servidor, acesse:

- **Desenvolvimento**: http://localhost:3000
- **Preview**: http://localhost:4173 (após build)

## 📱 Responsividade

O sistema é otimizado para:

- 📱 **Mobile**: < 768px
- 📟 **Tablet**: 768px - 1024px
- 🖥️ **Desktop**: > 1024px

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:ui

# Rodar testes uma vez
npm run test:run

# Ver coverage
npm run test:coverage
```

Cobertura atual: **Utils** e **Logger** completos.

## 🔧 Comandos Úteis

```bash
# Backup do Firestore
npm run backup

# Exportar dados do Firebase
npm run export

# Instalar nova dependência
npm install nome-do-pacote

# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit
```

## 📊 Funcionalidades

- ✅ CRUD completo de ferramentas, usuários e colaboradores
- ✅ Scanner de QR Code (USB + câmera)
- ✅ Empréstimo e devolução de ferramentas
- ✅ Geração de recibos de responsabilidade (PDF)
- ✅ Etiquetas de QR Code para patrimônio
- ✅ Dashboard com gráficos em tempo real
- ✅ Auditoria completa de operações
- ✅ Controle de acesso por nível de permissão
- ✅ Exportação/importação em massa (Excel)
- ✅ Dark mode completo
- ✅ PWA-ready

## 📝 Licença

ISC

## 👥 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Guia de Desenvolvimento

- Seguir estrutura modular em `src/js/modules/`
- Usar Logger para todos os errors
- Nunca usar catch blocks vazios
- Aguardar todas as operações do Firestore
- Usar `Utils.escapeHTML()` para dados do usuário
- Adicionar testes para novas funcionalidades
