import { WindowControls } from "#components"
import WindowWrapper from "#hoc/WindowWrapper"
import { gallery } from "#constants"
import useWindowStore from "#store/window"

const Gallery = () => {
  const { openWindow } = useWindowStore()
  return (
    <>
        <div id="window-header">
            <WindowControls target="photos" />
            <h2>Gallery</h2>
        </div>

        <div className="gallery-container overflow-y-auto h-full p-4 bg-white">
            <div className="bento-grid grid gap-4" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gridAutoRows: 'minmax(200px, auto)'
            }}>
                {gallery.map((item, index) => (
                    <div 
                        key={item.id} 
                        className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                        style={{
                            gridColumn: index % 5 === 0 ? 'span 2' : 'span 1',
                            gridRow: index % 4 === 0 ? 'span 2' : 'span 1'
                        }}
                        onClick={() => openWindow("imgfile", { name: `Gallery ${item.id}`, imageUrl: item.img })}
                    >
                        <img 
                            src={item.img} 
                            alt={`Gallery ${item.id}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ))}
            </div>
        </div>
    </>
  )
}

const GalleryWindow = WindowWrapper(Gallery, "photos")

export default GalleryWindow
