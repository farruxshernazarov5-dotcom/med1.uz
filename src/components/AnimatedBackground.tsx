interface AnimatedBackgroundProps {
  variant?: "medical" | "pulse" | "waves" | "particles";
}

const AnimatedBackground = ({ variant = "medical" }: AnimatedBackgroundProps) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {variant === "medical" && (
        <>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-medical-green/5 rounded-full blur-2xl animate-pulse-slow" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </>
      )}
      {variant === "pulse" && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10 animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-secondary/10 animate-pulse-slow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-primary/15 animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </>
      )}
      {variant === "waves" && (
        <>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none">
            <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1350,30 1440,60 L1440,120 L0,120 Z" fill="hsl(var(--primary)/0.03)" className="animate-pulse-slow" />
            <path d="M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z" fill="hsl(var(--secondary)/0.03)" className="animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
          </svg>
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        </>
      )}
      {variant === "particles" && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/10 animate-float"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 16}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${5 + i}s`,
              }}
            />
          ))}
          <div className="absolute -top-10 -left-10 w-60 h-60 bg-medical-purple/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-medical-teal/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </>
      )}
    </div>
  );
};

export default AnimatedBackground;
