"use client";

import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-slate-950 pointer-events-none">
      <motion.div
        animate={{
          x: ["0%", "20%", "-20%", "0%"],
          y: ["0%", "-20%", "20%", "0%"],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 15,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500 opacity-20 blur-[120px] will-change-transform"
      />
      
      <motion.div
        animate={{
          x: ["0%", "-30%", "20%", "0%"],
          y: ["0%", "30%", "-10%", "0%"],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 20,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600 opacity-20 blur-[150px] will-change-transform"
      />

      <motion.div
        animate={{
          x: ["0%", "15%", "-15%", "0%"],
          y: ["0%", "-15%", "15%", "0%"],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 18,
          ease: "linear",
        }}
        className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-indigo-500 opacity-15 blur-[120px] will-change-transform"
      />
    </div>
  );
}
