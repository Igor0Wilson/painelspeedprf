document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const table = document.getElementById("userTable");
  const rows = table.getElementsByTagName("tr");

  searchInput.addEventListener("input", function () {
    const filter = this.value.toLowerCase();

    // Ignorar o cabeçalho
    for (let i = 1; i < rows.length; i++) {
      const firstCell = rows[i].getElementsByTagName("td")[0];
      if (firstCell) {
        const txtValue = firstCell.textContent || firstCell.innerText;
        rows[i].style.display = txtValue.toLowerCase().includes(filter)
          ? ""
          : "none";
      }
    }
  });
});
