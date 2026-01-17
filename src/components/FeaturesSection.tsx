"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Cloud, Cpu, Layers, ScanSearch, ShieldCheck, Sparkles, Zap, ArrowRight } from "lucide-react";
import GlassCard from "./ui/GlassCard";

const features = [
  {
    icon: Cpu,
    title: "Local model execution",
    description: "Runs on your device for fast, private AI detection with zero data transmission.",
    gradient: "from-purple-500/20 to-violet-500/10",
    iconColor: "text-purple-400",
    size: "large",
  },
  {
    icon: ScanSearch,
    title: "Forensic confidence score",
    description: "Breaks down signal strength with calibrated certainty levels.",
    gradient: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
    size: "small",
  },
  {
    icon: Layers,
    title: "Heatmap overlays",
    description: "Visualize where synthetic artifacts concentrate in the frame.",
    gradient: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
    size: "small",
  },
  {
    icon: ShieldCheck,
    title: "Zero retention",
    description: "Images stay local and are never uploaded to any server.",
    gradient: "from-emerald-500/20 to-green-500/10",
    iconColor: "text-emerald-400",
    size: "medium",
  },
  {
    icon: Cloud,
    title: "Server API",
    description: "Send images to our servers and get a clear score back fast.",
    gradient: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400",
    badge: "Coming Soon",
    size: "medium",
  },
  {
    icon: Zap,
    title: "Realtime analysis",
    description: "Average response stays under two seconds for most images.",
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
    size: "small",
  },
  {
    icon: Sparkles,
    title: "Free to use",
    description: "Unlimited scans while we prepare the production launch.",
    gradient: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    size: "small",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6"
    >
      <GlassCard hover={false} glow="cyan" className="p-8 sm:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gray-300">
              Feature Set
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-white">Detection built for </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              creators, teams, and investigators
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-gray-400">
            <span className="text-white font-medium">Local AI inference</span>{" "}
            keeps images on your machine while still delivering forensic-grade insights.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid auto-rows-[minmax(160px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            const isLarge = feature.size === "large";
            const isMedium = feature.size === "medium";

            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className={`
                  ${isLarge ? "md:col-span-2 lg:col-span-2 lg:row-span-2" : ""}
                  ${isMedium ? "md:col-span-1 lg:col-span-2" : ""}
                `}
              >
                <motion.div
                  className={`
                    group relative h-full overflow-hidden rounded-2xl
                    border border-white/[0.08]
                    bg-gradient-to-br ${feature.gradient}
                    p-6 backdrop-blur-sm
                    transition-all duration-500
                    hover:border-white/20
                    hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]
                  `}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Glass shine */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    }}
                  />

                  {/* Animated glow on hover */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${feature.iconColor.replace("text-", "rgba(").replace("-400", ", 0.2)")}, transparent)`,
                    }}
                  />

                  <div className="relative z-10 flex h-full flex-col">
                    {/* Icon */}
                    <div className={`
                      mb-4 flex h-12 w-12 items-center justify-center rounded-xl
                      border border-white/10 bg-white/5
                      transition-all duration-300
                      group-hover:scale-110 group-hover:border-white/20
                      ${isLarge ? "h-14 w-14" : ""}
                    `}>
                      <Icon className={`${isLarge ? "h-7 w-7" : "h-5 w-5"} ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                    </div>

                    {/* Badge */}
                    {feature.badge && (
                      <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-300">
                        {feature.badge}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className={`font-semibold text-white ${isLarge ? "text-xl" : "text-base"}`}>
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className={`mt-2 flex-grow text-gray-400 ${isLarge ? "text-sm" : "text-xs"}`}>
                      {feature.description}
                    </p>

                    {/* Learn more link (for large cards) */}
                    {isLarge && (
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-purple-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
                        <span>Learn more</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom illustration section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 blur-xl" />

            <div className="relative overflow-hidden bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl">
              <Image
                src="/AI-human.png"
                alt="AI and human signal nexus illustration"
                width={1024}
                height={1024}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                className="h-64 w-full object-cover opacity-80 transition-all duration-500 hover:scale-105 hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-300">
                  Powered by Advanced Neural Networks
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  Let&apos;s detect the{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    FAKE
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </GlassCard>
    </section>
  );
}
