import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RefreshCw, Zap, Clock, Target, Activity, AlertTriangle } from "lucide-react";

// ─── WORD BANK ────────────────────────────────────────────────────────────────
const WORD_BANK = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for",
  "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his",
  "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my",
  "one", "all", "would", "there", "their", "what", "so", "up", "out", "if",
  "about", "who", "get", "which", "go", "me", "when", "make", "can", "like",
  "time", "no", "just", "him", "know", "take", "people", "into", "year",
  "your", "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also", "back",
  "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most",
  "light", "dark", "code", "type", "fast", "word", "line", "key", "run",
  "fire", "void", "zero", "data", "flux", "mode", "core", "sync", "byte",
  "node", "echo", "loop", "grep", "ping", "null", "hash", "port", "path",
];

/** Generate a random word list of given length */
const generateWords = (count = 60) => {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]);
  }
  return words;
};

// ─── MINI LINE CHART ─────────────────────────────────────────────────────────
/**
 * A smooth SVG line chart for live WPM visualization.
 * Renders a glowing amber path over a dark grid.
 */
const WpmChart = ({ data, width = 300, height = 80 }) => {
  if (data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center opacity-30"
      >
        <span style={{ color: "#b87333", fontFamily: "monospace", fontSize: 11 }}>
          awaiting data...
        </span>
      </div>
    );
  }

  const maxVal = Math.max(...data, 10);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const pad = { top: 8, right: 8, bottom: 8, left: 8 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const points = data.map((v, i) => {
    const x = pad.left + (i / (data.length - 1)) * w;
    const y = pad.top + h - ((v - minVal) / range) * h;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Area fill path (close to bottom)
  const lastX = pad.left + w;
  const firstX = pad.left;
  const bottomY = pad.top + h;
  const areaD = `M ${firstX},${bottomY} L ${points.join(" L ")} L ${lastX},${bottomY} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.left}
          y1={pad.top + h * t}
          x2={pad.left + w}
          y2={pad.top + h * t}
          stroke="#2a2010"
          strokeWidth="1"
        />
      ))}
      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" opacity="0.35" />
      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke="#d4851a"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      {/* Last data point dot */}
      <circle
        cx={pad.left + w}
        cy={
          pad.top +
          h -
          ((data[data.length - 1] - minVal) / range) * h
        }
        r="3.5"
        fill="#ffb347"
        filter="url(#glow)"
      />
      {/* Defs */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4851a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#d4851a" stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

// ─── RESULT SCREEN ────────────────────────────────────────────────────────────
/**
 * Fade-in results dashboard shown after test completion.
 * Displays final stats, raw vs. net WPM, and the live WPM graph.
 */
const ResultScreen = ({ result, onRetry, mode }) => {
  const accuracy = result.accuracy.toFixed(1);
  const wpm = Math.round(result.wpm);
  const rawWpm = Math.round(result.rawWpm);
  const errors = result.totalErrors;

  return (
    <div
      className="flex flex-col items-center justify-center w-full animate-fadeIn"
      style={{ animationDuration: "0.6s" }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <p
          style={{
            color: "#5a4020",
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {mode === "sudden-death" ? "// sudden_death.result" : "// test.complete"}
        </p>
      </div>

      {/* Main stats */}
      <div className="flex gap-12 mb-8">
        {/* WPM */}
        <div className="text-center">
          <div
            style={{
              color: "#ffb347",
              fontFamily: "monospace",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 0 30px #d4851a88",
            }}
          >
            {wpm}
          </div>
          <div
            style={{
              color: "#5a4020",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.15em",
              marginTop: 6,
            }}
          >
            WPM
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "#2a2010", alignSelf: "stretch" }} />

        {/* Accuracy */}
        <div className="text-center">
          <div
            style={{
              color: "#ffb347",
              fontFamily: "monospace",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 0 30px #d4851a88",
            }}
          >
            {accuracy}
            <span style={{ fontSize: 32 }}>%</span>
          </div>
          <div
            style={{
              color: "#5a4020",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.15em",
              marginTop: 6,
            }}
          >
            ACC
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div
        className="flex gap-8 mb-10"
        style={{
          padding: "12px 24px",
          border: "1px solid #1e1608",
          background: "#0d0a04",
        }}
      >
        <StatPill label="raw wpm" value={rawWpm} />
        <StatPill label="errors" value={errors} dimmed={errors === 0} />
        <StatPill label="chars" value={result.totalChars} />
      </div>

      {/* WPM Graph */}
      <div className="mb-10">
        <p
          style={{
            color: "#3a2a0e",
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          wpm over time
        </p>
        <WpmChart data={result.wpmHistory} width={340} height={90} />
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="flex items-center gap-2 group"
        style={{
          background: "transparent",
          border: "1px solid #3a2a0e",
          color: "#7a5a28",
          fontFamily: "monospace",
          fontSize: 12,
          letterSpacing: "0.15em",
          padding: "10px 24px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#d4851a";
          e.currentTarget.style.color = "#ffb347";
          e.currentTarget.style.boxShadow = "0 0 12px #d4851a33";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#3a2a0e";
          e.currentTarget.style.color = "#7a5a28";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <RefreshCw size={12} />
        <span>retry</span>
        <span style={{ color: "#3a2a0e", marginLeft: 4 }}>[tab]</span>
      </button>
    </div>
  );
};

const StatPill = ({ label, value, dimmed }) => (
  <div className="text-center">
    <div
      style={{
        color: dimmed ? "#2a2010" : "#7a5a28",
        fontFamily: "monospace",
        fontSize: 18,
        fontWeight: 600,
      }}
    >
      {value}
    </div>
    <div
      style={{
        color: "#2a2010",
        fontFamily: "monospace",
        fontSize: 10,
        letterSpacing: "0.1em",
      }}
    >
      {label}
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function VoidType() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [words, setWords] = useState(() => generateWords(80));
  const [typed, setTyped] = useState("");          // current input in the active word
  const [wordIndex, setWordIndex] = useState(0);   // which word we're on
  const [charStates, setCharStates] = useState([]); // per-char result: 'correct'|'error'|'pending'
  const [wordErrors, setWordErrors] = useState({}); // words that had errors keyed by wordIndex
  const [phase, setPhase] = useState("idle");      // idle | running | finished
  const [mode, setMode] = useState("time");        // 'time' | 'sudden-death'
  const [timeLimit, setTimeLimit] = useState(30);  // 15 | 30 | 60
  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsed, setElapsed] = useState(0);       // seconds elapsed
  const [isFocused, setIsFocused] = useState(true);
  const [result, setResult] = useState(null);

  // Stats tracking
  const [correctChars, setCorrectChars] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [wpmHistory, setWpmHistory] = useState([]);  // per-second WPM snapshots
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Sudden death flash state (visual feedback on death)
  const [suddenDeathFlash, setSuddenDeathFlash] = useState(false);

  // Refs
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const wpmSnapshotRef = useRef(null);
  const correctCharsRef = useRef(0);
  const totalTypedRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const wordRowsRef = useRef(null);
  const activeWordRef = useRef(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentWord = words[wordIndex] ?? "";

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Scroll active word into view within its container */
  const scrollActiveWordIntoView = useCallback(() => {
    if (activeWordRef.current && wordRowsRef.current) {
      const wordTop = activeWordRef.current.offsetTop;
      const containerTop = wordRowsRef.current.scrollTop;
      const containerHeight = wordRowsRef.current.clientHeight;
      if (wordTop > containerTop + containerHeight * 0.55) {
        wordRowsRef.current.scrollTo({ top: wordTop - 32, behavior: "smooth" });
      }
    }
  }, []);

  /** Compute WPM from correct chars and elapsed seconds */
  const computeWpm = useCallback((chars, seconds) => {
    if (seconds <= 0) return 0;
    return Math.round((chars / 5) / (seconds / 60));
  }, []);

  /** Compute accuracy from correct vs total */
  const computeAccuracy = useCallback((correct, total) => {
    if (total === 0) return 100;
    return (correct / total) * 100;
  }, []);

  // ── Reset / New game ───────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(wpmSnapshotRef.current);
    setWords(generateWords(80));
    setTyped("");
    setWordIndex(0);
    setCharStates([]);
    setWordErrors({});
    setPhase("idle");
    setTimeLeft(timeLimit);
    setElapsed(0);
    setResult(null);
    setCorrectChars(0);
    setTotalTyped(0);
    setTotalErrors(0);
    setWpmHistory([]);
    setLiveWpm(0);
    setLiveAccuracy(100);
    correctCharsRef.current = 0;
    totalTypedRef.current = 0;
    totalErrorsRef.current = 0;
    if (wordRowsRef.current) wordRowsRef.current.scrollTop = 0;
    // Re-focus input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [timeLimit]);

  // Reset when timeLimit changes
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimit, mode]);

  // ── Game start ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setPhase("running");

    // Countdown timer
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const newElapsed = e + 1;
        setTimeLeft(timeLimit - newElapsed);
        if (newElapsed >= timeLimit) {
          clearInterval(timerRef.current);
          clearInterval(wpmSnapshotRef.current);
        }
        return newElapsed;
      });
    }, 1000);

    // WPM snapshot every second
    wpmSnapshotRef.current = setInterval(() => {
      setElapsed((e) => {
        const wpm = computeWpm(correctCharsRef.current, e + 1);
        setWpmHistory((prev) => [...prev, wpm]);
        setLiveWpm(wpm);
        return e;
      });
    }, 1000);
  }, [timeLimit, computeWpm]);

  // ── End game ───────────────────────────────────────────────────────────────
  const endGame = useCallback(
    (flash = false) => {
      clearInterval(timerRef.current);
      clearInterval(wpmSnapshotRef.current);
      if (flash) setSuddenDeathFlash(true);

      setElapsed((e) => {
        const finalWpm = computeWpm(correctCharsRef.current, Math.max(e, 1));
        const rawWpm = computeWpm(totalTypedRef.current, Math.max(e, 1));
        const acc = computeAccuracy(correctCharsRef.current, totalTypedRef.current);

        setResult({
          wpm: finalWpm,
          rawWpm,
          accuracy: acc,
          totalErrors: totalErrorsRef.current,
          totalChars: totalTypedRef.current,
          wpmHistory: [...wpmHistory, finalWpm],
        });
        setPhase("finished");
        return e;
      });

      if (flash) {
        setTimeout(() => setSuddenDeathFlash(false), 600);
      }
    },
    [computeWpm, computeAccuracy, wpmHistory]
  );

  // ── Watch timeLeft for end ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "running" && timeLeft <= 0) {
      endGame(false);
    }
  }, [timeLeft, phase, endGame]);

  // ── Keyboard: Tab to restart ───────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [resetGame]);

  // ── Typing handler ─────────────────────────────────────────────────────────
  const handleInput = useCallback(
    (e) => {
      const value = e.target.value;

      // Start game on first keystroke
      if (phase === "idle") startGame();
      if (phase === "finished") return;

      // ── Space: advance to next word ──────────────────────────────────────
      if (value.endsWith(" ")) {
        const attempt = value.trimEnd();
        const isWordCorrect = attempt === currentWord;

        // Record per-char states for this word
        const states = currentWord.split("").map((char, i) => {
          if (i >= attempt.length) return "skipped";
          return attempt[i] === char ? "correct" : "error";
        });
        setCharStates((prev) => {
          const next = [...prev];
          next[wordIndex] = states;
          return next;
        });

        // Track errors
        if (!isWordCorrect) {
          setWordErrors((prev) => ({ ...prev, [wordIndex]: true }));
          const errs = attempt.split("").filter((c, i) => c !== currentWord[i]).length
            + Math.abs(attempt.length - currentWord.length);
          totalErrorsRef.current += errs;
          setTotalErrors(totalErrorsRef.current);
        }

        // Count correct chars (only correct words contribute to WPM)
        if (isWordCorrect) {
          correctCharsRef.current += currentWord.length + 1; // +1 for space
          setCorrectChars(correctCharsRef.current);
        }
        totalTypedRef.current += attempt.length + 1;
        setTotalTyped(totalTypedRef.current);

        // Update accuracy
        const acc = computeAccuracy(correctCharsRef.current, totalTypedRef.current);
        setLiveAccuracy(acc);

        // Sudden death check
        if (mode === "sudden-death" && (!isWordCorrect || acc < 95)) {
          endGame(true);
          return;
        }

        // Advance word
        setWordIndex((wi) => wi + 1);
        setTyped("");
        scrollActiveWordIntoView();
        return;
      }

      // ── Backspace / normal typing ────────────────────────────────────────
      setTyped(value);
      totalTypedRef.current = Math.max(0, totalTypedRef.current);
    },
    [
      phase,
      currentWord,
      wordIndex,
      mode,
      startGame,
      endGame,
      computeAccuracy,
      scrollActiveWordIntoView,
    ]
  );

  // ── Focus handling ─────────────────────────────────────────────────────────
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────

  /**
   * Render a single word with per-character coloring.
   * The active word also shows the animated caret.
   */
  const renderWord = useCallback(
    (word, wIdx) => {
      const isActive = wIdx === wordIndex;
      const states = charStates[wIdx] ?? [];
      const hasError = wordErrors[wIdx];

      return (
        <span
          key={wIdx}
          ref={isActive ? activeWordRef : null}
          style={{
            display: "inline-block",
            marginRight: 10,
            marginBottom: 6,
            position: "relative",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: 18,
            letterSpacing: "0.02em",
            lineHeight: "2",
            padding: "0 2px",
            borderBottom: isActive
              ? "1px solid #3a2a0e"
              : hasError
              ? "1px solid #3a0a0a"
              : "1px solid transparent",
            transition: "border-color 0.2s",
          }}
        >
          {/* Caret before first char when no typed input */}
          {isActive && typed.length === 0 && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 2,
                height: "1.1em",
                background: "#ffb347",
                boxShadow: "0 0 8px #ffb347",
                animation: "caretPulse 1s ease-in-out infinite",
              }}
            />
          )}

          {word.split("").map((char, cIdx) => {
            const state = states[cIdx];
            const isActiveCaret = isActive && cIdx === typed.length;

            // Determine color
            let color = "#2a2010"; // future/pending chars
            if (state === "correct") color = "#c49840";
            else if (state === "error") color = "#8b1a1a";
            else if (state === "skipped") color = "#5a1010";
            else if (isActive) {
              if (cIdx < typed.length) {
                color = typed[cIdx] === char ? "#c49840" : "#8b1a1a";
              } else {
                color = "#4a3818"; // upcoming chars in active word
              }
            }

            const bgColor =
              isActive && cIdx < typed.length && typed[cIdx] !== char
                ? "#1a0404"
                : "transparent";

            return (
              <span key={cIdx} style={{ position: "relative", display: "inline-block" }}>
                {/* Caret between chars */}
                {isActiveCaret && (
                  <span
                    style={{
                      position: "absolute",
                      left: -1,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 2,
                      height: "1.1em",
                      background: "#ffb347",
                      boxShadow: "0 0 8px #ffb347, 0 0 16px #d4851a55",
                      animation: "caretPulse 1s ease-in-out infinite",
                      zIndex: 2,
                      transition: "left 0.05s",
                    }}
                  />
                )}
                <span
                  style={{
                    color,
                    background: bgColor,
                    transition: "color 0.08s ease, background 0.1s ease",
                  }}
                >
                  {char}
                </span>
              </span>
            );
          })}

          {/* Caret after last char of word (overflow) */}
          {isActive && typed.length >= word.length && (
            <span style={{ position: "relative", display: "inline-block" }}>
              <span
                style={{
                  position: "absolute",
                  left: -1,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 2,
                  height: "1.1em",
                  background: "#ffb347",
                  boxShadow: "0 0 8px #ffb347",
                  animation: "caretPulse 1s ease-in-out infinite",
                }}
              />
              {/* Extra typed chars beyond word length */}
              {typed.slice(word.length).split("").map((c, i) => (
                <span key={i} style={{ color: "#6b0f0f", textDecoration: "underline" }}>
                  {c}
                </span>
              ))}
            </span>
          )}
        </span>
      );
    },
    [wordIndex, typed, charStates, wordErrors]
  );

  // ── Live stats bar ─────────────────────────────────────────────────────────
  const StatBar = () => (
    <div
      className="flex items-center gap-8"
      style={{
        fontFamily: "monospace",
        fontSize: 13,
        letterSpacing: "0.08em",
      }}
    >
      {/* WPM */}
      <div className="flex items-center gap-2">
        <Activity size={12} style={{ color: "#3a2a0e" }} />
        <span style={{ color: "#3a2a0e" }}>wpm</span>
        <span
          style={{
            color: "#c49840",
            fontWeight: 700,
            fontSize: 16,
            textShadow: liveWpm > 0 ? "0 0 10px #d4851a55" : "none",
          }}
        >
          {liveWpm}
        </span>
      </div>
      {/* Accuracy */}
      <div className="flex items-center gap-2">
        <Target size={12} style={{ color: "#3a2a0e" }} />
        <span style={{ color: "#3a2a0e" }}>acc</span>
        <span
          style={{
            color:
              liveAccuracy < 90
                ? "#8b1a1a"
                : liveAccuracy < 95
                ? "#8b5a10"
                : "#c49840",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {liveAccuracy.toFixed(0)}%
        </span>
      </div>
      {/* Timer */}
      <div className="flex items-center gap-2">
        <Clock size={12} style={{ color: "#3a2a0e" }} />
        <span style={{ color: "#3a2a0e" }}>time</span>
        <span
          style={{
            color: timeLeft <= 5 ? "#8b1a1a" : "#c49840",
            fontWeight: 700,
            fontSize: 16,
            textShadow: timeLeft <= 5 ? "0 0 12px #8b1a1a88" : "none",
            transition: "color 0.3s, text-shadow 0.3s",
          }}
        >
          {phase === "idle" ? timeLimit : timeLeft}
        </span>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Global styles injected inline since we can't use a <style> tag in JSX safely */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #080602;
        }

        @keyframes caretPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes flashRed {
          0%, 100% { background: #080602; }
          30% { background: #150404; }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease both;
        }

        .mode-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          padding: 4px 10px;
          transition: color 0.15s;
        }

        .mode-btn:hover {
          color: #c49840 !important;
        }

        .time-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          padding: 4px 8px;
          transition: color 0.15s;
        }

        .time-btn:hover {
          color: #c49840 !important;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #080602; }
        ::-webkit-scrollbar-thumb { background: #1e1608; }
      `}</style>

      {/* ── Outermost shell ─────────────────────────────────────────────── */}
      <div
        onClick={handleContainerClick}
        style={{
          minHeight: "100vh",
          background: suddenDeathFlash ? "#150404" : "#080602",
          transition: "background 0.3s",
          animation: suddenDeathFlash ? "flashRed 0.6s ease" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          cursor: "text",
        }}
      >
        {/* Subtle scanline overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        {/* Ambient glow */}
        <div
          style={{
            position: "fixed",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse, #1a0e0288 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 740,
            padding: "0 24px",
          }}
        >
          {/* ── Logo / Header ──────────────────────────────────────────── */}
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  color: "#3a2a0e",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}
              >
                void
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  color: "#c49840",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  textShadow: "0 0 12px #d4851a66",
                }}
              >
                type
              </span>
            </div>

            {/* Mode & time controls */}
            {phase !== "finished" && (
              <div className="flex items-center gap-4">
                {/* Mode toggle */}
                <div className="flex items-center gap-1">
                  <button
                    className="mode-btn"
                    style={{ color: mode === "time" ? "#c49840" : "#2a2010" }}
                    onClick={(e) => { e.stopPropagation(); setMode("time"); }}
                  >
                    <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
                    time
                  </button>
                  <span style={{ color: "#1a1208", fontFamily: "monospace" }}>|</span>
                  <button
                    className="mode-btn"
                    style={{ color: mode === "sudden-death" ? "#c84040" : "#2a2010" }}
                    onClick={(e) => { e.stopPropagation(); setMode("sudden-death"); }}
                  >
                    <Zap size={10} style={{ display: "inline", marginRight: 4 }} />
                    sudden death
                  </button>
                </div>

                {/* Time buttons */}
                <div className="flex items-center gap-1">
                  {[15, 30, 60].map((t) => (
                    <button
                      key={t}
                      className="time-btn"
                      style={{ color: timeLimit === t ? "#c49840" : "#2a2010" }}
                      onClick={(e) => { e.stopPropagation(); setTimeLimit(t); }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Restart */}
                <button
                  onClick={(e) => { e.stopPropagation(); resetGame(); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#2a2010",
                    padding: 4,
                    transition: "color 0.15s",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#c49840")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#2a2010")}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
          </div>

          {/* ── Main panel ─────────────────────────────────────────────── */}
          {phase === "finished" && result ? (
            <ResultScreen
              result={result}
              onRetry={resetGame}
              mode={mode}
            />
          ) : (
            <>
              {/* ── Sudden Death warning badge ──────────────────────────── */}
              {mode === "sudden-death" && phase !== "finished" && (
                <div
                  className="flex items-center gap-2 mb-6"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #2a0a0a",
                    display: "inline-flex",
                    background: "#0d0404",
                  }}
                >
                  <AlertTriangle size={10} style={{ color: "#6b1a1a" }} />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "#6b1a1a",
                      letterSpacing: "0.15em",
                    }}
                  >
                    one mistake ends the test
                  </span>
                </div>
              )}

              {/* ── Text display ────────────────────────────────────────── */}
              <div
                ref={wordRowsRef}
                style={{
                  height: 148,
                  overflow: "hidden",
                  position: "relative",
                  padding: "4px 0",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 8%, black 90%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 8%, black 90%, transparent 100%)",
                }}
              >
                <div style={{ lineHeight: 2 }}>
                  {words.map((word, i) => renderWord(word, i))}
                </div>
              </div>

              {/* ── Hidden input (captures keyboard) ────────────────────── */}
              <input
                ref={inputRef}
                autoFocus
                value={typed}
                onChange={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  // Prevent Tab from leaving input (handled globally)
                  if (e.key === "Tab") e.preventDefault();
                }}
                style={{
                  position: "absolute",
                  opacity: 0,
                  pointerEvents: "none",
                  width: 1,
                  height: 1,
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />

              {/* ── Focus overlay ────────────────────────────────────────── */}
              {!isFocused && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#08060299",
                    backdropFilter: "blur(3px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    cursor: "text",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "#3a2a0e",
                      letterSpacing: "0.2em",
                      animation: "caretPulse 2s ease-in-out infinite",
                    }}
                  >
                    click to focus
                  </div>
                </div>
              )}

              {/* ── Live Stats Bar ───────────────────────────────────────── */}
              <div
                className="flex items-center justify-between mt-8"
                style={{
                  borderTop: "1px solid #12100a",
                  paddingTop: 16,
                }}
              >
                <StatBar />
                {/* Mini live chart */}
                <WpmChart data={wpmHistory} width={180} height={50} />
              </div>

              {/* ── Idle hint ────────────────────────────────────────────── */}
              {phase === "idle" && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 20,
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "#1e1608",
                    letterSpacing: "0.2em",
                    animation: "caretPulse 3s ease-in-out infinite",
                  }}
                >
                  start typing to begin · tab to restart
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
