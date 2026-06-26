import { useState, useRef, useEffect } from "react";
import { WindowControls } from "#components";
import { techStack } from "#constants";
import WindowWrapper from "#hoc/WindowWrapper";
import useWindowStore from "#store/window";
import useSettingsStore from "#store/settings";
import { Check, Flag } from "lucide-react";
import dayjs from "dayjs";

const Terminal = () => {
  const { openWindow } = useWindowStore();
  const { isDarkMode, toggleDarkMode, setWallpaper } = useSettingsStore();

  const [inputVal, setInputVal] = useState("");
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize history with the default tech stack command
  const [history, setHistory] = useState([
    {
      type: "output",
      content: `Last login: ${dayjs().format("ddd MMM D HH:mm:ss")} on ttys001`
    },
    {
      type: "input",
      content: "show tech"
    },
    {
      type: "output",
      content: (
        <div key="initial-techstack">
          <div className="label">
            <p className="w-32 inline-block">Category</p>
            <p className="inline-block">Technologies</p>
          </div>
          <ul className="content">
            {techStack.map(({ category, items }) => (
              <li key={category} className="flex items-center">
                <Check className="check text-emerald-400 w-5 mr-1" size={20} />
                <h3 className="font-semibold text-emerald-400 w-32">{category}</h3>
                <ul className="flex items-center gap-1.5 text-zinc-300">
                  {items.map((item, i) => (
                    <li key={i}>
                      {item}
                      {i < items.length - 1 ? "," : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="footnote text-emerald-400 mt-2 space-y-1">
            <p className="flex items-center gap-1">
              <Check size={15} /> {techStack.length} out of {techStack.length} stacks loaded successfully (100%)
            </p>
            <p className="text-zinc-400 flex items-center gap-1">
              <Flag size={15} className="fill-zinc-400 text-zinc-400" />
              Render time: 4ms
            </p>
          </div>
        </div>
      )
    },
    {
      type: "output",
      content: "Welcome to Parth's Shell. Type 'help' to see a list of available commands."
    }
  ]);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;

    const trimmed = inputVal.trim();
    setInputVal("");

    if (!trimmed) return;

    const parts = trimmed.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newHistory = [...history, { type: "input", content: trimmed }];

    let response = null;

    switch (command) {
      case "help":
        response = (
          <div className="text-zinc-300 space-y-1 py-1">
            <p className="text-emerald-400 font-bold">Parth Pawar Shell v1.0.0. Available commands:</p>
            <p>  <span className="text-blue-400 font-bold">help</span> - Show this help menu</p>
            <p>  <span className="text-blue-400 font-bold">ls</span> - List files and folders</p>
            <p>  <span className="text-blue-400 font-bold">cat [file]</span> - Read file contents (e.g., <code className="text-amber-400">cat about_me.txt</code>)</p>
            <p>  <span className="text-blue-400 font-bold">neofetch</span> - Show system information and ASCII logo</p>
            <p>  <span className="text-blue-400 font-bold">skills</span> - Display tech stack</p>
            <p>  <span className="text-blue-400 font-bold">open [app]</span> - Open window (finder, safari, contact, resume, gallery)</p>
            <p>  <span className="text-blue-400 font-bold">theme [light/dark]</span> - Switch desktop mode</p>
            <p>  <span className="text-blue-400 font-bold">clear</span> - Clear screen</p>
            <p>  <span className="text-blue-400 font-bold">whoami</span> - Display current user</p>
          </div>
        );
        break;

      case "clear":
        setHistory([]);
        return;

      case "whoami":
        response = "guest@parth-pawar-portfolio.local";
        break;

      case "date":
        response = dayjs().format("dddd, MMMM D, YYYY h:mm:ss A");
        break;

      case "uptime":
        response = `up ${Math.floor(performance.now() / 60000)} minutes, load average: 0.12, 0.08, 0.05`;
        break;

      case "ls":
        response = (
          <div className="flex gap-4 text-emerald-400 font-medium">
            <span>about_me.txt</span>
            <span>resume.pdf</span>
            <span className="text-amber-400">projects/</span>
          </div>
        );
        break;

      case "cat":
        if (!args[0]) {
          response = <span className="text-rose-400">Error: Please specify a file, e.g., 'cat about_me.txt'</span>;
        } else {
          const fileName = args[0].toLowerCase();
          if (fileName === "about_me.txt") {
            response = (
              <div className="text-zinc-300 space-y-2 py-1 max-w-lg leading-relaxed">
                <p className="font-bold text-emerald-400">About Parth Pawar:</p>
                <p>I'm a full stack developer dedicated to building high-fidelity web applications with polished layouts and premium user experiences.</p>
                <p>Specialized in React, Next.js, and Node.js. Passionate about animations and micro-interactions.</p>
              </div>
            );
          } else if (fileName === "resume.pdf") {
            openWindow("resume");
            response = "Opening Resume application...";
          } else if (fileName.includes("project") || fileName === "projects") {
            response = (
              <div className="text-zinc-300 space-y-1">
                <p>Available Projects in ~/projects:</p>
                <p>  1. Nike Ecommerce Website Application</p>
                <p>  2. AI Resume Analyzer</p>
                <p>  3. Food Delivery App</p>
                <p className="text-zinc-400 text-xs mt-1">Tip: Use 'open finder' to view details or click folders on the desktop.</p>
              </div>
            );
          } else {
            response = <span className="text-rose-400">Error: File '{args[0]}' not found.</span>;
          }
        }
        break;

      case "theme":
        if (!args[0]) {
          response = `Current mode is ${isDarkMode ? "dark" : "light"}. Try 'theme dark' or 'theme light'.`;
        } else {
          const mode = args[0].toLowerCase();
          if (mode === "dark") {
            if (!isDarkMode) toggleDarkMode();
            response = "Switched to Dark Mode.";
          } else if (mode === "light") {
            if (isDarkMode) toggleDarkMode();
            response = "Switched to Light Mode.";
          } else {
            response = <span className="text-rose-400">Error: Invalid theme mode. Use 'light' or 'dark'.</span>;
          }
        }
        break;

      case "open":
        if (!args[0]) {
          response = <span className="text-rose-400">Error: Please specify an application, e.g., 'open finder'</span>;
        } else {
          const app = args[0].toLowerCase();
          if (["finder", "portfolio"].includes(app)) {
            openWindow("finder");
            response = "Opening Finder...";
          } else if (["safari", "articles", "browser"].includes(app)) {
            openWindow("safari");
            response = "Opening Safari...";
          } else if (["contact"].includes(app)) {
            openWindow("contact");
            response = "Opening Contact me...";
          } else if (["resume", "pdf"].includes(app)) {
            openWindow("resume");
            response = "Opening Resume.pdf...";
          } else if (["gallery", "photos"].includes(app)) {
            openWindow("photos");
            response = "Opening Gallery...";
          } else if (["terminal", "skills"].includes(app)) {
            response = "Terminal is already open!";
          } else {
            response = <span className="text-rose-400">Error: Application '{args[0]}' not found.</span>;
          }
        }
        break;

      case "skills":
        response = (
          <div className="py-2">
            <div className="label">
              <p className="w-32 inline-block">Category</p>
              <p className="inline-block">Technologies</p>
            </div>
            <ul className="content mt-1">
              {techStack.map(({ category, items }) => (
                <li key={category} className="flex items-center">
                  <Check className="check text-emerald-400 w-5 mr-1" size={20} />
                  <h3 className="font-semibold text-emerald-400 w-32">{category}</h3>
                  <ul className="flex items-center gap-1.5 text-zinc-300">
                    {items.map((item, i) => (
                      <li key={i}>
                        {item}
                        {i < items.length - 1 ? "," : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        );
        break;

      case "neofetch":
        response = (
          <div className="flex gap-6 py-2 select-none font-mono">
            <pre className="text-emerald-400 text-xs leading-none">
{`          ,x88888x,
       ,888888888888,
      888888888888888
      888888888888888
       \`88888888888'
         \`x88888x'

    .-.           .-.
     \\ \\         / /
      \\ \\       / /
       \`'       \`'`}
            </pre>
            <div className="text-xs space-y-0.5 text-zinc-300">
              <p className="text-emerald-400 font-bold">parth@macfolio-pro</p>
              <p>---------------------</p>
              <p><span className="text-blue-400 font-bold">OS</span>: macOS Sequoia 15.0.1</p>
              <p><span className="text-blue-400 font-bold">Host</span>: Parth Pawar Portfolio Website</p>
              <p><span className="text-blue-400 font-bold">Kernel</span>: React 19 / Vite 8</p>
              <p><span className="text-blue-400 font-bold">Uptime</span>: {Math.floor(performance.now() / 60000)} mins</p>
              <p><span className="text-blue-400 font-bold">Shell</span>: Custom React Interactive Shell</p>
              <p><span className="text-blue-400 font-bold">Display</span>: {window.innerWidth}x{window.innerHeight}</p>
              <p><span className="text-blue-400 font-bold">Theme</span>: {isDarkMode ? "Dark Theme" : "Light Theme"}</p>
              <p><span className="text-blue-400 font-bold">CPU</span>: Apple M3 Max (Virtual)</p>
              <p><span className="text-blue-400 font-bold">Memory</span>: 16 GB LPDDR5 (System)</p>
            </div>
          </div>
        );
        break;

      default:
        response = <span className="text-rose-400">Error: command not found: {command}. Type 'help' for options.</span>;
    }

    if (response !== null) {
      newHistory.push({ type: "output", content: response });
    }

    setHistory(newHistory);
  };

  return (
    <>
      <div id="window-header">
        <WindowControls target="terminal" />
        <h2>Terminal — bash</h2>
      </div>
      <div 
        className="techstack cursor-text" 
        onClick={handleTerminalClick}
      >
        <div className="space-y-1.5 font-mono">
          {history.map((item, idx) => (
            <div key={idx}>
              {item.type === "input" ? (
                <p>
                  <span className="font-bold text-sky-400">guest@parth % </span>
                  <span className="text-zinc-100">{item.content}</span>
                </p>
              ) : (
                <div className="text-zinc-300 leading-normal">{item.content}</div>
              )}
            </div>
          ))}
          
          <div className="flex items-center">
            <span className="font-bold text-sky-400 mr-1.5 select-none">guest@parth % </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleCommand}
              className="bg-transparent text-zinc-100 outline-none flex-1 font-mono border-none p-0 focus:ring-0"
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </>
  );
};

const TerminalWindow = WindowWrapper(Terminal, "terminal");

export default TerminalWindow;
