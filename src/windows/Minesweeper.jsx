import { useMemo, useState } from "react";
import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";

const BOARD_SIZE = 8;
const DIFFICULTIES = {
  easy: { mines: 8 },
  medium: { mines: 12 },
};

const createBoard = (difficulty = "easy") => {
  const { mines } = DIFFICULTIES[difficulty];
  const board = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  }));

  for (let index = 0; index < mines; index += 1) {
    let randomIndex = Math.floor(Math.random() * board.length);
    while (board[randomIndex].mine) {
      randomIndex = Math.floor(Math.random() * board.length);
    }
    board[randomIndex].mine = true;
  }

  board.forEach((cell, index) => {
    if (cell.mine) return;
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    let count = 0;

    for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
        if (deltaRow === 0 && deltaCol === 0) continue;
        const neighborRow = row + deltaRow;
        const neighborCol = col + deltaCol;
        if (neighborRow >= 0 && neighborRow < BOARD_SIZE && neighborCol >= 0 && neighborCol < BOARD_SIZE) {
          const neighborIndex = neighborRow * BOARD_SIZE + neighborCol;
          if (board[neighborIndex].mine) count += 1;
        }
      }
    }
    cell.adjacent = count;
  });

  return board;
};

const Minesweeper = () => {
  const [difficulty, setDifficulty] = useState("easy");
  const [board, setBoard] = useState(() => createBoard("easy"));
  const [status, setStatus] = useState("Ready");
  const [won, setWon] = useState(false);

  const resetGame = (nextDifficulty = difficulty) => {
    setDifficulty(nextDifficulty);
    setBoard(createBoard(nextDifficulty));
    setStatus("Ready");
    setWon(false);
  };

  const revealCell = (index) => {
    if (won) return;
    const nextBoard = [...board];
    const cell = nextBoard[index];
    if (cell.revealed || cell.flagged) return;

    if (cell.mine) {
      nextBoard[index].revealed = true;
      setBoard(nextBoard);
      setStatus("Boom! A bug exploded.");
      return;
    }

    const floodFill = (currentIndex) => {
      const currentCell = nextBoard[currentIndex];
      if (!currentCell || currentCell.revealed || currentCell.flagged) return;
      nextBoard[currentIndex].revealed = true;
      if (currentCell.adjacent > 0) return;

      const row = Math.floor(currentIndex / BOARD_SIZE);
      const col = currentIndex % BOARD_SIZE;
      for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
          if (deltaRow === 0 && deltaCol === 0) continue;
          const neighborRow = row + deltaRow;
          const neighborCol = col + deltaCol;
          if (neighborRow >= 0 && neighborRow < BOARD_SIZE && neighborCol >= 0 && neighborCol < BOARD_SIZE) {
            const neighborIndex = neighborRow * BOARD_SIZE + neighborCol;
            floodFill(neighborIndex);
          }
        }
      }
    };

    floodFill(index);
    setBoard(nextBoard);

    const safeCellsRemaining = nextBoard.filter((cell) => !cell.mine && !cell.revealed).length;
    if (safeCellsRemaining === 0) {
      setWon(true);
      setStatus("You cleared the codebase.");
    } else {
      setStatus("Scanning...");
    }
  };

  const toggleFlag = (index) => {
    if (won) return;
    const nextBoard = [...board];
    const cell = nextBoard[index];
    if (cell.revealed) return;
    nextBoard[index].flagged = !cell.flagged;
    setBoard(nextBoard);
  };

  const mineCount = useMemo(() => board.filter((cell) => cell.flagged).length, [board]);

  return (
    <>
      <div id="window-header">
        <WindowControls target="minesweeper" />
        <h2>Mac Minesweeper</h2>
      </div>

      <div className="space-y-4 p-4 text-slate-800">
        <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-slate-100">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
            <p className="text-sm font-semibold">{status}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => resetGame("easy")} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200">
              Easy
            </button>
            <button type="button" onClick={() => resetGame("medium")} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200">
              Medium
            </button>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1 rounded-2xl border border-slate-300 bg-slate-950 p-2 shadow-inner">
          {board.map((cell, index) => (
            <button
              key={`${index}-${cell.revealed}-${cell.flagged}`}
              type="button"
              onClick={() => revealCell(index)}
              onContextMenu={(event) => {
                event.preventDefault();
                toggleFlag(index);
              }}
              className={`aspect-square rounded-md text-sm font-semibold ${cell.revealed ? "bg-slate-200 text-slate-800" : "bg-slate-700 text-white"}`}
            >
              {cell.flagged ? "🚩" : cell.revealed && cell.mine ? "💣" : cell.revealed && cell.adjacent > 0 ? cell.adjacent : ""}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Flags: {mineCount}</span>
          <span>Long press or right-click to flag.</span>
        </div>
      </div>
    </>
  );
};

const MinesweeperWindow = WindowWrapper(Minesweeper, "minesweeper");

export default MinesweeperWindow;
