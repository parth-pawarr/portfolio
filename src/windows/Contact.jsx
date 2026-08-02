import { useEffect, useState } from "react"
import { WindowControls } from "#components"
import WindowWrapper from "#hoc/WindowWrapper"
import { socials } from "#constants"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState({ type: "idle", message: "" })

  useEffect(() => {
    if (status.type !== "success") return undefined

    const timer = window.setTimeout(() => {
      setFormData({ name: "", email: "", message: "" })
      setStatus({ type: "idle", message: "" })
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [status.type])

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = "Please enter your name."
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your email."
    } else if (!emailPattern.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address."
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Please include a short message."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      setStatus({ type: "error", message: "Please fix the highlighted fields and try again." })
      return
    }

    setIsSending(true)
    setStatus({ type: "idle", message: "" })

    const endpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT

    if (!endpoint) {
      window.setTimeout(() => {
        setIsSending(false)
        setStatus({
          type: "error",
          message: "The contact endpoint is not configured yet. Add VITE_CONTACT_FORM_ENDPOINT to enable live submissions.",
        })
      }, 900)
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Submission failed")
      }

      setIsSending(false)
      setStatus({ type: "success", message: "Message sent!" })
    } catch {
      setIsSending(false)
      setStatus({
        type: "error",
        message: "Something went wrong while sending the message. Please try again later.",
      })
    }
  }

  return (
    <>
      <div id="window-header">
        <WindowControls target="contact" />
        <h2>Contact me</h2>
      </div>

      <div className="max-h-[480px] overflow-y-auto p-5 space-y-5 text-zinc-100">
        <img
          src="/images/Pic4.jpg"
          alt="Parth"
          className="w-20 rounded-full object-cover"
        />

        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Let's Connect</h3>
          <p className="text-sm text-zinc-400">Got an Idea? A bug to squash? I'm in!!</p>
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {socials.map(({ id, bg, link, icon, text }) => (
            <li key={id} style={{ backgroundColor: bg }} className="rounded-full">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                title={text}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white"
              >
                <img src={icon} alt={text} className="size-5" />
                <p>{text}</p>
              </a>
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 pt-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                }}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
              {errors.name && <p className="text-xs text-amber-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, email: event.target.value }))
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                }}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
              {errors.email && <p className="text-xs text-amber-400">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                rows="4"
                value={formData.message}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, message: event.target.value }))
                  if (errors.message) setErrors((prev) => ({ ...prev, message: "" }))
                }}
                placeholder="Tell me about your idea or project..."
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
              {errors.message && <p className="text-xs text-amber-400">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSending ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Sending...
                </span>
              ) : status.type === "success" ? (
                <span className="flex items-center gap-2">
                  <span className="text-base">✓</span>
                  Message sent!
                </span>
              ) : (
                "Send Message"
              )}
            </button>

            {status.type === "error" && status.message && (
              <p className="text-sm text-amber-400">{status.message}</p>
            )}
          </form>
        </div>
      </div>
    </>
  )
}

const ContactWindow = WindowWrapper(Contact, "contact")

export default ContactWindow