# 💰 App de Gestão Financeira — PWA

> Aplicativo instalável no celular para controle financeiro pessoal com foco em cartões de crédito, contas fixas e visualização gráfica detalhada.

**🔗 Acesse em produção:** [app-gestao-fin.vercel.app](https://app-gestao-fin.vercel.app)

---

## 📸 Preview

> *(Adicione aqui um print ou GIF da tela principal do app)*

---

## ✨ Funcionalidades

- 📊 Dashboard com visão geral das finanças
- 💳 Controle de cartões de crédito e contas fixas
- 📈 Visualização gráfica de receitas e despesas
- 📱 Instalável no celular como app nativo (PWA)
- 🔐 Autenticação e dados persistidos via Supabase
- ⚡ Interface responsiva e rápida com React + Vite

---

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| TypeScript | Linguagem principal |
| React | Interface do usuário |
| Vite | Build e dev server |
| Supabase | Backend, autenticação e banco de dados |
| Vercel | Deploy em produção |
| PWA | Instalação nativa no celular |
| Tailwind CSS | Estilização |

---

## 🚀 Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/crislaingomez-coder/app-gestao-fin.git

# Acesse a pasta
cd app-gestao-fin

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env com suas credenciais do Supabase:
# VITE_SUPABASE_URL=sua_url
# VITE_SUPABASE_ANON_KEY=sua_chave

# Rode em desenvolvimento
npm run dev
```

---

## 📁 Estrutura do Projeto

```
app-gestao-fin/
├── components/        # Componentes React reutilizáveis
├── services/          # Integração com Supabase e APIs
├── App.tsx            # Componente raiz
├── types.ts           # Tipagens TypeScript
├── constants.ts       # Constantes da aplicação
├── manifest.json      # Configuração PWA
└── vite.config.ts     # Configuração do Vite
```

---

## 🌐 Deploy

O app está em produção via **Vercel** com deploy automático a cada push na branch `main`.

**URL:** [https://app-gestao-fin.vercel.app](https://app-gestao-fin.vercel.app)

---

## 👩‍💻 Autora

**Crislaine Gomes** — Analista de Dados & BI | Desenvolvedora

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/crislainegomesoliveira)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/crislaingomez-coder)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:crislaingomez@gmail.com)
