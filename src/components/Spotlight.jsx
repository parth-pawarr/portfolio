import { useState, useEffect, useRef } from "react";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import { locations } from "#constants";
import { Search, Sparkles } from "lucide-react";
import gsap from "gsap";

const Spotlight = () => {
    const { isSpotlightOpen, toggleSpotlight, openWindow } = useWindowStore();
    const { setActiveLocation } = useLocationStore();
    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // List of searchable items
    const searchItems = [
        { id: "finder", name: "Portfolio (Finder)", type: "System App", icon: "/images/finder.png", desc: "Browse file directory and works", action: () => openWindow("finder") },
        { id: "safari", name: "Articles (Safari)", type: "System App", icon: "/images/safari.png", desc: "Read developer articles and blog posts", action: () => openWindow("safari") },
        { id: "photos", name: "Gallery (Photos)", type: "System App", icon: "/images/photos.png", desc: "Browse developer photos and screenshots", action: () => openWindow("photos") },
        { id: "contact", name: "Contact details", type: "System App", icon: "/images/contact.png", desc: "Get in touch on GitHub, Twitter, LinkedIn", action: () => openWindow("contact") },
        { id: "terminal", name: "Skills (Terminal)", type: "System App", icon: "/images/terminal.png", desc: "View tech stack or run interactive commands", action: () => openWindow("terminal") },
        { id: "resume", name: "Resume (Preview)", type: "System App", icon: "/images/pdf.png", desc: "View or download official resume", action: () => openWindow("resume") },
        // Projects
        { 
            id: "nike", 
            name: "Nike Ecommerce Storefront", 
            type: "Project", 
            icon: "/images/folder.png", 
            desc: "Next.js & Tailwind responsive shopping application", 
            action: () => {
                setActiveLocation(locations.work?.children?.[0]);
                openWindow("finder");
            }
        },
        { 
            id: "resume-analyzer", 
            name: "AI Resume Analyzer", 
            type: "Project", 
            icon: "/images/folder.png", 
            desc: "AI powered recruiter scoring and feedback engine", 
            action: () => {
                setActiveLocation(locations.work?.children?.[1]);
                openWindow("finder");
            }
        },
        { 
            id: "food-delivery", 
            name: "Food Delivery App", 
            type: "Project", 
            icon: "/images/folder.png", 
            desc: "React Native & Expo cross platform mobile application", 
            action: () => {
                setActiveLocation(locations.work?.children?.[2]);
                openWindow("finder");
            }
        },
    ];

    // Filter items
    const filteredItems = searchItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.desc.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
    );

    // Keyboard shortcut listeners (Cmd+K / Ctrl+K and Escape)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                toggleSpotlight();
            }
            if (e.key === "Escape" && isSpotlightOpen) {
                toggleSpotlight(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSpotlightOpen, toggleSpotlight]);

    // Handle open/close GSAP animations
    useEffect(() => {
        if (isSpotlightOpen) {
            setSearch("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            
            gsap.fromTo(containerRef.current,
                { scale: 0.95, opacity: 0, y: -20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
            );
        }
    }, [isSpotlightOpen]);

    const handleSelect = (item) => {
        item.action();
        toggleSpotlight(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        }
    };

    if (!isSpotlightOpen) return null;

    return (
        <div 
            className="fixed inset-0 w-screen h-screen bg-black/15 backdrop-blur-xs flex justify-center items-start pt-[15vh]"
            style={{ zIndex: 99995 }}
            onClick={() => toggleSpotlight(false)}
        >
            <div 
                ref={containerRef}
                className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-georama"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
                    <Search className="text-zinc-400 size-5 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Spotlight Search..."
                        className="bg-transparent text-white placeholder-zinc-500 outline-none w-full text-lg border-none focus:ring-0 p-0"
                        autoComplete="off"
                        autoCapitalize="none"
                    />
                    <div className="text-zinc-500 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 select-none flex-shrink-0">
                        <Sparkles size={12} className="text-amber-400" /> AI powered
                    </div>
                </div>

                {filteredItems.length > 0 ? (
                    <ul className="max-h-[350px] overflow-y-auto p-2 mac-scrollbar">
                        {filteredItems.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (
                                <li
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-default select-none transition-colors duration-150 ${
                                        isSelected 
                                            ? "bg-blue-600 text-white" 
                                            : "hover:bg-white/5 text-zinc-300"
                                    }`}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={item.icon} alt={item.name} className="size-8 object-contain" />
                                        <div>
                                            <p className="font-semibold text-sm leading-tight">{item.name}</p>
                                            <p className={`text-xs ${isSelected ? "text-blue-100" : "text-zinc-500"}`}>{item.desc}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                        isSelected 
                                            ? "bg-white/10 border-white/20 text-white" 
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                    }`}>
                                        {item.type}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-zinc-500 select-none">
                        No results for "{search}"
                    </div>
                )}
                
                <div className="bg-zinc-950/40 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 select-none">
                    <div className="flex gap-3">
                        <span>↑↓ to navigate</span>
                        <span>↵ to open</span>
                    </div>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    );
};

export default Spotlight;
