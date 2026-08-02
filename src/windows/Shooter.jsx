import { useEffect, useMemo, useRef, useState } from "react";
import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";

const SHOOTER_WIDTH = 320;
const SHOOTER_HEIGHT = 220;
const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 20;
const BULLET_SPEED = 7;
const INVADER_SPEED = 1.2;

const createInvaders = () =>
  Array.from({ length: 6 }, (_, index) => ({
    id: index,
    x: 20 + index * 48,
    y: 18,
    alive: true,
    kind: index % 3 === 0 ? "404" : index % 3 === 1 ? "ERR" : "LOOP",
  }));

const Shooter = () => {
  const [playerX, setPlayerX] = useState(SHOOTER_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [bullets, setBullets] = useState([]);
  const [invaders, setInvaders] = useState(createInvaders);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef(null);
  const keysRef = useRef({ ArrowLeft: false, ArrowRight: false });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        keysRef.current.ArrowLeft = true;
      }
      if (event.key === "ArrowRight") {
        keysRef.current.ArrowRight = true;
      }
      if (event.key === " ") {
        event.preventDefault();
        setBullets((currentBullets) => [
          ...currentBullets,
          { x: playerX + PLAYER_WIDTH / 2 - 2, y: SHOOTER_HEIGHT - 36 },
        ]);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "ArrowLeft") keysRef.current.ArrowLeft = false;
      if (event.key === "ArrowRight") keysRef.current.ArrowRight = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playerX]);

  useEffect(() => {
    if (gameOver) return undefined;

    const tick = () => {
      setPlayerX((currentX) => {
        let nextX = currentX;
        if (keysRef.current.ArrowLeft) nextX -= 5;
        if (keysRef.current.ArrowRight) nextX += 5;
        return Math.max(0, Math.min(SHOOTER_WIDTH - PLAYER_WIDTH, nextX));
      });

      setBullets((currentBullets) => {
        const movedBullets = currentBullets
          .map((bullet) => ({ ...bullet, y: bullet.y - BULLET_SPEED }))
          .filter((bullet) => bullet.y > -10);

        setInvaders((currentInvaders) => {
          const survivingInvaders = currentInvaders.filter((invader) => invader.alive);
          const hitIndices = new Set();

          movedBullets.forEach((bullet) => {
            survivingInvaders.forEach((invader, index) => {
              if (
                !hitIndices.has(index) &&
                bullet.x >= invader.x &&
                bullet.x <= invader.x + 24 &&
                bullet.y >= invader.y &&
                bullet.y <= invader.y + 24
              ) {
                hitIndices.add(index);
              }
            });
          });

          const nextInvaders = survivingInvaders.map((invader, index) => {
            if (hitIndices.has(index)) {
              return { ...invader, alive: false };
            }
            return { ...invader, x: invader.x + INVADER_SPEED, y: invader.y };
          });

          const aliveCount = nextInvaders.filter((invader) => invader.alive).length;
          if (aliveCount === 0) {
            setScore((currentScore) => currentScore + 100);
            setInvaders(createInvaders());
            return createInvaders();
          }

          if (nextInvaders.some((invader) => invader.alive && invader.x > SHOOTER_WIDTH - 40)) {
            setGameOver(true);
          }

          return nextInvaders;
        });

        return movedBullets;
      });

      setScore((currentScore) => currentScore + 0);
    };

    animationRef.current = window.setInterval(tick, 20);
    return () => window.clearInterval(animationRef.current);
  }, [gameOver]);

  const fire = () => {
    if (gameOver) return;
    setBullets((currentBullets) => [
      ...currentBullets,
      { x: playerX + PLAYER_WIDTH / 2 - 2, y: SHOOTER_HEIGHT - 36 },
    ]);
  };

  const resetGame = () => {
    setPlayerX(SHOOTER_WIDTH / 2 - PLAYER_WIDTH / 2);
    setBullets([]);
    setInvaders(createInvaders());
    setScore(0);
    setGameOver(false);
  };

  const activeInvaders = useMemo(() => invaders.filter((invader) => invader.alive), [invaders]);

  return (
    <>
      <div id="window-header">
        <WindowControls target="shooter" />
        <h2>Bug Shooter</h2>
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

        <div className="rounded-2xl border border-slate-300 bg-slate-950 p-2 shadow-inner">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-slate-800 to-black" style={{ width: SHOOTER_WIDTH, height: SHOOTER_HEIGHT }}>
            <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_60%)]" />
            {activeInvaders.map((invader) => (
              <div
                key={invader.id}
                className="absolute flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/60 bg-rose-500/80 text-[9px] font-semibold text-white"
                style={{ left: invader.x, top: invader.y }}
              >
                {invader.kind}
              </div>
            ))}
            {bullets.map((bullet, index) => (
              <div key={`${bullet.x}-${bullet.y}-${index}`} className="absolute h-2 w-2 rounded-full bg-cyan-300" style={{ left: bullet.x, top: bullet.y }} />
            ))}
            <div className="absolute bottom-4 left-1/2 h-5 w-9 -translate-x-1/2 rounded-full bg-emerald-400/80" style={{ left: playerX + 8 }} />
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button type="button" onClick={() => keysRef.current.ArrowLeft = true} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            ◀
          </button>
          <button type="button" onClick={fire} className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white">
            Fire
          </button>
          <button type="button" onClick={() => keysRef.current.ArrowRight = true} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            ▶
          </button>
        </div>

        {gameOver ? (
          <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600">
            The swarm got through. Restart and patch the bugs.
          </p>
        ) : (
          <p className="text-sm text-slate-600">Use the arrow keys or tap the controls to blast the error invaders.</p>
        )}
      </div>
    </>
  );
};

const ShooterWindow = WindowWrapper(Shooter, "shooter");

export default ShooterWindow;
