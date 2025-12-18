"use client";
import { useEffect, useRef } from "react";

export default function FullImage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let snowflakes = [];

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initSnowflakes();
    };

    const initSnowflakes = () => {
      snowflakes = [];
      const count = Math.floor((canvas.width * canvas.height) / 8000); // Reduced density
      for (let i = 0; i < count; i++) {
        const isStar = Math.random() < 0.2; // 20% chance to be a falling star
        
        snowflakes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: isStar ? Math.random() * 1.5 + 1.8 : Math.random() * 2.5 + 1.2,
          speed: Math.random() * 1 + 0.5,
          drift: Math.random() * 0.5 - 0.25,
          isStar: isStar,
          opacity: isStar ? 0.9 : 0.75,
          sparklePhase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: isStar ? (Math.random() - 0.5) * 0.05 : 0,
        });
      }
    };

    const drawSnowflakes = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((flake) => {
        if (flake.isStar) {
          // Calculate pulsing opacity for sparkle effect
          const pulseOpacity = (0.6 + Math.sin(flake.sparklePhase) * 0.3) * flake.opacity;
          
          ctx.save();
          ctx.translate(flake.x, flake.y);
          ctx.rotate(flake.rotation);
          
          // Draw yellow star with strong golden glow
          ctx.shadowBlur = 12;
          ctx.shadowColor = `rgba(255, 215, 0, ${pulseOpacity * 0.8})`;
          ctx.fillStyle = `rgba(255, 215, 0, ${pulseOpacity})`;
          
          // Draw 4-pointed star
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? flake.radius : flake.radius * 0.4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          
          // Add extra bright golden center
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(255, 223, 0, ${pulseOpacity})`;
          ctx.beginPath();
          ctx.arc(0, 0, flake.radius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 223, 0, ${Math.min(1, pulseOpacity + 0.2)})`;
          ctx.fill();
          
          // Add outer glow ring
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(255, 215, 0, ${pulseOpacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(0, 0, flake.radius * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 235, 50, ${pulseOpacity})`;
          ctx.fill();
          
          ctx.restore();
        } else {
          // Draw regular white snowflake with subtle glow
          ctx.shadowBlur = 2;
          ctx.shadowColor = `rgba(255, 255, 255, ${flake.opacity * 0.4})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
      });
    };

    const updateSnowflakes = () => {
      snowflakes.forEach((flake) => {
        flake.y += flake.speed;
        flake.x += flake.drift;

        // Update sparkle animation for stars
        if (flake.isStar) {
          flake.sparklePhase += 0.08;
          flake.rotation += flake.rotationSpeed;
        }

        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }

        if (flake.x > canvas.width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = canvas.width;
        }
      });
    };

    const animate = () => {
      drawSnowflakes();
      updateSnowflakes();
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Desktop Image */}
      <img
        src="/Home page images/Home Page - 3840 x 2160.jpg"
        alt="Desktop View"
        className="hidden sm:block w-full h-full object-cover"
      />

      {/* Mobile Image */}
      <img
        src="/Home page images/Home Page - 1080 x 920.jpg"
        alt="Mobile View"
        className="block sm:hidden w-full h-full object-cover"
        loading="eager"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Snowfall Canvas - Positioned between overlay and text */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Hero Text */}
      <div className="absolute left-5 sm:left-10 top-1/2 transform -translate-y-1/2 text-left z-20">
        <h1 className="text-[#ffd02b] font-extrabold uppercase text-3xl sm:text-5xl md:text-6xl leading-tight drop-shadow-lg">
          <span className="block mb-4 sm:mb-6 md:mb-8">Your</span>
          <span className="block mb-4 sm:mb-6 md:mb-8">Trusted Training</span>
          <span className="block mb-4 sm:mb-6 md:mb-8">&</span>
          <span className="block">Placement Hub</span>
        </h1>
      </div>
    </section>
  );
}