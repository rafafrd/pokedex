# Módulo de companheiro

Disponível no web (aba **Companheiro**, endereço `/#companion`) e no aplicativo Expo (cartão **Meu companheiro**, rota `/companion`). Na ficha de qualquer Pokémon, **Escolher como companheiro** leva ao formulário com a espécie selecionada. Também há seis opções iniciais que dispensam buscar a espécie na API.

## Como jogar

1. Escolha um Pokémon e dê um apelido de 1 a 20 caracteres.
2. Alimente com Oran, Pecha ou Sitrus. A fruta favorita rende 6 pontos extras de vínculo.
3. Faça carinho, brinque e deixe descansar. Saciedade, alegria e energia variam de 0 a 100.
4. Colete a cesta diária ou colha frutas no pomar. As frutas são compartilhadas entre os companheiros.
5. Renomeie e alterne entre até 12 companheiros, cada um com seu próprio progresso e diário. Cada espécie pode ser adotada uma vez.

| Ação         | Efeito                                              | Intervalo                                      |
| ------------ | --------------------------------------------------- | ---------------------------------------------- |
| Oran         | +25 saciedade, +5 alegria, +8 vínculo               | 10 segundos entre alimentações                 |
| Pecha        | +15 saciedade, +18 alegria, +10 vínculo             | 10 segundos entre alimentações                 |
| Sitrus       | +35 saciedade, +8 alegria, +12 energia, +12 vínculo | 10 segundos entre alimentações                 |
| Carinho      | +12 alegria, +6 vínculo                             | 30 segundos                                    |
| Brincar      | +20 alegria, +12 vínculo, −15 energia, −8 saciedade | 1 minuto                                       |
| Descansar    | Até +45 energia ao longo de 1 minuto                | Cuidados bloqueados durante a soneca           |
| Cesta diária | 5 Oran, 3 Pecha, 2 Sitrus                           | Uma por data local; conta os dias consecutivos |
| Pomar        | 2 Oran, 1 Pecha, 1 Sitrus                           | 5 minutos                                      |

A mochila começa com 5 Oran, 3 Pecha e 2 Sitrus, uma única vez. Adotar ou alternar Pokémon não repõe a mochila. Alimentação é bloqueada com saciedade a partir de 95; brincar exige 15 de energia e 10 de saciedade; descanso é bloqueado com energia a partir de 95. As interfaces mostram o motivo e a contagem regressiva.

Os níveis de amizade são **Primeiros laços** (0), **Amigos** (60), **Grandes amigos** (180), **Inseparáveis** (400) e **Melhores amigos** (800). O vínculo nunca diminui. Por hora, a saciedade cai 4, a alegria cai 3 e a energia acordado cai 2. Não há morte, perda do companheiro ou tarefas em segundo plano. O tempo decorrido é calculado ao abrir o módulo e antes de cada ação; o descanso também funciona com o app fechado.

## Perfil do treinador e novas interações

A aba **Treinador** no web (`/#trainer`) e **Meu perfil** no mobile (`/settings`) permitem editar nome, avatar, região favorita e apresentação. O tema Gengar/Mewtwo é aplicado ao selecionar. Alterações no perfil só passam a valer após salvar, e é possível descartar o rascunho. O nome antigo do treinador no mobile é lido automaticamente na primeira abertura.

O perfil mostra companheiros, cuidados e frutas servidas, além de quatro conquistas derivadas do progresso real: primeira adoção, 10 frutas servidas, 25 cuidados e nível 3 de amizade.

| Nova interação | Efeito                                                                         | Intervalo                           |
| -------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| Passear        | +12 alegria, +10 vínculo, −10 energia, −5 saciedade; encontra 1 fruta favorita | 2 minutos                           |
| Escovar        | +15 alegria, +8 vínculo                                                        | 90 segundos                         |
| Ensinar truque | +8 alegria, +18 vínculo, −10 energia, −4 saciedade                             | 3 minutos; exige nível 2 de amizade |

Passeios e truques exigem pelo menos 10 de energia e 10 de saciedade. Todas as interações respeitam o sono. Os intervalos e desbloqueios são validados no domínio compartilhado, além dos botões.

## Arquitetura e persistência

- `shared/companion.ts`: tipos, regras puras, projeção temporal, validação do save e store transacional independente de React. É a mesma implementação nas duas plataformas.
- `src/features/companion/`: tela web, estilos responsivos e adaptador `localStorage`. A Web Locks API serializa gravações entre abas nos navegadores que a oferecem; eventos de armazenamento atualizam as outras abas.
- `mobile/src/features/companion/`: adaptador `expo-sqlite/kv-store` e atualização ao retornar ao primeiro plano.
- `mobile/src/screens/companion-screen.tsx`: interface nativa, tema do app, controles Expo UI, acessibilidade e formulário com acomodação do teclado.
- `shared/trainer.ts`: perfil versionado, validação, migração do nome antigo e gravação atômica do perfil na chave `pokedex.trainer.v1`.
- `mobile/src/lib/storage.ts` e `storage.web.ts`: SQLite no Android/iOS e `localStorage` no Expo web, sem exigir WASM para o navegador.
- `mobile/metro.config.js`: observa somente a pasta de domínio compartilhado, evitando importar o runtime React do web no mobile.

O save tem versão 1 e usa a chave `pokedex.companion.v1`. As transações releem o save antes da ação e só atualizam a interface após gravar com sucesso. Uma falha não consome frutas nem concede vínculo. Cliques repetidos durante uma gravação são ignorados; erros são exibidos e a ação pode ser repetida. Saves inválidos ou de versão desconhecida são preservados e bloqueiam alterações.

O progresso é **local e independente em cada dispositivo/navegador**; não há conta, servidor ou sincronização entre web e mobile. Os cuidados funcionam offline após carregar o app. Ilustrações dependem do cache ou da conexão; a seleção de espécies adicionais usa a PokéAPI existente. Limpar os dados do app/navegador apaga o progresso. O relógio é local: este módulo não implementa proteção contra manipulação de horário.

## Validação

Requer Node.js 22.13+ para o runner TypeScript sem dependências adicionais.

```sh
# Raiz: testes das regras e persistência; build web
npm test
npm run build

# Dentro de mobile: tipos e exportação para as três plataformas
npm run lint
npx expo export --platform android --platform ios --platform web --max-workers 2 --output-dir dist

# Teste interativo no Expo Go
npm start
```

Os testes automatizados exercitam adoção, limites, favorito, inventário, cooldowns, persistência, falha de gravação e recuperação, simultaneidade, troca de companheiro, avanço de tempo, descanso offline, virada do dia, níveis de vínculo e saves corrompidos. Exportar os bundles valida a integração do Metro, mas não substitui a execução em um dispositivo Android/iOS.

Registro da validação de 25/09/2026: 21 testes aprovados, build Vite aprovado, TypeScript mobile aprovado e exportação Expo Android/iOS/web concluída. No navegador foram exercitados adoção, alimentação, carinho, brincadeira, renomeação, coleta e persistência após recarregar. A tentativa no emulador nativo exibiu um erro de abertura: o Expo Go instalado era 54.0.8 e o projeto usa SDK 57. A interação com o emulador foi interrompida pelo usuário via Esc; o teste interativo nativo permanece pendente em um cliente compatível.
