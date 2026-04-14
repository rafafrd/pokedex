const API_URL = "https://pokeapi.co/api/v2/pokemon";
const pokemonImage = document.querySelector(".pokemon__image");
const pokemonNumber = document.querySelector(".pokemon__number");
const pokemonName = document.querySelector(".pokemon__name");
const form = document.getElementById("form");
const input = document.querySelector("input");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
let searchPokemon = 150;
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

    pokemonNumber.innerText = `${data.id} -`;
    pokemonName.innerText = `${data.name}`;
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log(input.value);
  const pokemon = input.value.toLowerCase();
  renderPokemon(pokemon);
});

btnPrev.addEventListener("click", (event) => {});

btnNext.addEventListener("click", (event) => {});

renderPokemon(searchPokemon);
