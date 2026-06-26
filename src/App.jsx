import { Dock, Home, Navbar, Welcome, Wallpaper, Spotlight, ControlCenter } from "#components";
import { Draggable } from "gsap/Draggable"
import gsap from "gsap";
import { Terminal, Safari, Resume, Finder, Text, Image, Contact, Gallery } from "#windows";
import useSettingsStore from "#store/settings";
gsap.registerPlugin(Draggable)

const App = () => {
  const brightness = useSettingsStore((state) => state.brightness);
  const brightnessOpacity = (100 - brightness) / 100;

  return (
    <main>
      <Wallpaper />
      <Navbar />
      <Welcome />
      <Dock />

      <Spotlight />
      <ControlCenter />

      <Terminal/>
      <Safari/>
      <Resume/>
      <Finder />
      <Text />
      <Image />
      <Contact/>
      <Home/>
      <Gallery/>

      {brightnessOpacity > 0 && (
        <div 
          className="fixed inset-0 bg-black pointer-events-none select-none" 
          style={{ zIndex: 99999, opacity: brightnessOpacity }}
        />
      )}
    </main>
  )
}
 
export default App
