import { useState, useEffect } from "react"
import { navLinks, navIcons } from "#constants"
import useWindowStore from "#store/window"
import dayjs from "dayjs"

const Navbar = () => {
    const { openWindow, toggleSpotlight, toggleControlCenter } = useWindowStore()
    const [time, setTime] = useState(dayjs().format("ddd MMM D h:mm A"))

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(dayjs().format("ddd MMM D h:mm A"))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <nav>
            <div>
                <img src="/images/logo.svg" alt="Apple Logo" />
                <p className="font-bold">Parth's Portfolio</p>
                <ul>
                    {navLinks.map(({id, name, type}) => (
                        <li key={id} onClick={() => openWindow(type)} className="cursor-pointer hover:bg-black/5 px-2 py-0.5 rounded transition-all">
                            <p>{name}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <ul>
                    {navIcons.map(({ id, img }) => {
                        const handleClick = () => {
                            if (id === 1) toggleControlCenter()
                            if (id === 2) toggleSpotlight()
                            if (id === 3) openWindow("contact")
                            if (id === 4) toggleControlCenter()
                        }
                        return (
                            <li key={id} onClick={handleClick} className="cursor-pointer hover:bg-black/5 p-1 rounded transition-all flex items-center justify-center">
                                <img src={img} className="size-4" alt={`icon-${id}`} />
                            </li>
                        )
                    })}
                </ul>
                <time className="ml-2 select-none">{time}</time>
            </div>
        </nav>
    )
}

export default Navbar
