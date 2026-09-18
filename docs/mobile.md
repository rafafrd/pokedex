# Pokédex Mobile

## Contexto e entendimento do projeto

Este repositório começou como uma Pokédex web acadêmica em React, Vite e TypeScript. Ela consulta a [PokéAPI](https://pokeapi.co/), mostra Pokémon em uma grade paginada, permite procurar por nome ou número e abre uma ficha com tipos, atributos, estatísticas e habilidades. A versão web também tem os temas Gengar/Mewtwo, persistidos localmente, e um cenário 3D de Pokébolas com Three.js.

A implementação mobile preserva o que importa para quem usa o produto — explorar a Pokédex e consultar um Pokémon — sem tentar transportar o DOM, Tailwind ou Three.js para React Native.

## Entrega

- Branch: `feat/mobile`
- Aplicação: [`mobile/`](../mobile/)
- Plataforma: React Native com Expo SDK 57 (`expo ~57.0.24`)
- Navegação: Expo Router
- Dados e cache: TanStack Query + `fetch` nativo

A aplicação mobile permanece isolada em `mobile/`; o app Vite existente e as suas alterações locais não foram reestruturados ou substituídos.

## O que foi implementado

- Catálogo paginado em grade responsiva (20 Pokémon por página).
- Busca global por nome ou número, com debounce de 300 ms.
- Ficha individual com imagem, tipos, altura, peso, experiência, estatísticas e habilidades.
- Estados explícitos de carregamento, erro, vazio e conteúdo; atualização por gesto de puxar para baixo e tentativas de recuperação.
- Cache de cinco minutos e até duas novas tentativas de leitura para consultas da PokéAPI.
- Fallback acessível caso a arte remota de um Pokémon não carregue.
- Rótulos acessíveis para imagens, badges, barras de progresso, busca e botões.

## Design

A interface adota uma leitura de “cartucho Pokédex”: azul profundo (`deepBlue`), vermelho de comando (`commandRed`) e cartões claros. A marca de Pokébola no cabeçalho é o elemento característico; o restante da interface é intencionalmente discreto para priorizar a leitura do catálogo.

Os tokens visuais ficam em [`mobile/src/theme/`](../mobile/src/theme/), e os componentes reutilizáveis em [`mobile/src/components/`](../mobile/src/components/).

## Estrutura

```text
mobile/
├── src/
│   ├── api/                 # cliente PokeAPI, parsing e erros tipados
│   ├── app/                 # rotas Expo Router
│   │   ├── index.tsx        # catálogo
│   │   └── pokemon/[id].tsx # ficha individual
│   ├── components/          # card, arte e badge de tipo
│   ├── screens/             # composição das telas
│   ├── theme/               # cores, espaçamento, tipografia e sombras
│   └── types/               # domínio e respostas mínimas da PokeAPI
├── app.json                 # nome, scheme e plugin do Router
└── package.json
```

`listPokemon` busca a página da API e busca os detalhes de seus itens em paralelo, pois a resposta de listagem não inclui tipos ou sprites. `getPokemon` é usado na pesquisa global e na rota de detalhes. Ambos recebem um `AbortSignal`, permitindo ao TanStack Query cancelar pedidos que ficaram obsoletos.

## Executar localmente

```bash
cd mobile
npm install
npm run start
```

Abra o QR code no Expo Go para testar em um aparelho. Também estão disponíveis:

```bash
npm run android
npm run ios
npm run web
```

Não há código nativo customizado: o fluxo previsto é Expo Go durante o desenvolvimento. Uma futura publicação nas lojas pode adicionar EAS Build sem alterar a arquitetura da aplicação.

## Validações executadas

Na entrega foram executados, com sucesso:

```bash
cd mobile
npx tsc --noEmit
npx expo-doctor --verbose
npx expo export --platform android --output-dir .expo/verify-android
```

O Expo Doctor aprovou as 21 verificações e a exportação gerou o bundle Android.
