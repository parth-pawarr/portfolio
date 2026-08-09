import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";
import FlappyBirdApp from "../components/Games/flappyBird";
import useWindowStore from "#store/window";

const FlappyBird = () => {
  const { activeWindow, windows } = useWindowStore();
  const isFocused = activeWindow === "flappybird" && windows.flappybird?.isOpen;

  return (
    <>
      <div id="window-header">
        <WindowControls target="flappybird" />
        <h2 className="text-white text-sm font-semibold pl-2">Flappy Bird</h2>
      </div>

      <div className="flex-1 w-full h-full relative" style={{ width: '400px', height: '600px' }}>
        <FlappyBirdApp isFocused={isFocused} />
      </div>
    </>
  );
};

const FlappyBirdWindow = WindowWrapper(FlappyBird, "flappybird");

export default FlappyBirdWindow;
