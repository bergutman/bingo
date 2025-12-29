// Parse YAML (simple parser for our specific format)
function parseSimpleYAML(yamlText) {
  const lines = yamlText.split("\n");
  const result = { people: {} };
  let currentPerson = null;
  let inItems = false;
  let currentItem = null;

  for (let line of lines) {
    const originalLine = line;
    line = line.trim();

    // Skip comments and empty lines
    if (line.startsWith("#") || line === "") continue;

    // People section
    if (line === "people:") continue;

    // Person name (e.g., "Dad:") - must be at 2-space indent
    if (
      originalLine.startsWith("  ") &&
      !originalLine.startsWith("    ") &&
      line.match(/^[A-Za-z]+:$/)
    ) {
      currentPerson = line.slice(0, -1);
      result.people[currentPerson] = { items: [] };
      inItems = false;
      continue;
    }

    // Items list start - must be at 4-space indent under a person
    if (
      originalLine.startsWith("    ") &&
      !originalLine.startsWith("      ") &&
      line === "items:"
    ) {
      inItems = true;
      continue;
    }

    // Item entry - must be at 6-space indent
    if (originalLine.startsWith("      - text:")) {
      // Extract the text value by finding the first and last quotes
      const firstQuote = line.indexOf('"');
      const lastQuote = line.lastIndexOf('"');
      if (firstQuote !== -1 && lastQuote !== -1 && firstQuote !== lastQuote) {
        let text = line.substring(firstQuote + 1, lastQuote);
        // Convert \" to " (escaped quotes to actual quotes)
        text = text.replace(/\\"/g, '"').replace(/\\\"/g, '"');
        currentItem = { text: text, marked: false };
        result.people[currentPerson].items.push(currentItem);
      }
      continue;
    }

    // Marked status - must be at 8-space indent
    if (originalLine.startsWith("        marked:")) {
      if (currentItem) {
        const markedValue = line.split(":")[1].trim();
        if (markedValue === "true") {
          currentItem.marked = true;
        } else if (markedValue === "false") {
          currentItem.marked = false;
        } else {
          currentItem.marked = null;
        }
      }
      currentItem = null; // Reset after processing marked
    }
  }

  return result;
}

// Convert data back to YAML
function toYAML(data) {
  let yaml = "# Bingo cards configuration for 2026\n";
  yaml += "# Mark items as complete with: true, incomplete with: false\n\n";
  yaml += "people:\n";

  for (const [person, personData] of Object.entries(data.people)) {
    yaml += `  ${person}:\n`;
    yaml += "    items:\n";

    for (const item of personData.items) {
      yaml += `      - text: "${item.text}"\n`;
      const markedValue =
        item.marked === true
          ? "true"
          : item.marked === false
            ? "false"
            : "null";
      yaml += `        marked: ${markedValue}\n`;
    }
    yaml += "\n";
  }

  return yaml;
}

// Load and parse YAML file
async function loadBingoData() {
  try {
    const response = await fetch("bingo.yaml");
    const yamlText = await response.text();
    return parseSimpleYAML(yamlText);
  } catch (error) {
    console.error("Error loading bingo data:", error);
    return { people: {} };
  }
}

// Save data (this will download a file since we can't write directly)
function saveBingoData(data) {
  const yaml = toYAML(data);
  const blob = new Blob([yaml], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bingo.yaml";
  a.click();
  URL.revokeObjectURL(url);
}

// Render bingo card
function renderBingoCard(person, data) {
  const card = document.getElementById("bingo-card");
  card.innerHTML = "";
  card.classList.add("active");

  if (!data.people[person]) {
    card.innerHTML =
      '<div class="empty-message">No bingo card found for this person</div>';
    return;
  }

  const items = data.people[person].items;
  console.log(`${person} has ${items.length} items`);

  if (items.length !== 25) {
    card.innerHTML = `<div class="empty-message">Bingo card must have exactly 25 items (found ${items.length})</div>`;
    return;
  }

  items.forEach((item, index) => {
    const cell = document.createElement("div");
    cell.className = "bingo-cell";
    if (item.marked === true) {
      cell.classList.add("marked");
    }
    if (item.marked === false) {
      cell.classList.add("disqualified");
    }
    if (index === 12) {
      cell.classList.add("free-space");
    }

    const textSpan = document.createElement("span");
    textSpan.className = "bingo-cell-text";
    textSpan.textContent = item.text;
    cell.appendChild(textSpan);

    cell.dataset.index = index;

    cell.addEventListener("click", () => toggleCell(index, person, data));
    card.appendChild(cell);
  });

  // Check for bingo
  if (checkForBingo(items)) {
    triggerConfetti();
  }
}

// Check if there's a bingo (5 in a row horizontally, vertically, or diagonally)
function checkForBingo(items) {
  const grid = [];
  for (let i = 0; i < 25; i++) {
    grid.push(items[i].marked === true);
  }

  // Check rows
  for (let row = 0; row < 5; row++) {
    if (grid.slice(row * 5, row * 5 + 5).every((marked) => marked)) {
      return true;
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    let columnMarked = true;
    for (let row = 0; row < 5; row++) {
      if (!grid[row * 5 + col]) {
        columnMarked = false;
        break;
      }
    }
    if (columnMarked) return true;
  }

  // Check diagonals
  const diagonal1 = [0, 6, 12, 18, 24];
  const diagonal2 = [4, 10, 16, 22, 20];

  if (diagonal1.every((index) => grid[index])) return true;
  if (diagonal2.every((index) => grid[index])) return true;

  return false;
}

// Trigger confetti celebration
function triggerConfetti() {
  // Remove any existing confetti
  const existingConfetti = document.querySelector(".confetti-container");
  if (existingConfetti) {
    existingConfetti.remove();
  }

  const existingWinText = document.querySelector(".win-text");
  if (existingWinText) {
    existingWinText.remove();
  }

  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  // Add "YOU WIN!!!" text
  const winText = document.createElement("div");
  winText.className = "win-text";
  winText.textContent = "YOU WIN!!!";
  document.body.appendChild(winText);

  // Create confetti pieces
  const colors = [
    "#ff6b6b",
    "#ffd700",
    "#4ade80",
    "#667eea",
    "#ff69b4",
    "#00bcd4",
  ];

  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.animationDelay = Math.random() * 5 + "s";
    confetti.style.animationDuration = Math.random() * 2 + 3 + "s";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.setProperty("--random-x", Math.random());

    // Random shape
    const shapes = ["circle", "square", "rectangle"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    confetti.classList.add(shape);

    container.appendChild(confetti);
  }
}

// Toggle cell marked status
function toggleCell(index, person, data) {
  const item = data.people[person].items[index];

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "bingo-overlay";

  overlay.innerHTML = `
    <div class="bingo-modal">
      <h2>${item.text}</h2>
      <div class="modal-buttons">
        <button class="modal-btn close-btn">Dismiss</button>
      </div>
    </div>
  `;

  // Close button handler
  overlay.querySelector(".close-btn").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      document.body.removeChild(overlay);
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  document.body.appendChild(overlay);
}

// Initialize
async function init() {
  const data = await loadBingoData();
  const select = document.getElementById("person-select");

  // Populate dropdown
  for (const person of Object.keys(data.people)) {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    select.appendChild(option);
  }

  // Handle person selection
  select.addEventListener("change", (e) => {
    if (e.target.value) {
      renderBingoCard(e.target.value, data);
    } else {
      const card = document.getElementById("bingo-card");
      card.innerHTML = "";
      card.classList.remove("active");
    }
  });
}

// Start the app
init();
