import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

const useSettingsStore = create(
    immer((set) => ({
        wallpaper: "/images/wallpaper.jpg",
        brightness: 100,
        volume: 80,
        wifi: true,
        isDarkMode: false,

        setWallpaper: (path) => set((state) => {
            state.wallpaper = path
        }),
        setBrightness: (val) => set((state) => {
            state.brightness = val
        }),
        setVolume: (val) => set((state) => {
            state.volume = val
        }),
        toggleWifi: () => set((state) => {
            state.wifi = !state.wifi
        }),
        toggleDarkMode: () => set((state) => {
            state.isDarkMode = !state.isDarkMode
            if (typeof document !== "undefined") {
                document.documentElement.classList.toggle("dark", state.isDarkMode)
            }
            // Automatically switch between light and dark wallpapers if user is using default wallpapers
            if (state.isDarkMode) {
                if (state.wallpaper === "/images/wallpaper.jpg") {
                    state.wallpaper = "/images/wallpaper1.png"
                }
            } else {
                if (state.wallpaper === "/images/wallpaper1.png") {
                    state.wallpaper = "/images/wallpaper.jpg"
                }
            }
        })
    }))
)

export default useSettingsStore
