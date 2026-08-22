# Pesquisas & Formulários / HTML estático

[Read in English](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Grátis](https://img.shields.io/badge/pre%C3%A7o-gr%C3%A1tis-brightgreen)

Um construtor de formulários com os dois lados, feito em HTML puro, JavaScript vanilla e Tailwind CSS v4: o formulário público que a pessoa responde de verdade e a área onde ele é montado e lido. Quem responde recebe uma pergunta por vez, barra de progresso, validação embaixo do campo e lógica condicional que realmente decide qual é a próxima pergunta e quais nunca aparecem. Quem monta tem construtor com arrastar para reordenar cobrindo dez tipos de pergunta, abas de lógica, aparência e compartilhar, um resumo que escolhe o gráfico certo para cada tipo — incluindo medidor de NPS e matriz de calor —, respostas individuais em drawer e exportação CSV feita no navegador. NPS, taxa de conclusão e tempo médio são calculados, nunca gravados. Seis formulários e cento e vinte e seis respostas vêm como dados de exemplo, gerados por um PRNG determinístico que percorre o mesmo motor de lógica do formulário público, persistidos em `localStorage`, sem backend nenhum.

Prévia ao vivo: https://template.dev.br/preview/survey-html/

## Telas incluídas

14 telas, cobrindo o site público e a área autenticada:

- Home: hero, os tipos de pergunta em cartões, como funciona em três passos, modelos prontos, depoimentos, planos e FAQ
- Modelos: galeria por objetivo (NPS, satisfação, inscrição em evento, pesquisa de mercado, feedback interno) com prévia das perguntas
- Responder: o formulário público de verdade — uma pergunta por vez, barra de progresso, validação e lógica condicional, com voltar e avançar
- Agradecimento: a mensagem final configurada mais o resumo do que foi respondido
- Contato: formulário de contato validado
- Login e Registro: telas de autenticação em layout próprio
- Visão geral: respostas no mês, taxa de conclusão, tempo médio, NPS, gráfico de respostas por dia, formulários mais respondidos e últimas respostas
- Formulários: tabela com busca e filtro por status, mais duplicar, encerrar e copiar o link público
- Construtor: abas Perguntas (arrastar para reordenar, painel lateral editando a pergunta selecionada e prévia ao vivo), Lógica, Aparência e Compartilhar
- Respostas: Resumo com um gráfico por tipo de pergunta e Individuais com tabela e drawer da resposta completa, mais exportar CSV
- Biblioteca de modelos: começar um formulário a partir de um modelo
- Contatos: quem respondeu, com origem, tags e nota
- Configurações: perfil, organização, notificação a cada resposta, tema e idioma
- Não encontrado: página 404

## Stack

- Páginas HTML estáticas — um arquivo por tela, sem framework
- Tailwind CSS v4 compilado pelo Tailwind CLI em `assets/css/tailwind.css`
- JavaScript vanilla em `assets/js/`, carregado como script clássico — sem bundler em runtime
- Estado no `localStorage`, no mesmo formato dos stores das outras techs
- i18n no cliente a partir de `assets/i18n/*.json` (en, es, pt-BR)
- ApexCharts 3.49 via CDN
- Manifest e service worker para o PWA instalável

## Requisitos

- Node.js 18 ou mais novo
- npm

## Como rodar

```bash
npm install
npm run build
npm run dev
```

O `npm run build` compila o CSS; o `npm run dev` serve a pasta. Qualquer servidor estático funciona — as páginas não têm templating de build. Credenciais de demonstração:

- `pesquisa@sondagem.com` / `demo123`

Qualquer e-mail e senha não vazios entram; o par acima é a conta sugerida na tela de login e a dona dos dados de exemplo.

## Build de produção

```bash
npm run build
```

Recompila o `assets/css/tailwind.css`. Publique a pasta como está em qualquer host estático.

## Estrutura do projeto

```
.
├── *.html             one file per screen
└── assets/
    ├── css/           app.css (source) and tailwind.css (built)
    ├── i18n/          en.json, es.json, pt-BR.json
    └── js/            data.js, query.js, state.js, i18n.js, format.js, icons.js, layout.js, sv.js
```

## Tema e customização

O Tailwind CSS v4 é configurado em CSS, não em arquivo de configuração JavaScript. A folha de estilo importa o Tailwind, declara a variante dark e define os tokens dentro de `@theme`: a fonte Outfit, breakpoints extras e a rampa de cor da marca (`--color-brand-25` até `--color-brand-950`). Os tokens semânticos de superfície usam o prefixo `--tx-`. O dark mode é uma classe no elemento raiz, alternada em runtime e persistida. A cor e a capa de cada formulário são dados, então mudar a cara de uma pesquisa é mudança de dado, não de template.

## Internacionalização

O template vem com três idiomas: inglês, espanhol e português do Brasil. O idioma do navegador é detectado no primeiro acesso e o seletor do cabeçalho guarda a escolha. Datas, números e durações são formatados por idioma.

## O mesmo sistema em outras tecnologias

O mesmo sistema existe em cinco tecnologias, com as mesmas telas e a mesma identidade visual, e todas são gratuitas:

- React 19: https://github.com/danilo62x/survey-react
- Vue 3.5: https://github.com/danilo62x/survey-vue3
- Angular 19: https://github.com/danilo62x/survey-angular
- Laravel 11 + Blade: https://github.com/danilo62x/survey-laravel

O catálogo completo, de templates grátis e pagos, está em https://template.dev.br

## Apoie este projeto

Este template é gratuito e licenciado sob MIT. Se ele te poupou tempo, você pode apoiar o trabalho com uma doação em https://template.dev.br/doar?template=survey-html

## Licença

[MIT](./LICENSE), copyright 2026 Danilo Quinelato.
