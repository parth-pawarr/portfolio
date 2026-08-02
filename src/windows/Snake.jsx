import { useEffect, useRef, useState } from "react";
import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";

const GRID_SIZE = 16;
const INITIAL_SNAKE = [
  { x: 7, y: 7 },
  { x: 6, y: 7 },
  { x: 5, y: 7 },
];
const DIRECTION_MAP = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const getRandomFood = (snake) => {
  let nextFood = null;

  while (!nextFood) {
    const candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };

    const isOnSnake = snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y);
    if (!isOnSnake) {
      nextFood = candidate;
    }
  }

  return nextFood;
};

const Snake = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(() => getRandomFood(INITIAL_SNAKE));
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const directionRef = useRef(direction);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const nextDirection = DIRECTION_MAP[event.key];
      if (!nextDirection) return;

      event.preventDefault();
      const isOpposite =
        nextDirection.x === -directionRef.current.x && nextDirection.y === -directionRef.current.y;

      if (!isOpposite) {
        setDirection(nextDirection);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameOver) return undefined;

    const timer = window.setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const nextHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        const hitsWall =
          nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE;
        const hitsSelf = prevSnake.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
        );

        if (hitsWall || hitsSelf) {
          setGameOver(true);
          return prevSnake;
        }

        const nextSnake = [nextHead, ...prevSnake];
        if (nextHead.x === food.x && nextHead.y === food.y) {
          setScore((currentScore) => currentScore + 10);
          setFood(getRandomFood(nextSnake));
          return nextSnake;
        }

        return nextSnake.slice(0, -1);
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [food, gameOver]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFood(INITIAL_SNAKE));
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    directionRef.current = { x: 1, y: 0 };
  };

  const moveSnake = (nextDirection) => {
    if (gameOver) return;
    const isOpposite =
      nextDirection.x === -directionRef.current.x && nextDirection.y === -directionRef.current.y;
    if (!isOpposite) {
      setDirection(nextDirection);
    }
  };

  return (
    <>
      <div id="window-header">
        <WindowControls target="snake" />
        <h2>Dev Snake</h2>
      </div>

      <div className="space-y-4 p-4 text-slate-800">
        <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-slate-100">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
            <p className="text-xl font-semibold">{score}</p>
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200"
          >
            Restart
          </button>
        </div>

        <div className="grid grid-cols-16 gap-0.5 rounded-2xl border border-slate-300 bg-slate-950 p-2 shadow-inner">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={`${x}-${y}`}
                className={`aspect-square rounded-sm ${
                  isHead
                    ? "bg-emerald-400"
                    : isSnake
                      ? "bg-slate-700"
                      : isFood
                        ? "bg-rose-500"
                        : "bg-slate-100"
                }`}
              />
            );
          })}
        </div>

        {gameOver ? (
          <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600">
            Game over. Hit restart and chase another bug.
          </p>
        ) : (
          <p className="text-sm text-slate-600">Use the arrows or tap the D-pad to guide the snake.</p>
        )}

        <div className="flex justify-center gap-3">
          <button type="button" onClick={() => moveSnake({ x: 0, y: -1 })} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            ↑
          </button>
          <button type="button" onClick={() => moveSnake({ x: -1, y: 0 })} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            ←
          </button>
          <button type="button" onClick={() => moveSnake({ x: 1, y: 0 })} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            →
          </button>
          <button type="button" onClick={() => moveSnake({ x: 0, y: 1 })} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            ↓
          </button>
        </div>
      </div>
    </>
  );
};

const SnakeWindow = WindowWrapper(Snake, "snake");

export default SnakeWindow;
