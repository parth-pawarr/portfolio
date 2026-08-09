import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ============================================================================
 * FLAPPY BIRD — single-file React implementation
 * ----------------------------------------------------------------------------
 * Everything (constants, pure helpers, sound manager, small presentational
 * components, and the main <App/>) lives in this one file, organized into
 * clearly separated sections so it stays easy to navigate and extend.
 * ========================================================================== */

/* ----------------------------------------------------------------------------
 * 1. CONFIGURATION CONSTANTS
 *    Every tunable number for the game lives here so behaviour can be
 *    adjusted without hunting through logic.
 * -------------------------------------------------------------------------- */

// Logical (unscaled) playfield size. The whole world is rendered at this
// resolution and then uniformly scaled with CSS transform to fit any screen,
// which is what makes the game responsive without any layout math elsewhere.
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

const GROUND_HEIGHT = 80; // height of the scrolling ground strip
const BIRD_SIZE = 34; // bird is rendered as a square (circle via border-radius)
const BIRD_X = 90; // bird's fixed horizontal position

const GRAVITY = 1800; // px/s^2, downward acceleration
const FLAP_VELOCITY = -480; // px/s, instantaneous upward velocity on flap
const MAX_FALL_VELOCITY = 900; // px/s, terminal velocity clamp

const BASE_PIPE_SPEED = 160; // px/s at score 0
const MAX_PIPE_SPEED = 280; // px/s speed cap as difficulty ramps up
const BASE_PIPE_GAP = 170; // px, vertical opening at score 0
const MIN_PIPE_GAP = 125; // px, smallest opening difficulty will shrink to
const PIPE_WIDTH = 68;
const PIPE_SPACING = 230; // horizontal distance between consecutive pipe pairs
const PIPE_EDGE_MARGIN = 60; // minimum gap from top/bottom of playfield

const COUNTDOWN_START = 3; // "3, 2, 1, GO!" before play begins
const COUNTDOWN_STEP_MS = 800;
const COUNTDOWN_GO_MS = 500;

const HIGH_SCORE_STORAGE_KEY = 'flappyBird.highScore';
const DARK_MODE_STORAGE_KEY = 'flappyBird.darkMode';

/* ----------------------------------------------------------------------------
 * 2. PURE HELPER FUNCTIONS
 *    Small, side-effect-free (aside from the storage helpers) functions that
 *    contain all the game's math. Keeping these pure makes the game loop
 *    easy to read and easy to unit test in isolation.
 * -------------------------------------------------------------------------- */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const randomRange = (min, max) => Math.random() * (max - min) + min;

/** Scales pipe speed & gap size based on the current score, so the game
 *  gradually gets harder the longer the player survives. */
function getDifficultySettings(score) {
    const speed = clamp(BASE_PIPE_SPEED + score * 4, BASE_PIPE_SPEED, MAX_PIPE_SPEED);
    const gap = clamp(BASE_PIPE_GAP - score * 1.5, MIN_PIPE_GAP, BASE_PIPE_GAP);
    return { speed, gap };
}

/** Creates a new pipe pair just off the right edge of the screen with a
 *  randomly positioned gap. */
