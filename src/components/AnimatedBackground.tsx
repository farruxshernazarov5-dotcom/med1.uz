interface AnimatedBackgroundProps {
  variant?: "medical" | "pulse" | "waves" | "particles" | "dna" | "heartbeat" | "cells";
}

const AnimatedBackground = ({ variant = "medical" }: AnimatedBackgroundProps) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {variant === "medical" && (
        <>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-medical-green/5 rounded-full blur-2xl animate-pulse-slow" />
          {/* Medical cross pattern */}
          <svg className="absolute top-10 right-10 w-16 h-16 text-primary/5 animate-float" style={{ animationDelay: "1s" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
          </svg>
          <svg className="absolute bottom-20 left-20 w-12 h-12 text-secondary/5 animate-float" style={{ animationDelay: "3s" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
          </svg>
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
      {variant === "dna" && (
        <>
          {/* DNA helix-inspired floating shapes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${8 + (i % 3) * 4}px`,
                height: `${8 + (i % 3) * 4}px`,
                background: i % 2 === 0 ? "hsl(var(--primary) / 0.12)" : "hsl(var(--secondary) / 0.12)",
                top: `${10 + i * 10}%`,
                left: `${20 + Math.sin(i * 0.8) * 30}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            />
          ))}
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 400">
            <path d="M60,0 Q100,50 60,100 Q20,150 60,200 Q100,250 60,300 Q20,350 60,400" stroke="hsl(var(--primary))" fill="none" strokeWidth="1" />
            <path d="M140,0 Q100,50 140,100 Q180,150 140,200 Q100,250 140,300 Q180,350 140,400" stroke="hsl(var(--secondary))" fill="none" strokeWidth="1" />
          </svg>
          <div className="absolute top-0 right-0 w-80 h-80 bg-medical-green/5 rounded-full blur-3xl animate-pulse-slow" />
        </>
      )}
      {variant === "heartbeat" && (
        <>
          {/* EKG line */}
          <svg className="absolute bottom-1/3 left-0 w-full h-20 opacity-[0.06]" viewBox="0 0 1200 80" preserveAspectRatio="none">
            <polyline
              points="0,40 200,40 250,40 270,10 290,70 310,20 330,60 350,40 600,40 650,40 670,10 690,70 710,20 730,60 750,40 1000,40 1050,40 1070,10 1090,70 1110,20 1130,60 1150,40 1200,40"
              fill="none"
              stroke="hsl(var(--medical-red))"
              strokeWidth="2"
              className="animate-pulse-slow"
            />
          </svg>
          <div className="absolute top-1/4 right-10 w-6 h-6 text-medical-red/10 animate-pulse-slow">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </div>
          <div className="absolute bottom-10 left-1/4 w-48 h-48 bg-medical-red/5 rounded-full blur-3xl animate-float" />
        </>
      )}
      {variant === "cells" && (
        <>
          {/* Cell-like circles */}
          {Array.from({ length: 10 }).map((_, i) => {
            const size = 20 + Math.random() * 40;
            return (
              <div
                key={i}
                className="absolute rounded-full border animate-float"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderColor: `hsl(var(--${i % 2 === 0 ? "primary" : "secondary"}) / 0.08)`,
                  background: `hsl(var(--${i % 3 === 0 ? "primary" : i % 3 === 1 ? "secondary" : "medical-green"}) / 0.03)`,
                  top: `${Math.random() * 90}%`,
                  left: `${Math.random() * 90}%`,
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: `${5 + i * 0.8}s`,
                }}
              >
                {/* Nucleus */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: `${size * 0.3}px`,
                    height: `${size * 0.3}px`,
                    background: `hsl(var(--primary) / 0.1)`,
                  }}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default AnimatedBackground;
