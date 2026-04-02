import {Dock, Navbar, Welcome} from "#components";
import { Draggable } from "gsap/Draggable"
import gsap from "gsap";
import { Terminal, Safari, Resume, Finder } from "#windows";
gsap.registerPlugin(Draggable)

const App = () => {
  return (
    <main>
      <Navbar />
      <Welcome />
      <Dock />

      <Terminal/>
      <Safari/>
      <Resume/>
      <Finder />
    </main>
  )
}
 
export default App
