import { useEffect, useRef, useState } from "react";
import useSettingsStore from "#store/settings";
import gsap from "gsap";

const Wallpaper = () => {
    const wallpaper = useSettingsStore((state) => state.wallpaper);
    const [currentImg, setCurrentImg] = useState(wallpaper);
    const [prevImg, setPrevImg] = useState(null);
    const activeImgRef = useRef(null);

    useEffect(() => {
        if (wallpaper !== currentImg) {
            setPrevImg(currentImg);
            setCurrentImg(wallpaper);
        }
    }, [wallpaper, currentImg]);

    useEffect(() => {
        if (prevImg && activeImgRef.current) {
            gsap.fromTo(
                activeImgRef.current,
                { opacity: 0 },
                { 
                    opacity: 1, 
                    duration: 0.5, 
                    ease: "power2.out",
                    onComplete: () => {
                        setPrevImg(null);
                    }
                }
            );
        }
    }, [prevImg]);

    return (
        <div 
            className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none select-none"
            style={{ zIndex: -1 }}
        >
            {prevImg && (
                <img
                    src={prevImg}
                    alt="Background Wallpaper Previous"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            <img
                ref={activeImgRef}
                src={currentImg}
                alt="Background Wallpaper"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: prevImg ? 0 : 1 }}
            />
        </div>
    );
};

export default Wallpaper;
