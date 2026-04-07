const API_URL = "https://pokeapi.co/api/v2/pokemon";
const pokemonImage = document.querySelector(".pokemon__image");

let searchPokemon = 1;
// fetch -> interface Nativa do js, que faz as req http
// .then() -> método de tratamento de resposta, promessa de resposta, quando a resposta chegar, o que fazer
const fetchData = async (pokemon) => {
  try {
    console.log("Buscando dados da API...");
    console.log(`${API_URL}/${pokemon}`);
    const response = await fetch(`${API_URL}/${pokemon}`);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados da API:", error);
  }
};

const renderPokemon = async (pokemon) => {
  const data = await fetchData(pokemon);
  if (data) {
    pokemonImage.src =
      data["sprites"]["versions"]["generation-v"]["black-white"]["animated"][
        "front_default"
      ];
  }
};

renderPokemon(searchPokemon);
