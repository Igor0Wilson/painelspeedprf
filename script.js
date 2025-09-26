const API_URL = "https://apipontospeeds.vercel.app/api/ponto";
const API_URL_USUARIOS = "https://apipontospeeds.vercel.app/api/usuario";

let pontos = [];
let usuarios = [];
let usuarioIdEditando = null;
let usuarioIdExcluindo = null;

// ================= CARREGAR DADOS =================
async function carregarJogadores() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("🔍 Dados recebidos da API:", data);

    if (Array.isArray(data.pontos)) {
      pontos = data.pontos;
    } else {
      console.error("⚠️ Estrutura inesperada da API:", data);
      pontos = [];
    }

    renderTab("inicio");
    atualizarCardPrimeiroPonto();
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
  }
}

async function carregarUsuarios() {
  try {
    const response = await fetch(API_URL_USUARIOS);
    const data = await response.json();

    if (Array.isArray(data.usuarios)) {
      usuarios = data.usuarios;
    } else {
      usuarios = [];
    }

    // Atualiza a aba atual se estiver em "usuarios" ou "agentes"
    const mainContent = document.getElementById("mainContent");
    if (mainContent.innerHTML.includes("Cadastrar Novo Usuário")) {
      renderTab("usuarios");
    } else if (mainContent.innerHTML.includes("Cadastrar Novo Agente")) {
      renderTab("agentes");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar usuários:", error);
  }
}

// ================= RENDERIZAÇÃO DE ABAS =================
function renderTab(tab) {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = "";

  if (tab === "inicio" || tab === "completo") {
    renderPontosTab(container, tab === "completo");
  } else if (tab === "estatisticas") {
    criarEstatisticasCard(container);
  } else if (tab === "agentes") {
    renderAgentesTab(container);
  } else if (tab === "usuarios") {
    renderUsuariosTab(container);
  }
}

// ================= ABA DE PONTOS =================
function renderPontosTab(container, mostrarFim = false) {
  const searchDiv = document.createElement("div");
  searchDiv.className = "mb-4 flex gap-2 items-center";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "🔍 Pesquisar...";
  input.className =
    "border border-gray-300 rounded px-3 py-2 flex-grow focus:outline-none focus:ring focus:border-blue-300";
  searchDiv.appendChild(input);

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

    pontosFiltrados = pontosFiltrados.filter(
      (p) =>
        p.qra?.toLowerCase().includes(filtro) ||
        p.patente?.toLowerCase().includes(filtro) ||
        p.veiculo?.toLowerCase().includes(filtro)
    );

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
}

function criarTabelaFiltrada(container, pontosFiltrados, mostrarFim = false) {
  const tabela = document.createElement("table");
  tabela.className =
    "min-w-full bg-white border border-gray-200 rounded-xl shadow";

  const thead = document.createElement("thead");
  thead.className = "bg-[#002060] text-white";
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

// ================= ABA DE AGENTES =================
function renderAgentesTab(container) {
  // Formulário de cadastro
  const form = document.createElement("form");
  form.className =
    "mb-6 bg-white p-4 rounded-xl shadow space-y-4 border border-gray-200";
  form.innerHTML = `
    <h2 class="text-lg font-semibold text-[#002060]">👮‍♂️ Cadastrar Novo Agente</h2>
    <div class="flex gap-4">
      <input type="text" id="qra" placeholder="QRA" class="flex-1 p-2 border rounded" required />
      <input type="text" id="patente" placeholder="Patente" class="flex-1 p-2 border rounded" required />
    </div>
    <button type="submit" class="bg-[#002060] text-white px-4 py-2 rounded hover:bg-[#001040]">
      ➕ Adicionar
    </button>
  `;
  container.appendChild(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const qra = document.getElementById("qra").value;
    const patente = document.getElementById("patente").value;

    try {
      await fetch(API_URL_USUARIOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qra, patente }),
      });
      await carregarUsuarios(); // recarrega a lista
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
    }
  });

  // Tabela de agentes
  const tabela = document.createElement("table");
  tabela.className =
    "min-w-full bg-white border border-gray-200 rounded-xl shadow";
  tabela.innerHTML = `
    <thead class="bg-[#002060] text-white">
      <tr>
        <th class="text-left p-4">QRA</th>
        <th class="text-left p-4">Patente</th>
        <th class="text-left p-4">Criado em</th>
        <th class="text-left p-4">Atualizado em</th>
        <th class="text-left p-4">Ações</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  container.appendChild(tabela);

  const tbody = tabela.querySelector("tbody");

  if (usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center">Nenhum agente cadastrado</td></tr>`;
  } else {
    usuarios.forEach((u) => {
      const tr = document.createElement("tr");
      tr.className =
        "border-t border-gray-200 hover:bg-gray-50 transition-colors";
      tr.innerHTML = `
        <td class="p-4">${u.qra || "-"}</td>
        <td class="p-4">${u.patente || "-"}</td>
        <td class="p-4">${
          u.criado_em
            ? new Date(u.criado_em._seconds * 1000).toLocaleString()
            : "-"
        }</td>
        <td class="p-4">${
          u.atualizado_em
            ? new Date(u.atualizado_em._seconds * 1000).toLocaleString()
            : "-"
        }</td>
        <td class="p-4 space-x-2">
          <button onclick="editarUsuario('${
            u.id
          }')" class="px-3 py-1 bg-yellow-500 text-white rounded">✏️ Editar</button>
          <button onclick="deletarUsuario('${
            u.id
          }')" class="px-3 py-1 bg-red-600 text-white rounded">🗑️ Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// ================= ABA DE USUÁRIOS =================
function renderUsuariosTab(container) {
  // Formulário de cadastro
  const form = document.createElement("form");
  form.className =
    "mb-6 bg-white p-4 rounded-xl shadow space-y-4 border border-gray-200";
  form.innerHTML = `
    <h2 class="text-lg font-semibold text-[#002060]">🧑‍💻 Cadastrar Novo Usuário do Sistema</h2>
    <div class="flex gap-4">
      <input type="text" id="usuarioQra" placeholder="QRA" class="flex-1 p-2 border rounded" required />
      <input type="text" id="usuarioPatente" placeholder="Patente" class="flex-1 p-2 border rounded" required />
      <input type="password" id="usuarioSenha" placeholder="Senha" class="flex-1 p-2 border rounded" required />
    </div>
    <button type="submit" class="bg-[#002060] text-white px-4 py-2 rounded hover:bg-[#001040]">
      ➕ Adicionar
    </button>
  `;
  container.appendChild(form);

  // Tabela de usuários do sistema
  const tabela = document.createElement("table");
  tabela.className =
    "min-w-full bg-white border border-gray-200 rounded-xl shadow";
  tabela.innerHTML = `
    <thead class="bg-[#002060] text-white">
      <tr>
        <th class="text-left p-4">QRA</th>
        <th class="text-left p-4">Patente</th>
        <th class="text-left p-4">Criado em</th>
        <th class="text-left p-4">Atualizado em</th>
        <th class="text-left p-4">Ações</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  container.appendChild(tabela);

  const tbody = tabela.querySelector("tbody");

  // Função para renderizar a tabela
  function renderUsuarios() {
    tbody.innerHTML = "";
    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center">Nenhum usuário cadastrado</td></tr>`;
      return;
    }

    usuarios.forEach((u) => {
      const tr = document.createElement("tr");
      tr.className =
        "border-t border-gray-200 hover:bg-gray-50 transition-colors";
      tr.innerHTML = `
        <td class="p-4">${u.qra || "-"}</td>
        <td class="p-4">${u.patente || "-"}</td>
        <td class="p-4">${
          u.criado_em
            ? new Date(u.criado_em._seconds * 1000).toLocaleString()
            : "-"
        }</td>
        <td class="p-4">${
          u.atualizado_em
            ? new Date(u.atualizado_em._seconds * 1000).toLocaleString()
            : "-"
        }</td>
        <td class="p-4 space-x-2">
          <button onclick="editarUsuario('${
            u.id
          }')" class="px-3 py-1 bg-yellow-500 text-white rounded">✏️ Editar</button>
          <button onclick="deletarUsuario('${
            u.id
          }')" class="px-3 py-1 bg-red-600 text-white rounded">🗑️ Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderUsuarios();

  // Submissão do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const qra = document.getElementById("usuarioQra").value;
    const patente = document.getElementById("usuarioPatente").value;
    const senha = document.getElementById("usuarioSenha").value;

    if (!qra || !patente || !senha) return alert("Preencha todos os campos!");

    try {
      await fetch(API_URL_USUARIOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qra, patente, senha }),
      });

      await carregarUsuarios();
      renderUsuarios();
      form.reset();
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
    }
  });
}

// ================= CARD E ESTATÍSTICAS =================
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

function atualizarCardPrimeiroPonto() {
  const card = document.querySelector(".grid > div:nth-child(1)");
  if (!card) return;

  const ativos = pontos.filter((p) => p.fim === "-");

  const titulo = card.querySelector("p.text-gray-500");
  const valor = card.querySelector("h2.text-2xl");

  titulo.textContent = "Agentes em serviço";
  valor.textContent = ativos.length;
}

// ================= MODAIS =================
function editarUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;

  usuarioIdEditando = id;
  document.getElementById("editarId").value = id;
  document.getElementById("editarQra").value = usuario.qra || "";
  document.getElementById("editarPatente").value = usuario.patente || "";

  document.getElementById("modalEditar")?.classList.remove("hidden");
}

function fecharModalEditar() {
  document.getElementById("modalEditar").classList.add("hidden");
  usuarioIdEditando = null;
}

async function salvarEdicao() {
  const id = usuarioIdEditando;
  const qra = document.getElementById("editarQra").value.trim();
  const patente = document.getElementById("editarPatente").value.trim();
  const senha = document.getElementById("editarSenha").value.trim();

  if (!qra || !patente) return showModal("Preencha todos os campos!");

  const payload = { qra, patente };
  if (senha) payload.senha = senha;

  try {
    await fetch(`${API_URL_USUARIOS}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    fecharModalEditar();
    await carregarUsuarios();
    showModal("Usuário atualizado com sucesso!");
  } catch (err) {
    console.error("Erro ao editar usuário:", err);
    showModal("Erro ao atualizar usuário!");
  }
}

function deletarUsuario(id) {
  usuarioIdExcluindo = id;
  document.getElementById("modalConfirmar").classList.remove("hidden");
}

function fecharModalConfirmar() {
  document.getElementById("modalConfirmar").classList.add("hidden");
  usuarioIdExcluindo = null;
}

async function confirmarExclusao() {
  if (!usuarioIdExcluindo) return;

  try {
    await fetch(`${API_URL_USUARIOS}/${usuarioIdExcluindo}`, {
      method: "DELETE",
    });

    fecharModalConfirmar();
    await carregarUsuarios();
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
  }
}

// ================= INICIALIZAÇÃO =================
carregarJogadores();
carregarUsuarios();