function createPipe(gapSize) {
    const gapCenter = randomRange(
        PIPE_EDGE_MARGIN + gapSize / 2,
        GAME_HEIGHT - GROUND_HEIGHT - PIPE_EDGE_MARGIN - gapSize / 2
    );
    return {
        id: `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: GAME_WIDTH,
        gapCenter,
        gapSize,
        passed: false,
    };
}

/** Advances the bird's vertical physics by one time step (dt, in seconds). */
function updateBirdPhysics(bird, dt) {
    const velocity = clamp(bird.velocity + GRAVITY * dt, FLAP_VELOCITY, MAX_FALL_VELOCITY);
    const y = bird.y + velocity * dt;
    // Map velocity to a nose-up/nose-down rotation for a bit of visual life.
    const rotation = clamp(velocity / 10, -25, 90);
    return { y, velocity, rotation };
}

/** Moves every pipe left by (speed * dt) and drops any that scrolled off screen. */
function updatePipes(pipes, dt, speed) {
    return pipes
        .map((pipe) => ({ ...pipe, x: pipe.x - speed * dt }))
        .filter((pipe) => pipe.x + PIPE_WIDTH > -20);
}

/** Axis-aligned bounding-box collision between the bird, the ground/ceiling,
 *  and every pipe currently on screen. A small inset on the bird's hitbox
 *  keeps collisions feeling fair rather than pixel-perfect-punishing. */
function checkCollision(bird, pipes) {
    if (bird.y <= 0) return true; // hit the ceiling
    if (bird.y + BIRD_SIZE >= GAME_HEIGHT - GROUND_HEIGHT) return true; // hit the ground

    const hitboxInset = 4;
    const birdLeft = BIRD_X + hitboxInset;
    const birdRight = BIRD_X + BIRD_SIZE - hitboxInset;
    const birdTop = bird.y + hitboxInset;
    const birdBottom = bird.y + BIRD_SIZE - hitboxInset;

    return pipes.some((pipe) => {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;
        const overlapsHorizontally = birdRight > pipeLeft && birdLeft < pipeRight;
        if (!overlapsHorizontally) return false;

        const gapTop = pipe.gapCenter - pipe.gapSize / 2;
        const gapBottom = pipe.gapCenter + pipe.gapSize / 2;
        return birdTop < gapTop || birdBottom > gapBottom;
    });
}

/** Fresh bird/pipes/score state used whenever a new run begins. */
function createInitialGameData() {
    return {
        bird: { y: GAME_HEIGHT / 2 - BIRD_SIZE / 2, velocity: 0, rotation: 0 },
        pipes: [],
        score: 0,
    };
}

// --- localStorage persistence helpers (wrapped defensively for privacy modes) ---

function loadHighScore() {
    try {
        const stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
        return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
        return 0;
    }
}

function saveHighScore(score) {
    try {
        window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
    } catch {
        /* localStorage unavailable — fail silently, score just won't persist */
    }
}

function loadDarkModePreference() {
    try {
        return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function saveDarkModePreference(isDark) {
    try {
        window.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDark));
    } catch {
        /* ignore */
    }
}

/* ----------------------------------------------------------------------------
 * 3. SOUND MANAGER (placeholder synth effects)
 *    No external audio files are used — a tiny WebAudio beep generator
 *    stands in for real sound assets. Swap `beep(...)` calls for
 *    `new Audio('/sounds/x.mp3').play()` to use real files later.
 * -------------------------------------------------------------------------- */

function createSoundManager() {
    let audioContext = null;

    const getContext = () => {
        if (!audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioContext = new AudioContextClass();
        }
        return audioContext;
    };

    const beep = (frequency, duration, type = 'sine', volume = 0.12) => {
        const ctx = getContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    };

    return {
        flap: () => beep(520, 0.09, 'square', 0.08),
        score: () => beep(880, 0.12, 'sine', 0.1),
        hit: () => beep(140, 0.35, 'sawtooth', 0.15),
    };
}

/* ----------------------------------------------------------------------------
 * 4. PRESENTATIONAL COMPONENTS
 *    Small, focused components. Each only receives the props it needs so
 *    React can skip re-rendering siblings that haven't changed.
 * -------------------------------------------------------------------------- */

function Bird({ y, rotation }) {
    return (
        <div
            className="fb-bird"
            style={{ top: y, left: BIRD_X, width: BIRD_SIZE, height: BIRD_SIZE, transform: `rotate(${rotation}deg)` }}
        >
            <div className="fb-bird-wing" />
            <div className="fb-bird-eye" />
            <div className="fb-bird-beak" />
        </div>
    );
}

function PipePair({ x, gapCenter, gapSize }) {
    const topHeight = gapCenter - gapSize / 2;
    const bottomTop = gapCenter + gapSize / 2;
    const bottomHeight = GAME_HEIGHT - GROUND_HEIGHT - bottomTop;

    return (
        <>
            <div className="fb-pipe fb-pipe-top" style={{ left: x, width: PIPE_WIDTH, height: topHeight }}>
                <div className="fb-pipe-cap" />
            </div>
            <div
                className="fb-pipe fb-pipe-bottom"
                style={{ left: x, width: PIPE_WIDTH, top: bottomTop, height: bottomHeight }}
            >
                <div className="fb-pipe-cap" />
            </div>
        </>
    );
}

function Ground({ speed }) {
    // Faster pipe speed => faster ground scroll, for a consistent sense of motion.
    const scrollDurationSeconds = 900 / speed;
    return (
        <div className="fb-ground" style={{ height: GROUND_HEIGHT }}>
            <div className="fb-ground-pattern" style={{ animationDuration: `${scrollDurationSeconds}s` }} />
        </div>
    );
}

function ScoreBoard({ score }) {
    return <div className="fb-score">{score}</div>;
}

function StartScreen({ highScore, onStart }) {
    return (
        <div className="fb-overlay fb-start-screen">
            <h1 className="fb-title">Flappy Bird</h1>
            <div className="fb-bird-preview" />
            <p className="fb-instructions">
                Tap, click, or press <strong>Space</strong> to flap
            </p>
            <p className="fb-instructions-secondary">Press <strong>P</strong> to pause mid-game</p>
            <button className="fb-button" onPointerDown={(e) => e.stopPropagation()} onClick={onStart}>
                Start Game
            </button>
            <p className="fb-highscore-label">Best: {highScore}</p>
        </div>
    );
}

function CountdownOverlay({ value }) {
    return (
        <div className="fb-overlay fb-countdown-screen">
            <div className="fb-countdown-number" key={value}>
                {value > 0 ? value : 'GO!'}
            </div>
        </div>
    );
}

function PauseOverlay({ onResume }) {
    return (
        <div className="fb-overlay fb-pause-screen">
            <h2 className="fb-title-small">Paused</h2>
            <p className="fb-instructions">
                Press <strong>P</strong> or tap Resume to continue
            </p>
            <button className="fb-button" onPointerDown={(e) => e.stopPropagation()} onClick={onResume}>
                Resume
            </button>
        </div>
    );
}

function GameOverScreen({ score, highScore, isNewHighScore, onRestart }) {
    return (
        <div className="fb-overlay fb-gameover-screen">
            <h2 className="fb-title-small">Game Over</h2>
            {isNewHighScore && <p className="fb-new-best">New Best!</p>}
            <div className="fb-final-score">
                <div>
                    <span className="fb-stat-label">Score</span>
                    <span className="fb-stat-value">{score}</span>
                </div>
                <div>
                    <span className="fb-stat-label">Best</span>
                    <span className="fb-stat-value">{highScore}</span>
                </div>
            </div>
            <button className="fb-button" onPointerDown={(e) => e.stopPropagation()} onClick={onRestart}>
                Play Again
            </button>
        </div>
    );
}

function DarkModeToggle({ isDarkMode, onToggle }) {
    return (
        <button className="fb-darkmode-toggle" onClick={onToggle} aria-label="Toggle dark mode" title="Toggle dark mode">
            {isDarkMode ? '☀️' : '🌙'}
        </button>
    );
}

/* ----------------------------------------------------------------------------
 * 5. MAIN APP COMPONENT
 * -------------------------------------------------------------------------- */

export default function App({ isFocused = true }) {
    // 'start' | 'countdown' | 'playing' | 'paused' | 'gameover'
    const [status, setStatus] = useState('start');
    const [gameData, setGameData] = useState(createInitialGameData);
    const [highScore, setHighScore] = useState(loadHighScore);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);
    const [isDarkMode, setIsDarkMode] = useState(loadDarkModePreference);
    const [scale, setScale] = useState(1);

    // Refs used by the animation-frame loop so it always reads the latest
    // values without needing to restart on every state change (which keeps
    // re-renders down to roughly one per frame, and none at all while idle).
    const statusRef = useRef(status);
    const gameDataRef = useRef(gameData);
    const rafId = useRef(null);
    const lastFrameTime = useRef(null);
    const soundManager = useRef(null);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        gameDataRef.current = gameData;
    }, [gameData]);

    // --- One-time setup: create the sound manager ---
    useEffect(() => {
        soundManager.current = createSoundManager();
    }, []);

    // --- Responsive scaling: keep the fixed-resolution playfield fitted to
    //     whatever viewport it's shown in, on both desktop and mobile. ---
    useEffect(() => {
        const recomputeScale = () => {
            const maxWidth = Math.min(window.innerWidth * 0.94, 480);
            const maxHeight = window.innerHeight * 0.88;
            const nextScale = Math.min(maxWidth / GAME_WIDTH, maxHeight / GAME_HEIGHT, 1.3);
            setScale(nextScale > 0 ? nextScale : 1);
        };
        recomputeScale();
        window.addEventListener('resize', recomputeScale);
        return () => window.removeEventListener('resize', recomputeScale);
    }, []);

    // --- Start a fresh run: reset state and kick off the countdown. ---
    const startCountdown = useCallback(() => {
        const fresh = createInitialGameData();
        gameDataRef.current = fresh;
        setGameData(fresh);
        setIsNewHighScore(false);
        setCountdownValue(COUNTDOWN_START);
        setStatus('countdown');
    }, []);

    // --- Countdown ticker (3, 2, 1, GO!) ---
    useEffect(() => {
        if (status !== 'countdown') return undefined;

        if (countdownValue <= 0) {
            const goTimeout = setTimeout(() => setStatus('playing'), COUNTDOWN_GO_MS);
            return () => clearTimeout(goTimeout);
        }

        const stepTimeout = setTimeout(() => setCountdownValue((v) => v - 1), COUNTDOWN_STEP_MS);
        return () => clearTimeout(stepTimeout);
    }, [status, countdownValue]);

    // --- Core game loop, driven by requestAnimationFrame. Only mounted while
    //     'playing', so it costs nothing during menus, pause, or game over. ---
    useEffect(() => {
        if (status !== 'playing') {
            lastFrameTime.current = null;
            return undefined;
        }

        const step = (timestamp) => {
            if (lastFrameTime.current == null) lastFrameTime.current = timestamp;
            const dt = Math.min((timestamp - lastFrameTime.current) / 1000, 0.032); // clamp to avoid huge jumps
            lastFrameTime.current = timestamp;

            const prev = gameDataRef.current;
            const { speed, gap } = getDifficultySettings(prev.score);

            const nextBird = updateBirdPhysics(prev.bird, dt);
            let nextPipes = updatePipes(prev.pipes, dt, speed);

            // Spawn a new pipe once the last one has scrolled in far enough.
            const lastPipe = nextPipes[nextPipes.length - 1];
            if (!lastPipe || GAME_WIDTH - lastPipe.x >= PIPE_SPACING) {
                nextPipes = [...nextPipes, createPipe(gap)];
            }

            // Award a point the moment the bird clears a pipe's right edge.
            let nextScore = prev.score;
            let scoredThisFrame = false;
            nextPipes = nextPipes.map((pipe) => {
                if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
                    nextScore += 1;
                    scoredThisFrame = true;
                    return { ...pipe, passed: true };
                }
                return pipe;
            });
            if (scoredThisFrame) soundManager.current?.score();

            const nextData = { bird: nextBird, pipes: nextPipes, score: nextScore };
            gameDataRef.current = nextData;
            setGameData(nextData);

            if (checkCollision(nextBird, nextPipes)) {
                soundManager.current?.hit();
                const beatHighScore = nextScore > highScore;
                if (beatHighScore) {
                    saveHighScore(nextScore);
                    setHighScore(nextScore);
                }
                setIsNewHighScore(beatHighScore);
                setStatus('gameover');
                return; // stop scheduling further frames — the run has ended
            }

            rafId.current = requestAnimationFrame(step);
        };

        rafId.current = requestAnimationFrame(step);
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [status, highScore]);

    // --- Input handlers ---

    const handleFlap = useCallback(() => {
        const current = statusRef.current;
        if (current === 'start' || current === 'gameover') {
            startCountdown();
            return;
        }
        if (current === 'playing') {
            soundManager.current?.flap();
            setGameData((prev) => {
                const next = { ...prev, bird: { ...prev.bird, velocity: FLAP_VELOCITY } };
                gameDataRef.current = next;
                return next;
            });
        }
    }, [startCountdown]);

    const togglePause = useCallback(() => {
        setStatus((current) => {
            if (current === 'playing') return 'paused';
            if (current === 'paused') return 'playing';
            return current;
        });
    }, []);

    const handleToggleDarkMode = useCallback((e) => {
        e.stopPropagation();
        setIsDarkMode((prev) => {
            const next = !prev;
            saveDarkModePreference(next);
            return next;
        });
    }, []);

    // Keyboard controls: Space to flap/start/restart, P to pause/resume.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (!isFocused) return;
            // Additional fallback: ignore if the active element is an input
            if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.code === 'Space') {
                e.preventDefault();
                handleFlap();
            } else if (e.code === 'KeyP') {
                togglePause();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleFlap, togglePause, isFocused]);

    const { speed: currentPipeSpeed } = getDifficultySettings(gameData.score);

    return (
        <div className={`fb-page ${isDarkMode ? 'fb-dark' : 'fb-light'}`}>
            <style>{GAME_STYLES}</style>

            <DarkModeToggle isDarkMode={isDarkMode} onToggle={handleToggleDarkMode} />

            <div
                className="fb-game-wrapper"
                style={{ width: GAME_WIDTH * scale, height: GAME_HEIGHT * scale }}
                onPointerDown={handleFlap}
            >
                <div
                    className="fb-game-world"
                    style={{ width: GAME_WIDTH, height: GAME_HEIGHT, transform: `scale(${scale})` }}
                >
                    <div className="fb-sky" />

                    {gameData.pipes.map((pipe) => (
                        <PipePair key={pipe.id} x={pipe.x} gapCenter={pipe.gapCenter} gapSize={pipe.gapSize} />
                    ))}

                    <Bird y={gameData.bird.y} rotation={gameData.bird.rotation} />
                    <Ground speed={currentPipeSpeed} />

                    {(status === 'playing' || status === 'paused') && <ScoreBoard score={gameData.score} />}
                    {status === 'start' && <StartScreen highScore={highScore} onStart={handleFlap} />}
                    {status === 'countdown' && <CountdownOverlay value={countdownValue} />}
                    {status === 'paused' && <PauseOverlay onResume={togglePause} />}
                    {status === 'gameover' && (
                        <GameOverScreen
                            score={gameData.score}
                            highScore={highScore}
                            isNewHighScore={isNewHighScore}
                            onRestart={handleFlap}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------------------
 * 6. STYLES
 *    Plain CSS in a template string, injected via a <style> tag. Colors are
 *    defined as CSS custom properties on .fb-light / .fb-dark so the whole
 *    theme swaps with one class change. Because the playfield is scaled as a
 *    single transformed block, every element (including text) resizes
 *    together — that's what makes the layout responsive with no media queries.
 * -------------------------------------------------------------------------- */

const GAME_STYLES = `
  * { box-sizing: border-box; }

  .fb-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.3s ease;
  }
  .fb-page.fb-light { background: linear-gradient(160deg, #dff3fd, #bfe4f5); }
  .fb-page.fb-dark { background: linear-gradient(160deg, #05070f, #111a30); }

  .fb-darkmode-toggle {
    position: fixed;
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.85);
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
    z-index: 20;
  }

  .fb-game-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 6px rgba(255, 255, 255, 0.15) inset;
    touch-action: none;
    cursor: pointer;
    user-select: none;
  }
  .fb-game-world {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    overflow: hidden;
  }

  /* --- Sky & clouds --- */
  .fb-sky {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, rgba(255,255,255,0.9) 0 18px, transparent 19px),
      radial-gradient(circle at 45% 14%, rgba(255,255,255,0.7) 0 14px, transparent 15px),
      radial-gradient(circle at 78% 26%, rgba(255,255,255,0.85) 0 20px, transparent 21px),
      linear-gradient(to bottom, #4EC0F5, #BEE9FB 85%);
  }
  .fb-dark .fb-sky {
    background:
      radial-gradient(circle at 12% 15%, #ffffff 0 1.5px, transparent 2px),
      radial-gradient(circle at 30% 40%, #ffffff 0 1px, transparent 2px),
      radial-gradient(circle at 55% 10%, #ffffff 0 1.5px, transparent 2px),
      radial-gradient(circle at 70% 30%, #ffffff 0 1px, transparent 2px),
      radial-gradient(circle at 88% 18%, #ffffff 0 1.5px, transparent 2px),
      radial-gradient(circle at 92% 50%, #ffffff 0 1px, transparent 2px),
      linear-gradient(to bottom, #0b1026, #1b2745 85%);
  }

  /* --- Ground --- */
  .fb-ground {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    background: #ded895;
    border-top: 4px solid #8b5e3c;
    box-shadow: 0 -3px 6px rgba(0, 0, 0, 0.2) inset;
    overflow: hidden;
  }
  .fb-ground-pattern {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 200%;
    background-image: repeating-linear-gradient(90deg, #cfc77e 0 36px, #ded895 36px 40px, #c2b96e 40px 44px);
    animation-name: fb-ground-scroll;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  @keyframes fb-ground-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  /* --- Bird --- */
  .fb-bird {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #FFEB3B, #FBC02D 60%, #F9A825);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    z-index: 3;
  }
  .fb-bird-eye {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #222;
    border-radius: 50%;
    top: 8px;
    right: 6px;
  }
  .fb-bird-beak {
    position: absolute;
    width: 12px;
    height: 8px;
    background: #FF7043;
    right: -8px;
    top: 14px;
    border-radius: 2px;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
  .fb-bird-wing {
    position: absolute;
    width: 16px;
    height: 10px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    left: 4px;
    bottom: 6px;
    animation: fb-wing-flap 0.4s ease-in-out infinite;
  }
  @keyframes fb-wing-flap {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
  }

  /* --- Pipes --- */
  .fb-pipe {
    position: absolute;
    background: linear-gradient(90deg, #6cd06f, #2E7D32 85%, #1B5E20);
    border: 2px solid #1B5E20;
    box-shadow: inset -4px 0 6px rgba(0, 0, 0, 0.25);
    z-index: 2;
  }
  .fb-pipe-top { top: 0; border-radius: 0 0 6px 6px; }
  .fb-pipe-bottom { border-radius: 6px 6px 0 0; }
  .fb-pipe-top .fb-pipe-cap {
    position: absolute;
    left: -6px;
    right: -6px;
    bottom: 0;
    height: 26px;
    background: linear-gradient(90deg, #7ada7d, #2E7D32);
    border: 2px solid #1B5E20;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .fb-pipe-bottom .fb-pipe-cap {
    position: absolute;
    left: -6px;
    right: -6px;
    top: 0;
    height: 26px;
    background: linear-gradient(90deg, #7ada7d, #2E7D32);
    border: 2px solid #1B5E20;
    border-radius: 6px;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.3);
  }

  /* --- HUD --- */
  .fb-score {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 48px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 3px 0 rgba(0, 0, 0, 0.25), 0 0 8px rgba(0, 0, 0, 0.15);
    z-index: 5;
    pointer-events: none;
    font-variant-numeric: tabular-nums;
  }

  /* --- Overlays (start / countdown / pause / game over) --- */
  .fb-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    background: rgba(10, 20, 40, 0.55);
    backdrop-filter: blur(3px);
    color: #fff;
    text-align: center;
    padding: 24px;
    z-index: 10;
  }
  .fb-title {
    font-size: 42px;
    margin: 0;
    font-weight: 800;
    text-shadow: 0 3px 0 rgba(0, 0, 0, 0.3);
    letter-spacing: 1px;
  }
  .fb-title-small { font-size: 32px; margin: 0; font-weight: 800; }
  .fb-instructions { font-size: 16px; margin: 0; opacity: 0.9; }
  .fb-instructions-secondary { font-size: 13px; margin: 0; opacity: 0.7; }
  .fb-highscore-label { font-size: 14px; opacity: 0.85; margin-top: 4px; }

  .fb-bird-preview {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #FFEB3B, #FBC02D 60%, #F9A825);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    animation: fb-bob 1.4s ease-in-out infinite;
  }
  @keyframes fb-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .fb-countdown-number {
    font-size: 80px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
    animation: fb-countdown-pop 0.8s ease;
  }
  @keyframes fb-countdown-pop {
    0% { transform: scale(0.4); opacity: 0; }
    60% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  .fb-new-best {
    color: #FFD54F;
    font-weight: 800;
    font-size: 16px;
    margin: 0;
    animation: fb-pulse 1s ease-in-out infinite;
  }
  @keyframes fb-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .fb-final-score { display: flex; gap: 28px; margin: 8px 0; }
  .fb-final-score > div { display: flex; flex-direction: column; align-items: center; }
  .fb-stat-label { font-size: 12px; opacity: 0.75; text-transform: uppercase; letter-spacing: 1px; }
  .fb-stat-value { font-size: 28px; font-weight: 800; }

  .fb-button {
    padding: 12px 28px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(180deg, #FFC107, #FF9800);
    border: none;
    border-radius: 999px;
    box-shadow: 0 4px 0 #C77700, 0 6px 10px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }
  .fb-button:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #C77700, 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;