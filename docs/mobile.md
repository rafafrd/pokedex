# Pokédex Mobile

## Contexto e entendimento do projeto

Este repositório começou como uma Pokédex web acadêmica em React, Vite e TypeScript. Ela consulta a [PokéAPI](https://pokeapi.co/), mostra Pokémon em uma grade paginada, permite procurar por nome ou número e abre uma ficha com tipos, atributos, estatísticas e habilidades. A versão web também tem os temas Gengar/Mewtwo, persistidos localmente, e um cenário 3D de Pokébolas com Three.js.

A implementação mobile preserva o que importa para quem usa o produto — explorar a Pokédex e consultar um Pokémon — sem tentar transportar o DOM, Tailwind ou Three.js para React Native.

## Entrega

- Branch: `feat/mobileBattle`
- Aplicação: [`mobile/`](../mobile/)
- Plataforma: React Native com Expo SDK 57 (`expo ~57.0.25`)
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
- CTA acessível “Batalhar” na Pokédex, que abre a seleção do confronto em `/battle`.
- Batalha PvE funcional por turnos: escolha seu Pokémon e o adversário no catálogo, use movimentos obtidos da PokéAPI, acompanhe HP, PP, ordem e resultado, e inicie uma revanche.
- Struggle entra como golpe de emergência quando todos os movimentos comuns ficam sem PP; tem poder 50, não consome PP e não causa recuo.
- A batalha não reproduz áudio nem depende de pacotes de áudio.
- Perfil do treinador com nome, avatar, região e apresentação; o perfil também escolhe entre os temas Gengar e Mewtwo.
- Módulo “Meu companheiro” com cuidados, frutas e progresso persistidos localmente no mobile.

## Design

A interface parte de uma leitura de “cartucho Pokédex” e adapta a paleta ao tema salvo no perfil do treinador. Gengar e Mewtwo oferecem variações de cor para o catálogo, as fichas e o módulo de companheiro.

Os tokens visuais ficam em [`mobile/src/theme/`](../mobile/src/theme/), e os componentes reutilizáveis em [`mobile/src/components/`](../mobile/src/components/).

## Estrutura

```text
mobile/
├── src/
│   ├── api/                 # cliente PokeAPI, parsing e erros tipados
│   ├── app/                 # rotas Expo Router
│   │   ├── index.tsx        # catálogo
│   │   ├── battle/
│   │   │   ├── index.tsx    # seleção do confronto
│   │   │   └── fight.tsx    # arena
│   │   └── pokemon/[id].tsx # ficha individual
│   ├── battle/              # regras, motor e estado da batalha
│   ├── components/          # cards, arte, badges e arena de batalha
│   ├── screens/             # composição das telas
│   ├── theme/               # cores, espaçamento, tipografia e sombras
│   └── types/               # domínio e respostas mínimas da PokeAPI
├── app.json                 # nome, scheme e plugin do Router
└── package.json
```

`listPokemon` busca a página da API e busca os detalhes de seus itens em paralelo, pois a resposta de listagem não inclui tipos ou sprites. `getPokemon` é usado na pesquisa global e na rota de detalhes. Ambos recebem um `AbortSignal`, permitindo ao TanStack Query cancelar pedidos que ficaram obsoletos.

A rota `/battle` permite escolher os dois combatentes antes de abrir `/battle/fight`. O motor resolve turnos, movimentos, PP, dano, efetividade de tipos e vitória ou derrota; a CPU escolhe movimentos disponíveis para o adversário. Se os movimentos regulares acabam, Struggle fica disponível. A interface da batalha é silenciosa.

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
npm run start:tunnel
npm run start:dev-client
npm run lint
npm test
npm run test:mobile
```

`npm test` executa os testes compartilhados do companheiro e treinador e requer Node.js 22.13 ou mais recente. `npm run test:mobile` é o comando separado para Jest no app Expo; as dependências estão preparadas para a próxima onda, mas esta entrega não adiciona arquivos de teste nem configuração Jest mobile. `npm run lint` executa a checagem TypeScript.

Não há código nativo customizado: o fluxo previsto é Expo Go durante o desenvolvimento. Uma futura publicação nas lojas pode adicionar EAS Build sem alterar a arquitetura da aplicação.

## Validações executadas

Na entrega inicial foram executados, com sucesso:

```bash
cd mobile
npx tsc --noEmit
npx expo-doctor --verbose
npx expo export --platform android --output-dir .expo/verify-android
```

O Expo Doctor aprovou as 21 verificações e a exportação gerou o bundle Android. Na integração Battle anterior ao merge com `main`, `npx expo install --check` e `npx tsc --noEmit` também passaram. A validação foi mantida curta durante este merge; consulte `docs/companion.md` para os resultados da suite compartilhada e das exportações dessa entrega.
