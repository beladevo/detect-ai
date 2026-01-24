import Image from "next/image";

const storyBlocks = [
  {
    title: "Badges you can trust",
    detail:
      "Badges float above images with clear AI or real labels and tooltips, so you instantly know what the detector found without leaving the tab.",
  },
  {
    title: "Control at your fingertips",
    detail:
      "Toggle badge visibility, block specific hosts, and enter your Imagion key once—your preferences sync to Chrome’s storage so the extension mirrors your dashboard experience.",
  },
  {
    title: "Always-on context",
    detail:
      "A lightweight service worker keeps verdicts ready, avoids repeated work, and keeps the badge experience smooth and responsive even on busy pages.",
  },
];

export default function ExtensionSection() {
  return (
    <section
      id="extension"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">
          Extension
        </p>
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Guard your browsing session
        </h2>
        <p className="mx-auto max-w-3xl text-base text-foreground/70">
          Imagion’s badge lives everywhere you go online. It highlights AI detections in real-time, explains each verdict,
          and lets you pause or customize coverage per site—no extra tabs, logins, or guesswork required.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5 rounded-3xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-xl">
          <p className="text-foreground/80">
            Bright badges, friendly tooltips, and a quick download button keep you connected to Imagion even while you browse social media, news, or marketplaces.
          </p>
          <div className="grid gap-4">
            {storyBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-2xl border border-border/70 bg-card/50 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">{block.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{block.detail}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://chrome.google.com/webstore/search/imagion"
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundImage: "linear-gradient(90deg, var(--brand-purple), var(--brand-pink))",
              }}
              className="inline-flex items-center justify-center rounded-full bg-brand-purple px-6 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brand-purple/40 transition hover:from-brand-purple hover:to-brand-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
            >
              <span className="mr-2 text-base leading-none">✨</span>
              Install the extension
              <span className="ml-2 text-xs font-normal uppercase tracking-[0.3em] text-white/80">Free</span>
            </a>
            <span className="text-xs text-foreground/60">
              Open the Imagion listing on the Chrome Web Store to install the badge in one click and keep verdicts on every page.
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-b from-card/90 to-card/60 p-4 shadow-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/30">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
            <Image
              src="/extension-screenshot.svg"
              alt="Stylized Imagion badge overlay on a browser window"
              width={900}
              height={520}
              priority
              className="relative z-10 h-full w-full object-cover"
            />
          </div>
          <p className="mt-4 text-sm text-foreground/60">
            The visualization shows how Imagion badges hug AI-sensitive visuals while staying legible on any page layout.
          </p>
        </div>
      </div>
    </section>
  );
}
