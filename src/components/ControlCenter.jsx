import { useEffect, useRef, useState } from "react";
import useWindowStore from "#store/window";
import useSettingsStore from "#store/settings";
import { Sun, Volume2, Wifi, WifiOff, Moon, Bluetooth, Battery, BatteryCharging, Image as ImageIcon } from "lucide-react";
import gsap from "gsap";

const ControlCenter = () => {
    const { isControlCenterOpen, toggleControlCenter } = useWindowStore();
    const { 
        brightness, setBrightness, 
        volume, setVolume, 
        wifi, toggleWifi, 
        isDarkMode, toggleDarkMode,
        wallpaper, setWallpaper
    } = useSettingsStore();

    const [batteryLevel, setBatteryLevel] = useState(100);
    const [isCharging, setIsCharging] = useState(false);
    const panelRef = useRef(null);

    // Fetch real battery status if supported
    useEffect(() => {
        if (navigator.getBattery) {
            navigator.getBattery().then((bat) => {
                setBatteryLevel(Math.round(bat.level * 100));
                setIsCharging(bat.charging);

                bat.addEventListener("levelchange", () => {
                    setBatteryLevel(Math.round(bat.level * 100));
                });
                bat.addEventListener("chargingchange", () => {
                    setIsCharging(bat.charging);
                });
            });
        }
    }, []);

    // Close panel on clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isControlCenterOpen && panelRef.current && !panelRef.current.contains(e.target)) {
                // Check if the click was on the navbar icon that opens the control center
                const clickedNavbarIcon = e.target.closest(".cursor-pointer");
                if (!clickedNavbarIcon) {
                    toggleControlCenter(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isControlCenterOpen, toggleControlCenter]);

    // Animate entrance
    useEffect(() => {
        if (isControlCenterOpen && panelRef.current) {
            gsap.fromTo(panelRef.current,
                { opacity: 0, y: -15, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [isControlCenterOpen]);

    // Play a click sound when adjusting volume is finished
    const playVolumeSound = (val) => {
        // Simple synth audio clip to emulate macOS volume click sound
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            // Volume level controls gain
            gain.gain.setValueAtTime((val / 100) * 0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (err) {
            // Audio context failed or blocked by browser policy
        }
    };

    if (!isControlCenterOpen) return null;

    const wallpapersList = [
        { name: "Day (Default)", path: "/images/wallpaper.jpg" },
        { name: "Night (Default)", path: "/images/wallpaper1.png" },
        { name: "Nike Concept", path: "/images/project-1.png" },
        { name: "AI Concept", path: "/images/project-2.png" },
        { name: "Food Delivery", path: "/images/project-3.png" },
    ];

    return (
        <div 
            ref={panelRef}
            className="fixed top-12 right-4 w-80 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl z-[99990] flex flex-col gap-4 font-georama select-none"
        >
            {/* Top Grid Settings */}
            <div className="grid grid-cols-2 gap-2">
                {/* WiFi Panel */}
                <div 
                    onClick={toggleWifi}
                    className={`p-3 rounded-2xl flex flex-col justify-between h-20 transition-all cursor-pointer ${
                        wifi ? "bg-blue-600 text-white" : "bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                >
                    <div className="flex justify-between items-center w-full">
                        {wifi ? <Wifi size={18} /> : <WifiOff size={18} />}
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Wi-Fi</span>
                    </div>
                    <div>
                        <p className="font-semibold text-xs leading-none">Wi-Fi</p>
                        <p className="text-[10px] opacity-75 mt-0.5">{wifi ? "Connected" : "Off"}</p>
                    </div>
                </div>

                {/* Dark Mode Panel */}
                <div 
                    onClick={toggleDarkMode}
                    className={`p-3 rounded-2xl flex flex-col justify-between h-20 transition-all cursor-pointer ${
                        isDarkMode ? "bg-indigo-600 text-white" : "bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                >
                    <div className="flex justify-between items-center w-full">
                        <Moon size={18} />
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Theme</span>
                    </div>
                    <div>
                        <p className="font-semibold text-xs leading-none">Dark Mode</p>
                        <p className="text-[10px] opacity-75 mt-0.5">{isDarkMode ? "On" : "Off"}</p>
                    </div>
                </div>
            </div>

            {/* Brightness & Volume Slider Panel */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex flex-col gap-3.5">
                {/* Brightness */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-zinc-400 items-center">
                        <span className="flex items-center gap-1.5 font-medium"><Sun size={14} /> Display Brightness</span>
                        <span className="font-bold">{brightness}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1.5 rounded-full cursor-pointer bg-zinc-800"
                    />
                </div>

                {/* Volume */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-zinc-400 items-center">
                        <span className="flex items-center gap-1.5 font-medium"><Volume2 size={14} /> Sound Volume</span>
                        <span className="font-bold">{volume}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        onMouseUp={(e) => playVolumeSound(parseInt(e.target.value))}
                        onTouchEnd={(e) => playVolumeSound(parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1.5 rounded-full cursor-pointer bg-zinc-800"
                    />
                </div>
            </div>

            {/* Battery Indicator */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                    {isCharging ? <BatteryCharging className="text-emerald-400" size={16} /> : <Battery size={16} />}
                    <span className="font-medium">Battery Status</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                    <span>{batteryLevel}%</span>
                    {isCharging && <span className="text-[10px] text-emerald-400 font-normal">(Charging)</span>}
                </div>
            </div>

            {/* Wallpaper Selection */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <ImageIcon size={14} /> Desktop Wallpaper
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {wallpapersList.map((wp) => {
                        const isActive = wallpaper === wp.path;
                        return (
                            <button
                                key={wp.path}
                                onClick={() => setWallpaper(wp.path)}
                                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                                    isActive 
                                        ? "bg-blue-600 border-blue-500 text-white" 
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                                }`}
                            >
                                {wp.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ControlCenter;
