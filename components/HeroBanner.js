"use client";
import { useEffect, useRef } from "react";

export default function HeroBanner() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let snowflakes = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.offsetWidth;
      const cssHeight = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initSnowflakes();
    };

    const initSnowflakes = () => {
      snowflakes = [];
      const count = Math.max(
        8,
        Math.floor((canvas.width * canvas.height) / (5000 * (window.devicePixelRatio || 1)))
      );
      for (let i = 0; i < count; i++) {
        const isStar = Math.random() < 0.2;
        snowflakes.push({
          x: Math.random() * canvas.width / (window.devicePixelRatio || 1),
          y: Math.random() * canvas.height / (window.devicePixelRatio || 1),
          radius: isStar ? Math.random() * 1.5 + 2 : Math.random() * 3 + 1.5,
          speed: Math.random() * 1.2 + 0.6,
          drift: Math.random() * 0.6 - 0.3,
          isStar,
          opacity: isStar ? 1 : 0.9,
          sparklePhase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: isStar ? (Math.random() - 0.5) * 0.05 : 0,
        });
      }
    };

    const drawSnowflakes = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snowflakes.forEach((flake) => {
        const fx = flake.x;
        const fy = flake.y;
        if (flake.isStar) {
          const pulseOpacity = 0.6 + Math.sin(flake.sparklePhase) * 0.4;
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(flake.rotation);
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(255, 215, 0, ${pulseOpacity})`;
          ctx.fillStyle = `rgba(255, 215, 0, ${pulseOpacity})`;
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
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(0, 0, flake.radius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, pulseOpacity + 0.2)})`;
          ctx.fill();
          ctx.restore();
        } else {
          ctx.shadowBlur = 3;
          ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
          ctx.beginPath();
          ctx.arc(fx, fy, flake.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });
    };

    const updateSnowflakes = () => {
      const height = canvas.height / (window.devicePixelRatio || 1);
      const width = canvas.width / (window.devicePixelRatio || 1);
      snowflakes.forEach((flake) => {
        flake.y += flake.speed;
        flake.x += flake.drift;
        if (flake.isStar) {
          flake.sparklePhase += 0.08;
          flake.rotation += flake.rotationSpeed;
        }
        if (flake.y > height + 20) flake.y = -10;
        if (flake.x > width + 20) flake.x = -10;
        else if (flake.x < -20) flake.x = width + 10;
      });
    };

    const animate = () => {
      drawSnowflakes();
      updateSnowflakes();
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const openChristmasOffer = () => {
    window.open("/christmas-offer", "_blank");
  };  

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#c41e3a] via-[#d42e3f] to-[#165b33] py-1 sm:py-2">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: "100%", height: "100%" }}
      />

      <div className="relative flex items-center justify-end w-full px-4 sm:px-6 z-20">
        {/* ENROLL NOW button opens a blank page */}
        <button
          type="button"
          onClick={openChristmasOffer}
          className="px-4 sm:px-6 py-1.5 sm:py-2 font-bold rounded-[7px] text-xs sm:text-sm lg:text-base transition-all duration-300 transform hover:scale-105 shadow-lg border-2 relative z-30"
          style={{
            backgroundImage: "linear-gradient(90deg, #c41e3a 0%, #d42e3f 45%, #1b7a3a 100%)",
            color: "#ffffff",
            borderColor: "#ffffff",
            boxShadow:
              "0 0 12px rgba(255,255,255,0.45), 0 6px 18px rgba(0,0,0,0.18), inset 0 -2px 6px rgba(0,0,0,0.06)",
          }}
        >
          🎄 ENROLL NOW 🎄
        </button>

        {/* Scrolling Text (unchanged) */}
        <div
          className="absolute left-0 overflow-hidden whitespace-nowrap"
          style={{ right: "min(8vw, 180px)" }}
        >
          <div className="marquee-track text-sm sm:text-lg md:text-xl xl:text-2xl font-bold text-white drop-shadow-lg">
            <span>
              🎅 CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎁
              CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎅
              CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎁
              CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎅
            </span>
            <span>
              🎅 CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎁
              CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎅
              CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎁
              CHRISTMAS SPECIAL! Java • Python Full Stack + AI • Data Analytics — Join Today 🎅
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track {
          display: inline-flex;
          white-space: nowrap;
          width: 200%;
          animation: marquee 25s linear infinite;
          will-change: transform;
        }
        @media (min-width: 2560px) {
          .marquee-track {
            font-size: 1.8rem;
            animation-duration: 35s;
          }
        }
        @media (min-width: 1920px) and (max-width: 2559px) {
          .marquee-track {
            font-size: 1.5rem;
            animation-duration: 30s;
          }
        }
        @media (max-width: 768px) {
          .marquee-track {
            animation-duration: 18s;
          }
        }
      `}</style>
    </section>
  );
}
