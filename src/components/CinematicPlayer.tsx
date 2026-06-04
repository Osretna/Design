import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCw, Volume2, VolumeX, Sparkles, Download, Sliders, Eye } from "lucide-react";

interface Props {
  imageUrl: string;
  prompt: string;
  aspectRatio: string;
  lang: "ar" | "en";
  onDownloadImage?: () => void;
}

type MotionProfileId = "handheld" | "wind" | "water" | "3d_perspective" | "character_movement";

interface MotionProfile {
  id: MotionProfileId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  emoji: string;
}

export default function CinematicPlayer({ imageUrl, prompt, aspectRatio, lang, onDownloadImage }: Props) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [motionProfile, setMotionProfile] = useState<MotionProfileId>("handheld");
  const [motionStrength, setMotionStrength] = useState<number>(1.2); // 0.5 to 2.5
  const [lightLeakIntensity, setLightLeakIntensity] = useState<number>(1.0); // 0 to 2.0

  // Free AI Character/Puppet Motion Engine States
  const [characterHeadPin, setCharacterHeadPin] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.35 });
  const [characterBodyPin, setCharacterBodyPin] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.62 });
  const [activePinSelection, setActivePinSelection] = useState<"head" | "body" | null>(null);
  const [isFaceTalking, setIsFaceTalking] = useState<boolean>(true);
  const [isBodyBreathing, setIsBodyBreathing] = useState<boolean>(true);
  const [isCharacterWalking, setIsCharacterWalking] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Smooth lerp values for 3D holographic tilt and handheld sway
  const targetMousePos = useRef({ x: 0, y: 0 });
  const currentMousePos = useRef({ x: 0, y: 0 });

  const profiles: MotionProfile[] = [
    {
      id: "handheld",
      nameAr: "اهتزاز الكاميرا الطبيعي",
      nameEn: "Handheld Camera Sway",
      descAr: "حركة تنفس الكاميرا الطبيعية لتجسيد البعد وزوايا السينما البطيئة",
      descEn: "Organic organic breathing camera movement with fluid perspective sway",
      emoji: "🎥",
    },
    {
      id: "wind",
      nameAr: "مهب الرياح الحية",
      nameEn: "Live Wind Breeze",
      descAr: "تمويج تفاضلي يحاكي ملاطفة تيارات الهواء البارد للشعر والأقمشة والعشب",
      descEn: "Differential wave displacement simulating wind breezes across soft details",
      emoji: "🍃",
    },
    {
      id: "water",
      nameAr: "تموجات ومحاكاة مائية",
      nameEn: "Fluid Water Ripples",
      descAr: "حركة سائلة جيبية متناغمة تعيد الحياة للبحار والبحيرات والبريق اللامع",
      descEn: "Smooth sinusoidal water ripples with active light refractions",
      emoji: "💧",
    },
    {
      id: "3d_perspective",
      nameAr: "المنظور ثلاثي الأبعاد التفاعلي",
      nameEn: "Interactive 3D Perspective",
      descAr: "حرك مؤشر الماوس فوق المشهد لتتحكم بزوايا الكاميرا وعمق التصوير يدوياً",
      descEn: "Move your pointer across the frame to dynamically pan the 3D camera",
      emoji: "✨",
    },
    {
      id: "character_movement",
      nameAr: "الذكاء الحركي للشخصيات",
      nameEn: "Character Puppet Motion",
      descAr: "اضغط على الصورة لتحديد الرأس والجسم واجعل الشخصيات تتحرك، تتنفس، وتتحدث مجاناً!",
      descEn: "Pin the head and body to make subjects talk, walk, and breathe fully for free!",
      emoji: "🧍",
    },
  ];

  // CORS-proof image loader to prevent canvas pollution and download errors
  useEffect(() => {
    if (!imageUrl) return;
    setImageElement(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setImageElement(img);
    };
    img.onerror = () => {
      // Direct load failure backup via native server proxy
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(imageUrl)}`;
      const imgProxy = new Image();
      imgProxy.crossOrigin = "anonymous";
      imgProxy.src = proxyUrl;
      imgProxy.onload = () => {
        setImageElement(imgProxy);
      };
      imgProxy.onerror = (e) => {
        console.error("Critical failure loading source canvas image:", e);
      };
    };
  }, [imageUrl]);

  // Capture Mouse Move for 3D Interactive Perspective
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (motionProfile !== "3d_perspective") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    targetMousePos.current = { x: x * 1.8, y: y * 1.8 };
  };

  const handleMouseLeave = () => {
    targetMousePos.current = { x: 0, y: 0 };
  };

  // TOUCH Handler for mobile tracking
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (motionProfile !== "3d_perspective" || e.touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / rect.width - 0.5;
    const y = (touch.clientY - rect.top) / rect.height - 0.5;
    targetMousePos.current = { x: x * 2.0, y: y * 2.0 };
  };

  // Generate particles on canvas and render advanced physics equations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    let animationFrameId: number;
    let widthVal = (canvas.width = canvas.offsetWidth || 720);
    let heightVal = (canvas.height = canvas.offsetHeight || 405);

    // Dynamic resize handler
    const resizeObserver = new ResizeObserver(() => {
      if (canvas) {
        widthVal = canvas.width = canvas.offsetWidth || 720;
        heightVal = canvas.height = canvas.offsetHeight || 405;
      }
    });
    resizeObserver.observe(canvas);

    // Generate floating ambient gold sparks (golden hours embers)
    const particlesCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
      wobbleSpeed: number;
      wobbleRange: number;
      startTime: number;
    }> = [];

    const sparkColors = [
      "rgba(255, 223, 115, 0.45)", // Shimmer gold
      "rgba(255, 255, 255, 0.35)", // Pure soft snow/dust
      "rgba(251, 146, 60, 0.25)",  // Soft warm ember orange
    ];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: Math.random() * widthVal,
        y: Math.random() * heightVal,
        size: Math.random() * 2.4 + 1.2,
        speedX: Math.random() * 0.3 - 0.15,
        speedY: -(Math.random() * 0.6 + 0.2), // Rising slowly simulating thermal currents
        opacity: Math.random() * 0.6 + 0.2,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        wobbleSpeed: Math.random() * 0.02 + 0.005,
        wobbleRange: Math.random() * 1.5 + 0.5,
        startTime: Math.random() * 1000,
      });
    }

    const render = () => {
      const time = Date.now();

      // Clear layout and draw solid deep backing canvas
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, widthVal, heightVal);

      // Lerp mouse coordinate values smoothly
      currentMousePos.current.x += (targetMousePos.current.x - currentMousePos.current.x) * 0.07;
      currentMousePos.current.y += (targetMousePos.current.y - currentMousePos.current.y) * 0.07;

      if (imageElement) {
        // Compute base scales that cover canvas aspect ratios correctly
        const canvasRatio = widthVal / heightVal;
        const imgRatio = imageElement.width / imageElement.height;
        let scaleFactor = 1.0;

        if (canvasRatio > imgRatio) {
          scaleFactor = widthVal / imageElement.width;
        } else {
          scaleFactor = heightVal / imageElement.height;
        }

        // Apply a little extra padding zoom so edges don't reveal during movement
        const baseScale = scaleFactor * 1.08;

        // Apply distinct physics laws according to selected engine profile
        let extraScale = 1.05;
        let dx = 0;
        let dy = 0;
        let rotation = 0;

        if (isPlaying) {
          // Dynamic slow breathing oscillate loop
          const breathe = (Math.sin(time * 0.00018) + 1) / 2; // 0 to 1 smooth oscillation

          switch (motionProfile) {
            case "handheld": {
              // Simulated natural handheld operator muscular noise
              const handSwayX = Math.sin(time * 0.0011) * 8 * motionStrength;
              const handSwayY = Math.cos(time * 0.00073) * 6 * motionStrength;
              const handRoll = Math.sin(time * 0.0005) * 0.015 * motionStrength;
              
              extraScale = 1.02 + (breathe * 0.06);
              dx = handSwayX;
              dy = handSwayY;
              rotation = handRoll;
              break;
            }
            case "3d_perspective": {
              // Direct interactive cursor projection
              const interactiveX = currentMousePos.current.x * 24 * motionStrength;
              const interactiveY = currentMousePos.current.y * 18 * motionStrength;
              const tiltRotation = currentMousePos.current.x * 0.025 * motionStrength;

              extraScale = 1.05 + Math.abs(currentMousePos.current.x * 0.04);
              dx = interactiveX;
              dy = interactiveY;
              rotation = tiltRotation;
              break;
            }
            case "wind": {
              // Soft wind breeze handheld camera base
              extraScale = 1.03 + (breathe * 0.04);
              dx = Math.sin(time * 0.0008) * 4 * motionStrength;
              dy = Math.cos(time * 0.0006) * 3 * motionStrength;
              break;
            }
            case "water": {
              // Floating water slow handheld panning base
              extraScale = 1.04 + (breathe * 0.03);
              dx = Math.sin(time * 0.0005) * 6 * motionStrength;
              dy = Math.cos(time * 0.00041) * 4 * motionStrength;
              break;
            }
            case "character_movement": {
              // Gentle camera movement so the background layer isn't completely static
              extraScale = 1.03 + (breathe * 0.02);
              dx = Math.sin(time * 0.0005) * 2 * motionStrength;
              dy = Math.cos(time * 0.0003) * 1.5 * motionStrength;
              break;
            }
          }
        }

        const finalWidth = imageElement.width * baseScale * extraScale;
        const finalHeight = imageElement.height * baseScale * extraScale;

        // SLICED ORGANIC DEFORMATION RENDERING PIPELINE:
        // Instead of doing flat translate, we segment into vertical/horizontal slices 
        // to recreate actual wind waving or water rippling.
        if (motionProfile === "character_movement") {
          // 1. Draw solid backing image layer
          ctx.save();
          ctx.translate(widthVal / 2 + dx, heightVal / 2 + dy);
          ctx.rotate(rotation);
          ctx.drawImage(
            imageElement,
            -finalWidth / 2,
            -finalHeight / 2,
            finalWidth,
            finalHeight
          );
          ctx.restore();

          // 2. Compute dynamic sub-element kinematics
          let bodyDX = 0;
          let bodyDY = 0;
          let headDX = 0;
          let headDY = 0;
          let headScaleX = 1.0;
          let headScaleY = 1.0;

          if (isPlaying) {
            // A. Breathing Cycles
            if (isBodyBreathing) {
              const bodyBreathe = Math.sin(time * 0.0016) * 5.5 * motionStrength;
              const headBreathe = Math.sin(time * 0.0016 - 0.5) * 4.5 * motionStrength;
              bodyDY += bodyBreathe;
              headDY += headBreathe;
            }

            // B. Walking strides
            if (isCharacterWalking) {
              const freq = time * 0.0035;
              const stepX = Math.sin(freq) * 12 * motionStrength;
              const stepY = Math.abs(Math.sin(freq * 2)) * -6 * motionStrength;
              bodyDX += stepX;
              bodyDY += stepY;
              headDX += stepX;
              headDY += stepY;
            }

            // C. Talking deformation (facial/verbal articulates)
            if (isFaceTalking) {
              headScaleY = 1.0 + Math.sin(time * 0.018) * 0.04 * motionStrength;
              headScaleX = 1.0 + Math.cos(time * 0.014) * 0.015 * motionStrength;
              headDX += Math.sin(time * 0.035) * 0.6; // speaking tremors
            }
          }

          // Projection coordinate transformations
          const pinToImgCoords = (pin: { x: number; y: number }) => ({
            x: pin.x * imageElement.width,
            y: pin.y * imageElement.height
          });

          const pinToCanvasCoords = (pin: { x: number; y: number }) => ({
            x: widthVal / 2 + dx - finalWidth / 2 + (pin.x * finalWidth),
            y: heightVal / 2 + dy - finalHeight / 2 + (pin.y * finalHeight)
          });

          const drawFeatheredSegment = (
            pin: { x: number; y: number },
            radiusPercent: number,
            offsetX: number,
            offsetY: number,
            scaleXFactor: number,
            scaleYFactor: number
          ) => {
            const imgCoords = pinToImgCoords(pin);
            const canvasCoords = pinToCanvasCoords(pin);
            const srcR = Math.min(imageElement.width, imageElement.height) * radiusPercent;
            const destR = srcR * baseScale * extraScale;

            ctx.save();
            ctx.beginPath();
            ctx.arc(canvasCoords.x + offsetX, canvasCoords.y + offsetY, destR, 0, Math.PI * 2);
            ctx.clip();

            ctx.translate(canvasCoords.x + offsetX, canvasCoords.y + offsetY);
            ctx.scale(scaleXFactor, scaleYFactor);

            ctx.drawImage(
              imageElement,
              Math.max(0, imgCoords.x - srcR),
              Math.max(0, imgCoords.y - srcR),
              Math.min(imageElement.width, srcR * 2),
              Math.min(imageElement.height, srcR * 2),
              -destR,
              -destR,
              destR * 2,
              destR * 2
            );
            ctx.restore();

            // Seamless Edge-feathering using destination-out template
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            const featherColor = ctx.createRadialGradient(
              canvasCoords.x + offsetX,
              canvasCoords.y + offsetY,
              destR * 0.65,
              canvasCoords.x + offsetX,
              canvasCoords.y + offsetY,
              destR + 1
            );
            featherColor.addColorStop(0, "rgba(0,0,0,0)");
            featherColor.addColorStop(1, "rgba(0,0,0,1)");
            ctx.fillStyle = featherColor;
            ctx.beginPath();
            ctx.arc(canvasCoords.x + offsetX, canvasCoords.y + offsetY, destR + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          };

          // Draw segments in layered stacking order (Body below, Head on top!)
          drawFeatheredSegment(characterBodyPin, 0.18, bodyDX, bodyDY, 1.0, 1.0);
          drawFeatheredSegment(characterHeadPin, 0.11, headDX, headDY, headScaleX, headScaleY);

        } else if (isPlaying && (motionProfile === "wind" || motionProfile === "water")) {
          const numSlices = 100; // Perfect visual fidelity density
          const sliceHeight = finalHeight / numSlices;
          const srcSliceHeight = imageElement.height / numSlices;

          ctx.save();
          // Translate to center point to apply general rotation sways
          ctx.translate(widthVal / 2 + dx, heightVal / 2 + dy);
          ctx.rotate(rotation);

          for (let i = 0; i < numSlices; i++) {
            const sy = i * srcSliceHeight;
            const dyPos = -finalHeight / 2 + i * sliceHeight;

            // Compute math displacement equations per pixel slice
            let displacementX = 0;
            let displacementY = 0;

            if (motionProfile === "wind") {
              // Wind blowing ripples lower layers (like grass or dresses) or progressively values
              const heightIntensityRatio = (i / numSlices); // bottom sections wave more
              displacementX = Math.sin((time * 0.0042) + (i * 0.16)) * 6.5 * heightIntensityRatio * motionStrength;
              displacementY = Math.cos((time * 0.0028) + (i * 0.11)) * 1.5 * heightIntensityRatio * motionStrength;
            } else if (motionProfile === "water") {
              // Sine wave fluid fluid dynamics mimicking liquid reflections
              displacementX = Math.sin((time * 0.0034) + (i * 0.28)) * 4.2 * motionStrength;
              displacementY = Math.cos((time * 0.0022) + (i * 0.24)) * 3.5 * motionStrength;
            }

            ctx.drawImage(
              imageElement,
              0, sy, imageElement.width, srcSliceHeight,
              -finalWidth / 2 + displacementX, dyPos + displacementY, finalWidth, sliceHeight + 0.9 // 0.9 margin cures slice cracks
            );
          }
          ctx.restore();
        } else {
          // High speed standard whole-image hardware projection with camera rotation
          ctx.save();
          ctx.translate(widthVal / 2 + dx, heightVal / 2 + dy);
          ctx.rotate(rotation);
          ctx.drawImage(
            imageElement,
            -finalWidth / 2,
            -finalHeight / 2,
            finalWidth,
            finalHeight
          );
          ctx.restore();
        }
      }

      // CINEMATIC VOLUMETRIC SUNLIGHT SPECTRUMS
      if (isPlaying && lightLeakIntensity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // 1. Dynamic sweeping linear lens leak
        const gradientAngle = (Math.sin(time * 0.00022) + 1) / 2; // slow sweeping
        const lightGrad = ctx.createLinearGradient(
          0, 
          0, 
          widthVal * (0.5 + gradientAngle * 0.5), 
          heightVal * (0.8 - gradientAngle * 0.4)
        );
        
        const alphaMultiplier = 0.18 * lightLeakIntensity;
        lightGrad.addColorStop(Math.max(0, gradientAngle - 0.25), "rgba(251, 191, 36, 0)");
        lightGrad.addColorStop(gradientAngle, `rgba(244, 63, 94, ${alphaMultiplier})`); // Magenta/Orange dual tint leak
        lightGrad.addColorStop(Math.min(1, gradientAngle + 0.15), `rgba(253, 224, 71, ${alphaMultiplier * 0.5})`);
        lightGrad.addColorStop(Math.min(1, gradientAngle + 0.35), "rgba(251, 191, 36, 0)");

        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, widthVal, heightVal);

        // 2. Translucent Golden Sun Rays (Crepuscular Beams)
        ctx.fillStyle = `rgba(255, 230, 160, ${0.03 * lightLeakIntensity})`;
        const activeBeams = 5;
        for (let k = 0; k < activeBeams; k++) {
          const beamWobble = Math.sin(time * 0.00035 + k * 1.8) * 0.06;
          ctx.beginPath();
          ctx.moveTo(0, 0); // Source from Top Left Corner
          ctx.lineTo(
            Math.cos(0.12 + k * 0.14 + beamWobble) * widthVal * 1.8, 
            Math.sin(0.12 + k * 0.14 + beamWobble) * heightVal * 1.8
          );
          ctx.lineTo(
            Math.cos(0.18 + k * 0.14 + beamWobble) * widthVal * 1.8, 
            Math.sin(0.18 + k * 0.14 + beamWobble) * heightVal * 1.8
          );
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      // AMBIENT EMBER DUST DYNAMICS (60fps render overlay)
      if (isPlaying) {
        // Update track timeline increment
        setTimelineProgress((prev) => {
          const next = prev + 0.25;
          return next >= 100 ? 0 : next;
        });

        particles.forEach((p, idx) => {
          // Slowly rise and wobble side to side using trigonometric curves
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(time * p.wobbleSpeed + p.startTime) * p.wobbleRange * 0.3;

          // Out of screen wrap reuse logic
          if (p.y < 0) {
            p.y = heightVal + 10;
            p.x = Math.random() * widthVal;
          }
          if (p.x < -10) p.x = widthVal + 10;
          if (p.x > widthVal + 10) p.x = -10;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          // Add beautiful soft blur glow to sparks
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.size * 2.5;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fill();
          ctx.restore();
        });
      } else {
        // Flat pause render representation
        particles.forEach((p) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * 0.7;
          ctx.fill();
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isPlaying, imageElement, motionProfile, motionStrength, lightLeakIntensity]);

  // Premium ambient hum synthesizer (sound effects) to give cinema vibe
  const toggleSound = () => {
    if (!isMuted) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {}
        oscillatorRef.current = null;
      }
      setIsMuted(true);
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(115, ctx.currentTime); // Deep hum resonance

        // Add slow breathing rumble modulator
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.45; 
        lfoGain.gain.value = 2.8; 
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2); 

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setIsMuted(false);
      } catch (err) {
        console.warn("Web Audio blocked by browser policy:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // HIGH FIDELITY DIRECT CANVAS RECORDING & WEBM/MP4 VIDEO ENCODER
  const handleDownloadVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsPlaying(true);
    setIsRecording(true);
    setRecordingProgress(0);

    const chunks: Blob[] = [];
    const stream = canvas.captureStream(30); // Capture fluid 30 FPS stream

    let options = { mimeType: "video/webm" };
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      options = { mimeType: "video/webm;codecs=vp9" };
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      options = { mimeType: "video/webm" };
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      options = { mimeType: "video/mp4" };
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = options.mimeType.includes("mp4") ? "mp4" : "webm";
        
        const sanitizedPrompt = String(prompt || "cinematic_scene")
          .substring(0, 30)
          .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
        
        a.download = `${motionProfile}_motion_${sanitizedPrompt}.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordingProgress(0);
        
        // Show high usability troubleshoot instructions right after compile
        setShowTroubleshoot(true);
      };

      // Record exactly 6.0 seconds for high-fidelity loops
      const duration = 6000;
      const intervalMs = 100;
      let elapsed = 0;

      mediaRecorder.start();

      const progressInterval = setInterval(() => {
        elapsed += intervalMs;
        const value = Math.min(Math.round((elapsed / duration) * 100), 99);
        setRecordingProgress(value);

        if (elapsed >= duration) {
          clearInterval(progressInterval);
          mediaRecorder.stop();
        }
      }, intervalMs);

    } catch (recorderErr) {
      console.error("Camera recorder compilation failed:", recorderErr);
      setIsRecording(false);
      // Fallback
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(imageUrl)}`;
      window.open(proxyUrl, "_blank");
    }
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (motionProfile !== "character_movement") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);

    if (activePinSelection === "head") {
      setCharacterHeadPin({ x, y });
    } else if (activePinSelection === "body") {
      setCharacterBodyPin({ x, y });
    } else {
      const distToHead = Math.hypot(x - characterHeadPin.x, y - characterHeadPin.y);
      const distToBody = Math.hypot(x - characterBodyPin.x, y - characterBodyPin.y);
      if (distToHead < distToBody) {
        setCharacterHeadPin({ x, y });
      } else {
        setCharacterBodyPin({ x, y });
      }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6" id="cinematic-player-root">
      
      {/* 1. Main visual viewport with aspect ratio constraints */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        onMouseDown={handleViewportClick}
        className={`w-full relative overflow-hidden rounded-2xl border border-slate-250 dark:border-slate-800 bg-[#0d0e14] group shadow-xl transition-all duration-300 ${
          aspectRatio === "9:16" ? "aspect-[9/16] max-h-[580px]" : "aspect-[16/9]"
        } ${motionProfile === "character_movement" ? "cursor-crosshair" : ""}`}
      >
        {/* Living Cinematic Frame Layer - only show as placeholder if canvas image hasn't loaded yet */}
        {!imageElement && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 origin-center"
            style={{
              backgroundImage: `url(${imageUrl})`,
              transform: "scale(1.05)",
            }}
          />
        )}

        {/* 60fps Physics & Spatial Fluidity Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Neon target markers for Character Puppet Movement editing */}
        {motionProfile === "character_movement" && (
          <>
            {/* Head pin */}
            <div 
              className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-dashed flex items-center justify-center z-30 pointer-events-none transition-all duration-300 ${
                activePinSelection === "head" 
                  ? "border-amber-400 bg-amber-500/25 shadow-[0_0_15px_rgba(251,191,36,0.7)] animate-pulse" 
                  : "border-amber-500/60 bg-black/55"
              }`}
              style={{ left: `${characterHeadPin.x * 100}%`, top: `${characterHeadPin.y * 100}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="absolute -bottom-6 bg-slate-900 border border-amber-500/25 px-1.5 py-0.5 rounded text-[9px] text-amber-300 whitespace-nowrap font-bold">
                {lang === "ar" ? "🗣️ الشفاه والكلام" : "🗣️ Speech & Lips"}
              </span>
            </div>

            {/* Body pin */}
            <div 
              className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-dashed flex items-center justify-center z-30 pointer-events-none transition-all duration-300 ${
                activePinSelection === "body" 
                  ? "border-sky-400 bg-sky-500/25 shadow-[0_0_15px_rgba(56,189,248,0.7)] animate-pulse" 
                  : "border-sky-500/60 bg-black/55"
              }`}
              style={{ left: `${characterBodyPin.x * 100}%`, top: `${characterBodyPin.y * 100}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="absolute -top-6 bg-slate-900 border border-sky-500/25 px-1.5 py-0.5 rounded text-[9px] text-sky-300 whitespace-nowrap font-bold">
                {lang === "ar" ? "🧍 التنفس والجسم" : "🧍 Body & Breath"}
              </span>
            </div>
          </>
        )}

        {/* Dynamic browser-recording progress overlay screen */}
        {isRecording && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-40 p-6 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin flex items-center justify-center text-sm font-bold text-red-500 mb-4 font-mono">
              {recordingProgress}%
            </div>
            <p className="text-white text-sm font-bold mb-1">
              {lang === "ar" ? "جاري دمج الأبعاد وتصدير حركات المشهد..." : "Synthesizing dynamic physics & outputting files..."}
            </p>
            <p className="text-white/60 text-xs max-w-sm leading-relaxed">
              {lang === "ar" 
                ? "يتم الآن تصوير اهتزازات الكاميرا ثلاثية الأبعاد وملاطفة الرياح بدقة عالية في متصفحك..." 
                : "Recording 3D frame rotations, wind gusts and cinematic sunlight sweeps directly in full HD..."}
            </p>
          </div>
        )}

        {/* Cinematic Widescreen Bars (Soft crop styling) */}
        <div className="absolute top-0 left-0 right-0 h-[6%] bg-black/55 backdrop-blur-[2px] border-b border-white/5 flex items-center justify-between px-3 text-[9px] text-white/75 font-mono tracking-widest z-10">
          <div className="flex items-center gap-1.5 font-bold text-rose-500">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>AI_RENDER_LIVE_FEED</span>
          </div>
          <div className="hidden sm:block text-white/40">ENGINE: V3.5_DYNAMICS | MOTION_ACTIVE</div>
          <div className="uppercase tracking-wider">
            {motionProfile === "3d_perspective" 
              ? (lang === "ar" ? "منظور تفاعلي نشط" : "INTERACTIVE 3D PERSPECTIVE") 
              : motionProfile.toUpperCase()}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[6%] bg-black/55 backdrop-blur-[2px] border-t border-white/5 z-10" />

        {/* Direct Playback Overlay Panel - Shows beautiful interactive hover controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 z-20">
          <div className="space-y-4">
            
            {/* Active prompt quote */}
            <p className="text-white font-medium text-xs md:text-sm line-clamp-1 italic text-shadow bg-black/45 p-2 rounded-xl border border-white/10 inline-block">
              "{prompt || "Cinematic masterpiece motion transformation"}"
            </p>

            {/* Simulated Live Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 bg-white text-black hover:bg-neutral-100 rounded-full transition-transform active:scale-90 cursor-pointer shadow"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                </button>

                <button
                  onClick={() => setTimelineProgress(0)}
                  className="p-2.5 border border-white/20 hover:bg-white/10 text-white rounded-full transition-all active:scale-90 cursor-pointer"
                  title="Reset Track"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={toggleSound}
                  className={`p-2 px-3.5 rounded-full transition-all active:scale-90 cursor-pointer flex items-center gap-2 text-xs font-mono uppercase ${
                    !isMuted 
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/45 shadow" 
                      : "border border-white/20 hover:bg-white/10 text-white"
                  }`}
                  title={isMuted ? "Unmute Hum" : "Mute Hum"}
                >
                  {!isMuted ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden sm:inline-block tracking-wider text-[10px]">{isMuted ? "CINEMA AUDIO" : "AUDIO ON"}</span>
                </button>
              </div>

              <div>
                <button
                  onClick={handleDownloadVideo}
                  id="record-and-download-cinematic-btn"
                  className="flex items-center gap-2 p-2 px-4 border border-rose-500 bg-rose-650 hover:bg-rose-550 bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === "ar" ? "تصدير وتحميل كفيديو" : "Compile & Download Video"}</span>
                </button>
              </div>
            </div>

            {/* Timeline progression bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-white/20 h-1 relative rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 via-orange-400 to-yellow-300 h-full transition-all duration-300"
                  style={{ width: `${timelineProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-white/50">
                <span>00:{(Math.floor(timelineProgress / 10)).toString().padStart(2, "0")}</span>
                <span>00:10 (Dynamic Loop)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Interactive Holographic Hint Ribbon */}
        {motionProfile === "3d_perspective" && (
          <div className="absolute top-12 right-3 py-1 px-2.5 rounded-lg border border-teal-500/30 bg-teal-950/45 backdrop-blur text-[10px] text-teal-400 font-bold flex items-center gap-1.5 animate-pulse z-15">
            <Eye className="w-3.5 h-3.5" />
            <span>{lang === "ar" ? "حرك الماوس/لمسك فوق الإطار لرؤية المنظور" : "Sway pointer over frame to control lens perspective"}</span>
          </div>
        )}

        {/* Small badge of simulated engine */}
        <div className="absolute top-12 left-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 backdrop-blur-sm text-white px-2.5 py-0.5 rounded text-[9px] font-black font-mono tracking-widest uppercase z-10 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "4s" }} />
          <span>REALTIME NEURAL DEPTH ENGINE</span>
        </div>

      </div>

      {/* 2. PREMIUM TOOLBAR - Dynamic AI Engine Style Picker */}
      <div className="bg-white dark:bg-[#0c0f16] border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-wrap dark:text-slate-100 text-sm md:text-base flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-rose-500" />
              <span>{lang === "ar" ? "محرك الحركة الفيزيائي الحقيقي" : "Neural Animation Physics Engine"}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "ar" 
                ? "اختر طيف محاكاة الحركة الطبيعية لإضافة حياة حقيقية وتفاعلات سينمائية للصورة الثابتة" 
                : "Toggle organic vector displacements and 3D camera sweeps to animate your canvas naturally"}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400 text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-xl w-fit self-end md:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HTML5 GPU_ACCELERATED</span>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/50 dark:bg-black/15 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
          {profiles.map((p) => {
            const isSelected = motionProfile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setMotionProfile(p.id);
                  if (p.id === "3d_perspective") {
                    targetMousePos.current = { x: 0, y: 0 };
                  }
                  if (p.id === "character_movement") {
                    // Pre-select head pin automatically to guide users
                    setActivePinSelection("head");
                  } else {
                    setActivePinSelection(null);
                  }
                }}
                className={`flex flex-col items-start p-3.5 rounded-xl text-left transition-all relative ${
                  isSelected 
                    ? "bg-gradient-to-br from-indigo-500/10 via-rose-500/10 to-transparent border border-rose-500/30 text-slate-800 dark:text-white shadow-sm ring-1 ring-rose-500/10" 
                    : "border border-transparent hover:border-slate-200 dark:hover:border-slate-800 bg-white dark:bg-[#0c0f16] hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                } relative overflow-hidden group/btn cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg filter drop-shadow">{p.emoji}</span>
                  <span className="font-bold text-xs md:text-sm tracking-tight text-slate-800 dark:text-slate-100">
                    {lang === "ar" ? p.nameAr : p.nameEn}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">
                  {lang === "ar" ? p.descAr : p.descEn}
                </p>

                {isSelected && (
                  <span className="absolute bottom-1 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. SLIDERS CONTROLS for dynamic values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/20 dark:bg-black/5 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
          
          {/* Slider 1: Motion Intensity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                {lang === "ar" ? "قوة الحركة الفيزيائية (السرعة/الإزاحة)" : "Animation Velocity & Wave Strength"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono rounded-md">
                x{motionStrength.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={motionStrength}
              onChange={(e) => setMotionStrength(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              {lang === "ar" 
                ? "زيادة الإزاحة تعزز سرعة ذبذبات الرياح أو سعة ميلان اهتزازات الكاميرا يدوياً" 
                : "Increases wave intensity boundaries, wind oscillations, or perspective rotation ranges"}
            </p>
          </div>

          {/* Slider 2: Lighting / Light leakage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {lang === "ar" ? "شعاع الإضاءة وتوهج الكاميرا (Volumetric Light)" : "Camera Volumetric Glare & Light Leak"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-mono rounded-md">
                {(lightLeakIntensity * 50).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.1"
              value={lightLeakIntensity}
              onChange={(e) => setLightLeakIntensity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              {lang === "ar" 
                ? "يتحكم بشدة خطوط الشمس المتسللة والمؤثر اللوني الدافئ على الكادر" 
                : "Adjusts sunshine beam projection intensity and chromatic lens leak warmth"}
            </p>
          </div>

        </div>

        {/* DESIGN CONTEXT: ADVANCED DYNAMIC CHARACTER PUPPET ANCHORS CONTROLS */}
        {motionProfile === "character_movement" && (
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] space-y-4" id="character-puppet-controls-panel">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h5 className="text-xs md:text-sm font-bold text-slate-800 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="text-sm">🎯</span>
                  {lang === "ar" ? "أدوات تحريك مفاصل وشخصيات الصورة (مجانية)" : "Character Puppet Joint Controller (100% Free)"}
                </h5>
                <p className="text-[10px] md:text-xs text-slate-500">
                  {lang === "ar" 
                    ? "اضغط مباشرة على أي شخص أو كائن داخل مشهد الفيديو لتعديل مكانه وتفعيل الحركات التلقائية." 
                    : "Click anywhere on the viewport image above to position character joint nodes."}
                </p>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold">{lang === "ar" ? "تموضع سريع:" : "Presets:"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCharacterHeadPin({ x: 0.5, y: 0.35 });
                    setCharacterBodyPin({ x: 0.5, y: 0.62 });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  {lang === "ar" ? "👤 بالمنتصف" : "👤 Center"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCharacterHeadPin({ x: 0.72, y: 0.40 });
                    setCharacterBodyPin({ x: 0.72, y: 0.65 });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  {lang === "ar" ? "➡️ باليمين" : "➡️ Right"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCharacterHeadPin({ x: 0.28, y: 0.40 });
                    setCharacterBodyPin({ x: 0.28, y: 0.65 });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  {lang === "ar" ? "⬅️ باليسار" : "⬅️ Left"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Joint Pickers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === "ar" ? "١. حدد المفصل النشط لنقله باللمس على الصورة الماشرة بالأعلى:" : "1. Click viewport image above to relocate active joint node:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePinSelection("head")}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                      activePinSelection === "head"
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-405 font-bold ring-1 ring-amber-500"
                        : "bg-white hover:bg-slate-50 dark:bg-[#0d1017] border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400"
                    }`}
                  >
                    🗣️ {lang === "ar" ? "الشفاه والكلام (رأس)" : "Speech & Face Node"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePinSelection("body")}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                      activePinSelection === "body"
                        ? "bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-405 font-bold ring-1 ring-sky-500"
                        : "bg-white hover:bg-slate-50 dark:bg-[#0d1017] border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400"
                    }`}
                  >
                    🧍 {lang === "ar" ? "التنفس والجسد (جسم)" : "Body & Breath Node"}
                  </button>
                </div>
                {activePinSelection && (
                  <p className="text-[10px] text-amber-500 animate-pulse font-extrabold mt-1">
                    {lang === "ar" 
                      ? `✨ اضغط الآن داخل الصورة السابقة لوضع نقطة [${activePinSelection === "head" ? "الكلام والشفاه" : "التنفس والجسد"}]`
                      : `✨ Now click on the picture above to position the [${activePinSelection === "head" ? "Face" : "Body"}] joint pointer.`}
                  </p>
                )}
              </div>

              {/* Behavior Switches */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === "ar" ? "٢. تفعيل السلوك والتحريكات الذاتية:" : "2. Toggle active motions:"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Talking Switch */}
                  <button
                    type="button"
                    onClick={() => setIsFaceTalking(!isFaceTalking)}
                    className={`p-2.5 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                      isFaceTalking
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : "bg-white dark:bg-[#0d1017] border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    🗣️ {lang === "ar" ? "حركة الكلام" : "Speak Match"}
                  </button>

                  {/* Breathing Switch */}
                  <button
                    type="button"
                    onClick={() => setIsBodyBreathing(!isBodyBreathing)}
                    className={`p-2.5 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                      isBodyBreathing
                        ? "bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400"
                        : "bg-white dark:bg-[#0d1017] border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    🫁 {lang === "ar" ? "تنفس حي" : "Animate Breathe"}
                  </button>

                  {/* Walking Stride Switch */}
                  <button
                    type="button"
                    onClick={() => setIsCharacterWalking(!isCharacterWalking)}
                    className={`p-2.5 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                      isCharacterWalking
                        ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400"
                        : "bg-white dark:bg-[#0d1017] border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    🚶 {lang === "ar" ? "مشية بيم الكادر" : "Animate Walk"}
                  </button>
                </div>
              </div>
            </div>

            {/* Speaking vocal hints explaining free capabilities */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span className="text-xs">💡</span>
              <p className="leading-relaxed">
                {lang === "ar"
                  ? "ميزة تحريك الشخصيات المجانية كلياً تستخدم مسح الكتل ثنائي الأبعاد المباشر وتطبيق مصفوفة نقل الإحداثيات بزاوية تنصيفية. يتيح لك ذلك تصدير ملفات فيديو حقيقية بالكامل ومتحركة للشخصية وهي تمشي وتتحدث وتتنفس مجاناً دون دفع أي تكاليف سيرفرات خارجية."
                  : "The fully free interactive puppet animator utilizes direct pixel slice mesh matrices and local trigonometric displacements. This allows you to generate and export real animated walking/talking videos for free."}
              </p>
            </div>
          </div>
        )}

        {/* Informative advice to assure absolute confidence */}
        <div className="p-3 bg-rose-500/[0.03] dark:bg-rose-500/[0.01] border-l-2 border-rose-500 rounded-r-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
            <span>🚀 {lang === "ar" ? "المحاكاة الطبيعية كاملة في المتصفح" : "Full Natural Emulation Process Completed natively"}</span>
          </p>
          <p>
            {lang === "ar"
              ? "لتخطي مشكلة الروبوتية في دمج الصور الثنائية، قمنا بتنصيب خوارزمية ذكاء فيزيائي تدمج حركات الرياح الدافئة، تموجات الماء السائلة، واهتزازات كاميرا هوليوود يدوياً بشكل متكامل يدعم التحميل الفوري بصيغ الفيديو."
              : "To entirely eliminate artificial stiffness, we have deployed pixel-sliced wind wave simulations and multi-coordinate operators that yield professional video outputs, natively and fully download-ready instantly."}
          </p>
        </div>

        {/* WINDOWS PLAYBACK ASSISTANCE CARD (Cures File System Error -2018374635) */}
        <div 
          className="p-5 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent space-y-4 shadow-sm" 
          id="windows-playback-troubleshooter"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-indigo-550/10 text-indigo-500 dark:text-indigo-400 text-lg">💡</span>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">
                  {lang === "ar" 
                    ? "حل مشكلة فتح الفيديو على ويندوز (File System Error) ومشاكل التشغيل:" 
                    : "Fixing Windows Playback Error (File System Error) & Codec issues:"}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
                  {lang === "ar"
                    ? "يظهر خطأ النظام هذا (-2018374635) على ويندوز لأن مشغّل الميديا الافتراضي لا يدعم صيغ الويب والمسجلات الرقمية التفاعلية بشكل مباشر دون تحديث. إليك الحلول المجانية والفورية لتشغيل الفيديو بكامل رونقه وبساطة:"
                    : "This Windows system error triggers when launching dynamic browser-recorded formats (like WebM) natively due to missing core codecs on default system players. Try these 100% free and easy remedies block:"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-150 dark:border-slate-800/80 space-y-1.5 transition-all duration-300 hover:border-indigo-500/35 shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-sm">⚡</span>
                <span className="text-indigo-600 dark:text-indigo-455 font-extrabold">{lang === "ar" ? "١. السحب والإفلات (الأسرع)" : "1. Drag & Drop (Fastest)"}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === "ar"
                  ? "اسحب ملف الفيديو الذي قمت بتحميله الآن من مجلد التنزيلات، وأفلته مباشرة داخل نافذة متصفحك الحالي (مثل كروم أو إيدج) وسيعمل الفيديو فوراً أمامك وبأعلى كفاءة!"
                  : "Drag the downloaded file and drop it directly into your web browser (Chrome, Edge, Firefox, Brave). It plays instantly, beautifully, and fully hardware-accelerated!"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-150 dark:border-slate-800/80 space-y-1.5 transition-all duration-300 hover:border-indigo-500/35 shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-sm">🎬</span>
                <span className="text-indigo-600 dark:text-indigo-455 font-extrabold">{lang === "ar" ? "٢. استخدام مشغل VLC" : "2. Use VLC Media Player"}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === "ar"
                  ? "افتح الفيديو باستخدام برنامج VLC Player المجاني الشهير. هو المشغل الأول عالمياً الذي يدعم كافة الترميزات وصيغ الفيديو الرقمية دون الحاجة لأي حزم إضافية."
                  : "Open your video file using the renowned VLC Player (100% free). It decodes all custom browser canvas recorders, dynamic web buffers and resolutions on Windows and Mac natively."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-150 dark:border-slate-800/80 space-y-1.5 transition-all duration-300 hover:border-indigo-500/35 shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-sm">🏪</span>
                <span className="text-indigo-600 dark:text-indigo-455 font-extrabold">{lang === "ar" ? "٣. تثبيت حزمة مايكروسوفت" : "3. Microsoft Extensions"}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === "ar"
                  ? "ثبّت حزمة \"Web Media Extensions\" المجانية الرسمية من متجر تطبيقات ويندوز (Microsoft Store)، ليتم دعم تشغيل ملفات ويب وسيرفرات الفيديوهات تلقائياً ببرنامج ويندوز الأساسي."
                  : "Search and install the free \"Web Media Extensions\" utility inside Microsoft Store. This will upgrade Windows Photos/Media Player to easily decode web files natively."}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
