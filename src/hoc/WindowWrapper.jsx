import useWindowStore from "#store/window"
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/all";

const WindowWrapper = (Component, windowKey) => {
    const Wrapped = (props) => {
        const {focusWindow, windows} = useWindowStore();
        const { isOpen, zIndex} = windows[windowKey]
        const ref = useRef(null)
        const lastIsOpen = useRef(isOpen)

        useGSAP(() => {
            const el = ref.current
            if(!el) return

            if (isOpen) {
                el.style.display = 'block'
                gsap.fromTo(el, 
                    {scale: 0.8, opacity: 0, y:40},
                    {scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "power3.out"}
                )
            } else if (lastIsOpen.current && !isOpen) {
                gsap.fromTo(el, 
                    {scale: 1, opacity: 1, y: 0},
                    {
                        scale: 0.8, 
                        opacity: 0, 
                        y: 40, 
                        duration: 0.3, 
                        ease: "power3.inOut",
                        onComplete: () => {
                            el.style.display = 'none'
                        }
                    }
                )
            } else {
                if (!isOpen) {
                    el.style.display = 'none'
                }
            }
            lastIsOpen.current = isOpen
        }, [isOpen])

        useGSAP(() => {
            const el = ref.current
            if(!el) return

            const [instance] = Draggable.create(el, {onPress: () => focusWindow(windowKey)})
            
            return () => instance.kill()
        },[])

        return <section 
            id={windowKey} 
            ref={ref} 
            style={{zIndex}}
            className="absolute"
            onMouseDown={() => focusWindow(windowKey)}
        >
            <Component {...props}/>
        </section>
    }
    Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`
    return Wrapped
}

export default WindowWrapper
