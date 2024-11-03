const grid = document.querySelector(".grid");
const startButton = document.getElementById("start-button");
const container = document.querySelector(".container");
const coverScreen = document.querySelector(".cover-screen");
const result = document.getElementById("result");
const overText = document.getElementById("over-text");
const newGameButton = document.getElementById("new-game-button");

let matrix, score, bestScore = 0;
let rows = 4, columns = 4;
let undoCount = 0, swapCount = 0, deleteCount = 0;
let undoUsed = 0, swapUsed = 0, deleteUsed = 0; // Track total uses for summary
let moveCount = 0; // Track the number of moves
let history = [];
let selectedTile = null;

const createGrid = () => {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const boxDiv = document.createElement("div");
      boxDiv.classList.add("box");
      boxDiv.setAttribute("data-position", `${i}_${j}`);
      grid.appendChild(boxDiv);
    }
  }
};

const randomPosition = () => Math.floor(Math.random() * rows);

const generateTile = (value) => {
  if (hasEmptyBox()) {
    let row = randomPosition();
    let col = randomPosition();
    if (matrix[row][col] === 0) {
      matrix[row][col] = value;
      const tile = document.querySelector(`[data-position="${row}_${col}"]`);
      tile.innerHTML = value;
      tile.classList.add(`box-${value}`);
    } else {
      generateTile(value);
    }
  } else {
    checkGameOver();
  }
};

const hasEmptyBox = () => matrix.some(row => row.includes(0));

const slide = (arr) => {
  let newArr = arr.filter(num => num);
  for (let i = 0; i < newArr.length - 1; i++) {
    if (newArr[i] === newArr[i + 1]) {
      newArr[i] *= 2;
      newArr[i + 1] = 0;
      score += newArr[i];
      checkUnlocks(newArr[i]);
    }
  }
  newArr = newArr.filter(num => num);
  return newArr.concat(Array(4 - newArr.length).fill(0));
};

const updateGrid = () => {
  grid.querySelectorAll(".box").forEach(tile => {
    tile.innerHTML = "";
    tile.className = "box";
  });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const value = matrix[r][c];
      const tile = document.querySelector(`[data-position="${r}_${c}"]`);
      if (value) {
        tile.innerHTML = value;
        tile.classList.add(`box-${value}`);
      }
    }
  }
};

const saveHistory = () => {
  history.push({ matrix: JSON.parse(JSON.stringify(matrix)), score });
  if (history.length > 10) history.shift(); // Limit history to 10 moves
};

const handleSlide = (direction) => {
  saveHistory();
  let isChanged = false;
  for (let r = 0; r < rows; r++) {
    let arr;
    if (direction === "left" || direction === "right") {
      arr = matrix[r];
      arr = direction === "right" ? slide(arr.reverse()).reverse() : slide(arr);
    } else {
      arr = matrix.map(row => row[r]);
      arr = direction === "down" ? slide(arr.reverse()).reverse() : slide(arr);
    }
    if (direction === "left" || direction === "right") {
      if (!matrix[r].every((v, i) => v === arr[i])) isChanged = true;
      matrix[r] = arr;
    } else {
      if (!matrix.every((row, i) => row[r] === arr[i])) isChanged = true;
      matrix.forEach((row, i) => row[r] = arr[i]);
    }
  }
  if (isChanged) {
    Math.random() > 0.5 ? generateTile(2) : generateTile(4);
    moveCount++;
    updateGrid();
    document.getElementById("score").innerText = score;
  }
  updateActionButtons();
};

const handleUndo = () => {
  if (undoCount > 0 && history.length > 0) {
    const previousState = history.pop();
    matrix = JSON.parse(JSON.stringify(previousState.matrix));
    score = previousState.score;
    updateGrid();
    document.getElementById("score").innerText = score;
    undoCount--;
    undoUsed++;
  }
  updateActionButtons();
};

const startSwap = () => {
  if (swapCount > 0) {
    alert("Select two tiles to swap.");
    grid.addEventListener("click", selectSwapTile);
  }
};

const selectSwapTile = (e) => {
  const tile = e.target;
  const pos = tile.getAttribute("data-position");
  if (pos && swapCount > 0) {
    const [row, col] = pos.split("_").map(Number);
    if (!selectedTile) {
      selectedTile = { row, col };
    } else {
      swapTiles(row, col);
      swapCount--;
      swapUsed++;
      selectedTile = null;
      updateGrid();
      updateActionButtons();
      grid.removeEventListener("click", selectSwapTile);
    }
  }
};

