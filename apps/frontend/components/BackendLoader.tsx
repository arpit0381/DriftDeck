import { motion } from "framer-motion";
import { Server, Zap } from "lucide-react";

export default function BackendLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center z-10"
      >
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center bg-card/50 glass-panel animate-pulse glow-border">
            <Server className="w-10 h-10 text-primary" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-primary border-r-2 border-transparent"
          />
        </div>

        <h2 className="text-2xl font-black font-mono tracking-widest text-primary glow-text mb-3">
          WAKING UP DRIFT DECK OS
        </h2>
        
        <p className="text-muted text-sm max-w-sm text-center flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-accent animate-pulse" />
          Cold-starting the Render cloud backend. This takes about 50 seconds.
        </p>
      </motion.div>
    </div>
  );
}
