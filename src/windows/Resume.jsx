import { useState, useEffect } from "react"
import { WindowControls } from "#components"
import WindowWrapper from "#hoc/WindowWrapper"
import { Download } from "lucide-react"

import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const Resume = () => {
  const [numPages, setNumPages] = useState(null)
  const [pageWidth, setPageWidth] = useState(550)

  useEffect(() => {
    const handleResize = () => {
      const w = Math.min(window.innerWidth - 64, 550)
      setPageWidth(w)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <>
      <div id="window-header">
        <WindowControls target="resume" />
        <h2>Resume.pdf</h2>
        <a href="files/resume.pdf" download className="cursor-pointer" title="Download resume">
          <Download className="icon" />
        </a>
      </div>

      <div 
        className="overflow-y-auto max-h-[65vh] w-full mac-scrollbar bg-gray-100 flex flex-col items-center py-4 px-6 select-none touch-pan-y" 
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <Document file="files/resume.pdf" onLoadSuccess={onDocumentLoadSuccess} className="flex flex-col gap-4">
          {Array.from(new Array(numPages), (_, index) => (
            <div key={index} className="shadow-lg rounded border border-gray-200 bg-white">
              <Page
                pageNumber={index + 1}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                width={pageWidth}
              />
            </div>
          ))}
        </Document>
      </div>
    </>
  )
}

const ResumeWindow = WindowWrapper(Resume, "resume")

export default ResumeWindow