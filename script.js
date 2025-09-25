// URL da sua API
const API_URL = "https://apipontospeeds.vercel.app/api/ponto";

// Variável global para armazenar os pontos
let pontos = [];

// Função principal para buscar dados da API
async function carregarJogadores() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("🔍 Dados recebidos da API:", data);

    // Garante que pontos seja um array
    if (Array.isArray(data.pontos)) {
      pontos = data.pontos;
    } else {
      console.error("⚠️ Estrutura inesperada da API:", data);
      pontos = [];
    }

    renderTab("inicio"); // inicia mostrando tabela de ponto inicial
    atualizarCardPrimeiroPonto(); // atualiza o card com pontos ativos
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
  }
}

// Função para renderizar as abas
function renderTab(tab) {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = ""; // limpa antes de renderizar

  if (tab === "inicio" || tab === "completo") {
    const mostrarFim = tab === "completo";

    // Barra de pesquisa
    const searchDiv = document.createElement("div");
    searchDiv.className = "mb-4 flex gap-2 items-center";

    // Input de pesquisa por QRA, patente, veículo
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "🔍 Pesquisar...";
    input.className =
      "border border-gray-300 rounded px-3 py-2 flex-grow focus:outline-none focus:ring focus:border-blue-300";
    searchDiv.appendChild(input);

    // Select para filtrar por divisão
    const selectDivisao = document.createElement("select");
    selectDivisao.className =
      "border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300";
    const divisaoUnicas = [...new Set(pontos.map((p) => p.divisao))];
    selectDivisao.innerHTML =
      `<option value="Todos">Todos</option>` +
      divisaoUnicas.map((d) => `<option value="${d}">${d}</option>`).join("");
    searchDiv.appendChild(selectDivisao);

    container.appendChild(searchDiv);

    const tabelaContainer = document.createElement("div");
    container.appendChild(tabelaContainer);

    const atualizarTabela = () => {
      const filtro = input.value.toLowerCase();
      const divisaoFiltro = selectDivisao.value;

      let pontosFiltrados = mostrarFim
        ? pontos.filter((p) => p.fim !== "-")
        : pontos.filter(
            (p) => p.inicio && (!p.fim || p.fim === "-" || p.fim === null)
          );

      // Filtrar por QRA, patente, veículo
      pontosFiltrados = pontosFiltrados.filter(
        (p) =>
          p.qra?.toLowerCase().includes(filtro) ||
          p.patente?.toLowerCase().includes(filtro) ||
          p.veiculo?.toLowerCase().includes(filtro)
      );

      // Filtrar por divisão se não for "Todos"
      if (divisaoFiltro !== "Todos") {
        pontosFiltrados = pontosFiltrados.filter(
          (p) => p.divisao === divisaoFiltro
        );
      }

      tabelaContainer.innerHTML = "";
      criarTabelaFiltrada(tabelaContainer, pontosFiltrados, mostrarFim);
    };

    input.addEventListener("input", atualizarTabela);
    selectDivisao.addEventListener("change", atualizarTabela);
    atualizarTabela();
  } else if (tab === "estatisticas") {
    criarEstatisticasCard(container);
  }
}

// Função para criar tabela filtrada
function criarTabelaFiltrada(container, pontosFiltrados, mostrarFim = false) {
  const tabela = document.createElement("table");
  tabela.className =
    "min-w-full bg-white border border-gray-200 rounded-xl shadow";

  const thead = document.createElement("thead");
  thead.className = "bg-[#002060] text-white";

  // Adiciona coluna Divisão
  thead.innerHTML = `
    <tr>
      <th class="text-left p-4">Divisão</th>
      <th class="text-left p-4">QRA</th>
      <th class="text-left p-4">Patente</th>
      <th class="text-left p-4">Veículo</th>
      <th class="text-left p-4">Início</th>
      ${mostrarFim ? `<th class="text-left p-4">Fim</th>` : ""}
    </tr>
  `;
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  if (pontosFiltrados.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-4 text-center" colspan="${mostrarFim ? 6 : 5}">
        Nenhum agente em serviço
      </td>
    `;
    tbody.appendChild(tr);
  } else {
    pontosFiltrados.forEach((p) => {
      const tr = document.createElement("tr");
      tr.className =
        "border-t border-gray-200 hover:bg-gray-50 transition-colors";
      tr.innerHTML = `
        <td class="p-4">${p.divisao || "-"}</td>
        <td class="p-4">${p.qra || "-"}</td>
        <td class="p-4">${p.patente || "-"}</td>
        <td class="p-4">${p.veiculo || "-"}</td>
        <td class="p-4">${p.inicio || "-"}</td>
        ${mostrarFim ? `<td class="p-4">${p.fim || "-"}</td>` : ""}
      `;
      tbody.appendChild(tr);
    });
  }

  tabela.appendChild(tbody);
  container.appendChild(tabela);
}

// Função para criar card de estatísticas
function criarEstatisticasCard(container) {
  const card = document.createElement("div");
  card.className =
    "bg-white border border-gray-200 rounded-xl p-6 shadow text-center";

  const total = pontos.length;
  const veiculos = [...new Set(pontos.map((p) => p.veiculo))].length;
  const patentes = [...new Set(pontos.map((p) => p.patente))].length;

  card.innerHTML = `
    <h3 class="text-xl font-semibold text-[#002060] mb-2">📊 Estatísticas</h3>
    <p>Total de registros: <strong>${total}</strong></p>
    <p>Veículos diferentes: <strong>${veiculos}</strong></p>
    <p>Patentes diferentes: <strong>${patentes}</strong></p>
  `;

  container.appendChild(card);
}

// Atualiza o card "Pontos Ativos" com agentes que têm apenas o primeiro ponto batido
function atualizarCardPrimeiroPonto() {
  const card = document.querySelector(".grid > div:nth-child(1)"); // pega o card da direita
  if (!card) return;

  // Conta apenas quem tem fim = "-"
  const ativos = pontos.filter((p) => p.fim === "-");

  const titulo = card.querySelector("p.text-gray-500");
  const valor = card.querySelector("h2.text-2xl");

  titulo.textContent = "Agentes em serviço";
  valor.textContent = ativos.length; // quantidade total do momento
}

// Carregar os dados ao iniciar
carregarJogadores();