const swapTiles = (row, col) => {
  const temp = matrix[row][col];
  matrix[row][col] = matrix[selectedTile.row][selectedTile.col];
  matrix[selectedTile.row][selectedTile.col] = temp;
};

const startDelete = () => {
  if (deleteCount > 0) {
    alert("Select a tile to clear all instances of its value.");
    grid.addEventListener("click", deleteTiles);
  }
};

const deleteTiles = (e) => {
  const tile = e.target;
  const pos = tile.getAttribute("data-position");
  if (pos && deleteCount > 0) {
    const [row, col] = pos.split("_").map(Number);
    const valueToDelete = matrix[row][col];
    if (valueToDelete > 0) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          if (matrix[r][c] === valueToDelete) {
            matrix[r][c] = 0;
          }
        }
      }
      deleteCount--;
      deleteUsed++;
      updateGrid();
      updateActionButtons();
    }
    grid.removeEventListener("click", deleteTiles);
  }
};

const updateActionButtons = () => {
  document.getElementById("undo-count").innerText = undoCount;
  document.getElementById("swap-count").innerText = swapCount;
  document.getElementById("delete-count").innerText = deleteCount;

  document.getElementById("undo-button").disabled = undoCount <= 0;
  document.getElementById("swap-button").disabled = swapCount <= 0;
  document.getElementById("delete-button").disabled = deleteCount <= 0;
};

const checkUnlocks = (createdValue) => {
  if (createdValue === 128 && undoCount < 2) undoCount++;
  if (createdValue === 256 && swapCount < 2) swapCount++;
  if (createdValue === 512 && deleteCount < 2) deleteCount++;
  updateActionButtons();
};

const showGameOverScreen = () => {
  if (score > bestScore) {
    bestScore = score;
  }
  document.getElementById("best-score").innerText = bestScore;

  container.classList.add("hide");
  coverScreen.classList.remove("hide");
  overText.classList.add("game-over-heading");
  overText.innerHTML = `
    <h1>GAME OVER</h1>
    <p>You made ${moveCount} moves</p>
    <p>Powerups used:</p>
    <div class="powerup-summary">
      <span>Undo (${undoUsed})</span>
      <span>Swap (${swapUsed})</span>
      <span>Delete (${deleteUsed})</span>
    </div>
  `;

  const undoButton = document.createElement("button");
  undoButton.innerText = `Undo (${undoCount} left)`;
  undoButton.classList.add("game-over-button");
  undoButton.disabled = undoCount <= 0;
  undoButton.onclick = () => {
    if (undoCount > 0 && history.length > 0) {
      const previousState = history.pop();
      matrix = JSON.parse(JSON.stringify(previousState.matrix));
      score = previousState.score;
      updateGrid();
      document.getElementById("score").innerText = score;
      undoCount--;
      undoUsed++;
      coverScreen.classList.add("hide");
      container.classList.remove("hide");
      updateActionButtons();
    }
  };

  const playAgainButton = document.createElement("button");
  playAgainButton.innerText = "Play Again";
  playAgainButton.classList.add("game-over-button");
  playAgainButton.onclick = startGame;

  result.innerHTML = "";
  result.appendChild(playAgainButton);
  if (undoCount > 0) result.appendChild(undoButton);
};

document.addEventListener("keyup", (e) => {
  if (e.key.includes("Arrow")) {
    e.key === "ArrowLeft" && handleSlide("left");
    e.key === "ArrowRight" && handleSlide("right");
    e.key === "ArrowUp" && handleSlide("up");
    e.key === "ArrowDown" && handleSlide("down");
  }
});

const checkGameOver = () => {
  if (!hasEmptyBox()) {
    showGameOverScreen();
  }
};

const startGame = () => {
  score = 0;
  moveCount = 0;
  undoUsed = 0;
  swapUsed = 0;
  deleteUsed = 0;
  document.getElementById("score").innerText = score;
  matrix = Array(rows).fill().map(() => Array(columns).fill(0));
  grid.innerHTML = "";
  container.classList.remove("hide");
  coverScreen.classList.add("hide");
  createGrid();
  generateTile(2);
  generateTile(2);
  undoCount = 0;
  swapCount = 0;
  deleteCount = 0;
  history = [];
  updateActionButtons();
};

newGameButton.addEventListener("click", startGame);
startButton.addEventListener("click", startGame);
