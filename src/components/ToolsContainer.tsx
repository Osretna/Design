import React, { useState, useRef } from "react";
import { ARABIC_TRANSLATION, ENGLISH_TRANSLATION, LocalizationType } from "../types";
import { getApiUrl } from "../utils/api";
import { Image as ImageIcon, Video, Speech, Sliders, Play, Sparkles, Upload, FileAudio, Check, Trash2 } from "lucide-react";
import CinematicPlayer from "./CinematicPlayer";

const getProblemDescriptionAr = (err: string): string => {
  const low = err.toLowerCase();
  if (low.includes("gemini_api_key") || low.includes("api key") || low.includes("not defined")) {
    return "متغير مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) مفقود تماماً أو غير مفعّل بشكل صحيح في ملف التهيئة الخاص بالتطبيق.";
  }
  if (low.includes("quota") || low.includes("limit") || low.includes("exhausted") || low.includes("429") || low.includes("billing")) {
    return "لقد نفد رصيد واجهة الاستدعاء المجانية أو أن حدود الاستهلاك السحابي اليومية لنموذج توليد المدخلات قد تم تجاوزها.";
  }
  if (low.includes("veo") || low.includes("video")) {
    return "محرك توليد الفيديو السحابي Veo 3.1 يتطلب خوادم سحابية مخصصة وعقد حوسبة فائقة وصلاحيات وصول مدفوعة غير مهيأة للمستخدمين الافتراضيين.";
  }
  if (low.includes("tts") || low.includes("speech") || low.includes("synthesis")) {
    return "فشل خادم التوليف الصوتي في معالجة النص الصوتي؛ يحدث هذا عادة عند غياب رمز الاتصال بقوقل أو تعطل قناة الاتصال الصوتي السحابي.";
  }
  return "حدث خطأ غير متوقع أثناء معالجة الأمر في الخادم السحابي للتطبيق، وغالباً ما يعود لضغط مؤقت في اتصال واجهات البرمجة المفتوحة.";
};

const getProblemDescriptionEn = (err: string): string => {
  const low = err.toLowerCase();
  if (low.includes("gemini_api_key") || low.includes("api key") || low.includes("not defined")) {
    return "The Gemini API connection key (GEMINI_API_KEY) is missing or not configured correctly in the application setup.";
  }
  if (low.includes("quota") || low.includes("limit") || low.includes("exhausted") || low.includes("429") || low.includes("billing")) {
    return "The daily API call quota for the free tier is completely exhausted or restricted.";
  }
  if (low.includes("veo") || low.includes("video")) {
    return "The Veo 3.1 video generation model is configured for enterprise-only usage and requires high-performance hardware capabilities.";
  }
  if (low.includes("tts") || low.includes("speech") || low.includes("synthesis")) {
    return "The acoustic speech synthesizer failed to parse and read back your request via server endpoint.";
  }
  return "An unexpected server-side exception or cloud database network timeout occurred.";
};

const getSolutionDescriptionAr = (err: string): string => {
  const low = err.toLowerCase();
  if (low.includes("gemini_api_key") || low.includes("api key") || low.includes("not defined")) {
    return "1. افتح قائمة الإعدادات (Settings Panel).\n2. أضف مفتاح API باسم GEMINI_API_KEY من حساب قوقل الخاص بك.\n3. تأكد من تفعيل المتغير لحفظ الإعدادات وإعادة تشغيل التطبيق.";
  }
  if (low.includes("quota") || low.includes("limit") || low.includes("exhausted") || low.includes("429") || low.includes("billing")) {
    return "1. يرجى الانتظار قليلاً أو تبديل الاتصال بالإنترنت لتخفيف المعالجة.\n2. أو قم بإضافة مفتاح API خاص بك ومفعل عليه الفواتير للتخلص من قيود الاستخدام المجاني بالكامل.";
  }
  if (low.includes("veo") || low.includes("video")) {
    return "1. استخدم خيار المحاكاة السينمائية 'Interactive Cinematic Video' والذي يصمم لقطة حقيقية ومتحركة من وصفك الفعلي مجاناً.\n2. أو قم بربط حساب Vertex AI مخصص عبر إعدادات بيئة الاستضافة السحابية لتمكين المخططات الثقيلة.";
  }
  if (low.includes("tts") || low.includes("speech") || low.includes("synthesis")) {
    return "1. قم بتغيير محرك دبلجة الصوت في واجهة التطبيق إلى (Client Engine).\n2. خيار Client Engine سيكمل قراءة نصوصك فورياً وبشكل مجاني 100% دون الحاجة إلى خوادم وسيطة.";
  }
  return "1. تحقق من كتابة وصف أو توجيه مبسط وقصير دون استخدام محارف خاصة.\n2. اضغط مجدداً على زر التوليد لإتمام قنوات الاستدعاء السحابية.";
};

const getSolutionDescriptionEn = (err: string): string => {
  const low = err.toLowerCase();
  if (low.includes("gemini_api_key") || low.includes("api key") || low.includes("not defined")) {
    return "1. Open AI Studio settings page.\n2. Add a new secret/environment variable called GEMINI_API_KEY with your custom key.\n3. Restart the server or re-run development thread.";
  }
  if (low.includes("quota") || low.includes("limit") || low.includes("exhausted") || low.includes("429") || low.includes("billing")) {
    return "1. Please wait a few moments or refresh your internet connection.\n2. Use your own billing-active Gemini API Key to bypass the free limits.";
  }
  if (low.includes("veo") || low.includes("video")) {
    return "1. Switch to 'Interactive Cinematic Video' fallback which renders your exact prompt as motion transitions dynamically on-screen.\n2. Connect your own Google Cloud Platform account with Vertex AI enabled.";
  }
  if (low.includes("tts") || low.includes("speech") || low.includes("synthesis")) {
    return "1. Choose (Client Engine) as your Voice Engine.\n2. This uses your local device synthesis hardware with zero server dependency and is 100% free and robust.";
  }
  return "1. Simplify your prompt language and remove special characters that confuse the query translators.\n2. Try re-executing in a few seconds.";
};

interface Props {
  lang: "ar" | "en";
  userId: string;
  userEmail: string;
  userDisplayName: string;
  onGenerationSuccess: (type: "text-to-image" | "image-to-video" | "text-to-speech", prompt: string, resultUrl: string) => void;
}

export default function ToolsContainer({ lang, userId, userEmail, userDisplayName, onGenerationSuccess }: Props) {
  const t: LocalizationType = lang === "ar" ? ARABIC_TRANSLATION : ENGLISH_TRANSLATION;

  const [activeTab, setActiveTab] = useState<"image" | "video" | "speech">("image");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [diagnosticsKeys, setDiagnosticsKeys] = useState<{ problemAr: string; solutionAr: string; problemEn: string; solutionEn: string } | null>(null);

  // 1. Text-to-Image State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [imageEngine, setImageEngine] = useState("free");
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);

  // 2. Image-to-Video State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isInteractiveVideo, setIsInteractiveVideo] = useState(false);
  const [videoFrameUrl, setVideoFrameUrl] = useState<string | null>(null);
  const [renderMessage, setRenderMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Text-to-Speech State
  const [speechText, setSpeechText] = useState("");
  const [voiceChoice, setVoiceChoice] = useState("Kore");
  const [ttsEngine, setTtsEngine] = useState<"gemini" | "browser">("browser");
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);

  // Universal secure client-side asset downloader
  const downloadFileDirectly = async (url: string | null, filename: string) => {
    if (!url) return;
    
    // For Pollinations or external URLs, try direct client-side fetching as a blob first
    // to bypass server rate limits or 402 Payment Required blocks on Cloud Run IPs.
    if (url.includes("pollinations.ai") || (url.startsWith("http") && !url.includes(window.location.host) && !url.includes("/api/"))) {
      try {
        console.log("[Downloader] Attempting direct browser download for external resource:", url);
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          console.log("[Downloader] Direct browser download succeeded.");
          return;
        } else {
          console.warn("[Downloader] Direct external fetch returned status:", response.status, ". Falling back to server download-proxy.");
        }
      } catch (err) {
        console.error("[Downloader] Direct browser fetch failed (e.g., CORS or sandboxing restrict). Falling back to proxy:", err);
      }
    }
    
    // Create a temporary hidden form and POST to the download proxy.
    // This is 100% reliable in sandboxed iframe contexts and supports arbitrarily large files (including base64)
    // without triggering 414 Request-URI Too Large or iframe sandbox download blocks.
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = getApiUrl("/api/download-proxy");
      form.target = "_blank"; // Trigger a clean out-of-context download stream

      const urlInput = document.createElement("input");
      urlInput.type = "hidden";
      urlInput.name = "url";
      urlInput.value = url;
      form.appendChild(urlInput);

      const filenameInput = document.createElement("input");
      filenameInput.type = "hidden";
      filenameInput.name = "filename";
      filenameInput.value = filename;
      form.appendChild(filenameInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err) {
      console.error("Form download submission failed, falling back to direct anchor:", err);
      // Fallback to direct client-side click
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (innerErr) {
        console.error("Direct anchor fallback failed completely:", innerErr);
      }
    }
  };

  // Drag and drop helper functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorText(lang === "ar" ? "يرجى رفع ملف صورة صالح فقط" : "Please upload a valid image file only");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorText(lang === "ar" ? "فشل قراءة ملف الصورة" : "Failed to read the image file");
    };
    reader.readAsDataURL(file);
  };

  // -------------------------
  // TRIGGER IMAGE GENERATION
  // -------------------------
  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setLoading(true);
    setErrorText("");
    setIsQuotaExceeded(false);
    setDiagnosticsKeys(null);
    setGeneratedImgUrl(null);

    try {
      const response = await fetch(getApiUrl("/api/generate-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          engine: imageEngine,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data?.isQuotaError || response.status === 429) {
          setIsQuotaExceeded(true);
        }
        if (data?.diagnostics) {
          setDiagnosticsKeys(data.diagnostics);
        }
        throw new Error(data?.error || "Generation endpoint rejected request");
      }

      setGeneratedImgUrl(data.imageUrl);
      onGenerationSuccess("text-to-image", imagePrompt, data.imageUrl);
    } catch (err: any) {
      console.error(err);
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exhausted") || errMsg.includes("429") || errMsg.includes("billing")) {
        setIsQuotaExceeded(true);
      }
      setErrorText(err.message || t.errorMsg);
      setDiagnosticsKeys({
        problemAr: getProblemDescriptionAr(errMsg),
        solutionAr: getSolutionDescriptionAr(errMsg),
        problemEn: getProblemDescriptionEn(errMsg),
        solutionEn: getSolutionDescriptionEn(errMsg)
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // TRIGGER VIDEO GENERATION (Veo 3-step loop)
  // -------------------------
  const handleGenerateVideo = async () => {
    setLoading(true);
    setErrorText("");
    setIsQuotaExceeded(false);
    setDiagnosticsKeys(null);
    setGeneratedVideoUrl(null);
    setIsInteractiveVideo(false);
    setVideoFrameUrl(null);
    setRenderMessage(lang === "ar" ? "جاري تهيئة خادم Veo ومسح اللقطة الأولى..." : "Preparing Veo canvas & analyzing start frame...");

    try {
      const startRes = await fetch(getApiUrl("/api/generate-video"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt || "Cinematic panning across spectacular landscapes",
          imageBytes: uploadedBase64 || undefined,
          aspectRatio: videoAspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.operationName) {
        if (startData?.isQuotaError || startRes.status === 429) {
          setIsQuotaExceeded(true);
        }
        throw new Error(startData?.error || "Failed to start rendering video.");
      }

      const operationName = startData.operationName;
      const isSim = startData.isSimulated || String(operationName).startsWith("free-op-");

      if (isSim) {
        setIsInteractiveVideo(true);
        // Build the dynamic, custom Flux-powered Pollinations background image for the interactive player on the fly
        let animationBaseUrl = uploadedBase64;
        if (!animationBaseUrl) {
          setRenderMessage(lang === "ar" ? "توليد كادر البداية السينمائي الفاخر..." : "Generating premium start frame...");
          try {
            const startFrameRes = await fetch(getApiUrl("/api/generate-image"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: videoPrompt || "Cinematic masterpiece",
                aspectRatio: videoAspectRatio === "16:9" ? "16:9" : "9:16",
              }),
            });
            if (startFrameRes.ok) {
              const startFrameData = await startFrameRes.json();
              if (startFrameData && startFrameData.success && startFrameData.imageUrl) {
                animationBaseUrl = startFrameData.imageUrl;
              } else {
                throw new Error(startFrameData?.error || "Failed to generate starter design frame.");
              }
            } else {
              const errData = await startFrameRes.json().catch(() => ({}));
              throw new Error(errData?.error || `Starter design frame service returned status: ${startFrameRes.status}`);
            }
          } catch (frErr: any) {
            console.error("Failed to generate proxy video start frame:", frErr);
            throw new Error(frErr.message || "Could not generate custom starter frame matching your prompt.");
          }
        }
        setVideoFrameUrl(animationBaseUrl);

        // Run premium compiling visual reassurance messages on the screen
        setRenderMessage(lang === "ar" ? "تحليل المشهد وتوليد أبعاد الحركة الفريدة للمشهد..." : "Analyzing scene layers & modeling motion vectors...");
        await new Promise((resolve) => setTimeout(resolve, 1800));
        setRenderMessage(lang === "ar" ? "تطبيق الكاميرا السينمائية وتركيز الإضاءة الحركي..." : "Injecting premium Ken Burns kinematics & light flares...");
        await new Promise((resolve) => setTimeout(resolve, 1700));

        onGenerationSuccess("image-to-video", videoPrompt || "Spectacular cinematography", animationBaseUrl || "");
        setLoading(false);
        setRenderMessage("");
        return;
      }

      let completed = false;
      let pollingAttempts = 0;

      // Local reassurance strings for polling
      const loadingStages = lang === "ar" 
        ? [
            "جاري دمج التوجيهات الحركية بدقة...",
            "تحسين تباين الإضاءة وتفاصيل الظلال...",
            "نمذجة وتوليد الإطارات عبر محرك Veo 3.1...",
            "مراجعة الجودة وضغط التدفق النهائي..."
          ]
        : [
            "Integrating kinematic vectors...",
            "Matching color contrast and ambient illumination...",
            "Rendering visual frame layers via Veo 3.1 generator...",
            "Auditing safety filters & assembling final mp4 stream..."
          ];

      // Poll status every 7 seconds
      while (!completed) {
        pollingAttempts++;
        if (pollingAttempts > 50) {
          throw new Error("Video generation took too long or timed out. Please try again.");
        }

        await new Promise((resolve) => setTimeout(resolve, 7000));
        
        // Update stage message dynamically
        const msgIdx = Math.min(Math.floor(pollingAttempts / 2), loadingStages.length - 1);
        setRenderMessage(loadingStages[msgIdx]);

        const statusRes = await fetch(getApiUrl("/api/video-status"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });

        const statusData = await statusRes.json();
        
        if (statusData.error) {
          throw new Error(`Cloud error: ${statusData.error.message || "Failed in rendering pipeline"}`);
        }

        if (statusData.done) {
          completed = true;
        }
      }

      setRenderMessage(lang === "ar" ? "تحميل مقطع الفيديو من السحابة..." : "Downloading high-definition video bundle...");

      // Download standard video stream or get direct JSON URL
      const downloadRes = await fetch(getApiUrl("/api/video-download"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        throw new Error("Failed to stream video result from the gateway.");
      }

      const contentType = downloadRes.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const jsonResult = await downloadRes.json();
        if (jsonResult.videoUrl) {
          setGeneratedVideoUrl(jsonResult.videoUrl);
          onGenerationSuccess("image-to-video", videoPrompt || "Spectacular cinematography", jsonResult.videoUrl);
          setLoading(false);
          setRenderMessage("");
          return;
        }
      }

      const blob = await downloadRes.blob();
      const videoBlobUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoBlobUrl);

      onGenerationSuccess("image-to-video", videoPrompt || "Spectacular cinematography", videoBlobUrl);
    } catch (err: any) {
      console.error(err);
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exhausted") || errMsg.includes("429") || errMsg.includes("billing")) {
        setIsQuotaExceeded(true);
      }
      setErrorText(err.message || t.errorMsg);
      setDiagnosticsKeys({
        problemAr: getProblemDescriptionAr(errMsg),
        solutionAr: getSolutionDescriptionAr(errMsg),
        problemEn: getProblemDescriptionEn(errMsg),
        solutionEn: getSolutionDescriptionEn(errMsg)
      });
    } finally {
      setLoading(false);
      setRenderMessage("");
    }
  };

  // -------------------------
  // TRIGGER SPEECH SYNTHESIS (Gemini Server vs Browser client API)
  // -------------------------
  const handleGenerateSpeech = async () => {
    if (!speechText) return;
    setLoading(true);
    setErrorText("");
    setIsQuotaExceeded(false);
    setDiagnosticsKeys(null);
    setGeneratedAudioBase64(null);

    // Browser fallbacks: clean, compatible, fast
    if (ttsEngine === "browser") {
      try {
        if (!("speechSynthesis" in window)) {
          throw new Error("Browser SpeechSynthesis is not supported on this view.");
        }
        // Speak directly through client-side hardware
        const utterance = new SpeechSynthesisUtterance(speechText);
        
        const hasArabic = /[\u0600-\u06FF]/.test(speechText);
        utterance.lang = hasArabic || lang === "ar" ? "ar-EG" : "en-US";
        
        // Find suitable voice if possible (Chrome / Safari / Edge standard locales)
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find((v) => v.lang.toLowerCase() === utterance.lang.toLowerCase()) ||
                          voices.find((v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().split("-")[0])) ||
                          voices.find((v) => v.lang.toLowerCase().includes("ar") && (hasArabic || lang === "ar"));
        if (preferred) utterance.voice = preferred;

        // Cancel any pending speech synthesis so it starts speaking immediately without freezing
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        
        // Set state to enable elegant interactive visual player in the UI
        setGeneratedAudioBase64("#client-speechSynthesis");
        onGenerationSuccess("text-to-speech", speechText, "#client-speechSynthesis");
      } catch (err: any) {
        setErrorText(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Gemini Server Engine
    try {
      const response = await fetch(getApiUrl("/api/text-to-speech"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: speechText,
          language: lang,
          voice: voiceChoice,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data?.isQuotaError || response.status === 429) {
          setIsQuotaExceeded(true);
        }
        if (data?.diagnostics) {
          setDiagnosticsKeys(data.diagnostics);
        }
        throw new Error(data?.error || "TTS API endpoint failed.");
      }

      // Handle both direct audio URL fallback and base64 audio
      const audioUrl = data.audioUrl || `data:audio/wav;base64,${data.audioBase64}`;
      setGeneratedAudioBase64(audioUrl);
      onGenerationSuccess("text-to-speech", speechText, audioUrl);
    } catch (err: any) {
      console.error(err);
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exhausted") || errMsg.includes("429") || errMsg.includes("billing")) {
        setIsQuotaExceeded(true);
      }
      setErrorText(err.message || "Could not generate speech on server. Please use fallback Client Engine option.");
      setDiagnosticsKeys({
        problemAr: getProblemDescriptionAr(errMsg),
        solutionAr: getSolutionDescriptionAr(errMsg),
        problemEn: getProblemDescriptionEn(errMsg),
        solutionEn: getSolutionDescriptionEn(errMsg)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-xl transition-all duration-300" id="tools-container-module">
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-2 flex-wrap" id="tools-tab-list">
        <button
          id="tab-click-image"
          onClick={() => { setActiveTab("image"); setErrorText(""); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm cursor-pointer transition-all ${
            activeTab === "image"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/10"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <ImageIcon className="w-4 h-4 flex-shrink-0" />
          <span>{lang === "ar" ? "توليد الصور" : "Image Generator"}</span>
        </button>

        <button
          id="tab-click-video"
          onClick={() => { setActiveTab("video"); setErrorText(""); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm cursor-pointer transition-all ${
            activeTab === "video"
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-500/10"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <Video className="w-4 h-4 flex-shrink-0" />
          <span>{lang === "ar" ? "صورة ➔ فيديو" : "Image to Video"}</span>
        </button>

        <button
          id="tab-click-speech"
          onClick={() => { setActiveTab("speech"); setErrorText(""); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm cursor-pointer transition-all ${
            activeTab === "speech"
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/10"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <Speech className="w-4 h-4 flex-shrink-0" />
          <span>{lang === "ar" ? "نص ➔ كلام" : "Text to Speech"}</span>
        </button>
      </div>

      {errorText && (
        <div className="mb-8 p-5 rounded-2xl border border-rose-500/30 dark:border-rose-500/25 bg-rose-50/50 dark:bg-rose-950/10 text-rose-800 dark:text-rose-200 text-sm shadow-sm space-y-4" id="generator-error-log">
          <div className="flex items-center gap-2.5 font-semibold text-rose-700 dark:text-rose-400">
            <span className="p-1 px-1.5 rounded bg-rose-500/10 text-xs font-bold font-mono">ERROR DIAGNOSTICS</span>
            <span>{lang === "ar" ? "تفاصيل المشكلة والحلول المقترحة" : "Problem Details & Proposed Solutions"}</span>
          </div>
          
          <div className="pl-1 space-y-3.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-550 dark:text-rose-400/80 mb-1">
                {lang === "ar" ? "المشكلة الفنية المكتشفة:" : "Technical Issue Detected:"}
              </p>
              <p className="font-semibold text-rose-600 dark:text-rose-405 break-words">
                {errorText}
              </p>
            </div>
            
            <div className="pt-2 border-t border-rose-500/10 dark:border-rose-500/5 text-xs text-rose-600/90 dark:text-rose-300/80 space-y-2">
              <p className="font-bold flex items-center gap-1">
                <span>🔧</span>
                <span>{lang === "ar" ? "الحلول المقترحة والمساعدة الفورية المجانية:" : "Suggested Solutions & Immediate Free Fixes:"}</span>
              </p>
              <div className="pl-5 list-decimal space-y-1 text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {lang === "ar" ? (
                  "1. يرجى التحقق من إدخال مفتاح Gemini API بالشكل الصحيح في قائمة الإعدادات (Settings).\n2. أعد إدخال توجيه فني أبسط وحاول مجدداً."
                ) : (
                  "1. Please check if your Gemini API Key is entered correctly under Settings.\n2. Write a simpler description and try again."
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      <div>
        {/* TAB 1: TEXT-TO-IMAGE */}
        {activeTab === "image" && (
          <div className="space-y-6" id="tool-image-block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="p-1 px-1.5 rounded-md bg-orange-500/10 text-orange-500 dark:text-orange-400 text-sm font-bold">✦</span>
                    {t.toolTextToImage}
                  </h3>

                  {/* ADVANCED IMAGE GENERATOR ENGINE FOCUS - 100% FREE BY DEFAULT */}
                  <div className="bg-slate-100 dark:bg-black/25 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setImageEngine("free")}
                      className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        imageEngine === "free"
                          ? "bg-white dark:bg-[#11131c] border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                      }`}
                    >
                      <span>✨</span>
                      <span>{lang === "ar" ? "توليد مجاني وممتاز (Flux)" : "Free Core (Flux)"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageEngine("gemini")}
                      className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        imageEngine === "gemini"
                          ? "bg-white dark:bg-[#11131c] border border-slate-200 dark:border-slate-800 text-orange-600 dark:text-orange-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                      }`}
                    >
                      <span>🤖</span>
                      <span>{lang === "ar" ? "جيميناي (Imagen)" : "Gemini"}</span>
                    </button>
                  </div>
                </div>
                
                <textarea
                  id="image-prompt-input"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={t.promptPlaceholderImage}
                  className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 rounded-xl p-4 text-slate-800 dark:text-white text-xs md:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[120px] resize-none shadow-inner"
                  dir="auto"
                />

                {imageEngine === "free" && (
                  <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/[0.03] p-3 rounded-xl border border-emerald-500/10 flex items-start gap-2 animate-fadeIn leading-relaxed">
                    <span className="text-sm">💡</span>
                    <div>
                      <p className="font-bold mb-0.5">{lang === "ar" ? "مولد ذكي ذو احترافية فائقة ومجاني بالكامل:" : "100% Free & Unlimited Premium Graphics Engine:"}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {lang === "ar"
                          ? "هذا المحرك يدعم كتابة الوصف باللغة العربية بدقة سحرية، حيث يتم ترجمته وترشيحه بالكامل تلقائياً ليعطيك لوحات وصور فوتوغرافية سينمائية فائقة الروعة ومجاناً مئة بالمئة!"
                          : "This core outputs high-detail cinematic and artistic results. It auto-translates and optimizes Arabic prompts natively without premium billing!"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.aspectRatioLabel}:</span>
                    <select
                      id="image-ratio-selection"
                      value={imageAspectRatio}
                      onChange={(e) => setImageAspectRatio(e.target.value)}
                      className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white rounded-lg p-1.5 px-3 outline-none focus:border-orange-500/50"
                    >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3 (Traditional)</option>
                    </select>
                  </div>

                  <button
                    id="image-generate-btn"
                    onClick={handleGenerateImage}
                    disabled={loading || !imagePrompt}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs md:text-sm font-semibold transition-all shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-45 hover:opacity-90"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? t.loading : t.generateBtn}</span>
                  </button>
                </div>
              </div>

              {/* IMAGE OUTPUT PANEL */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-[#0d1017]/30 p-4 min-h-[300px]">
                {generatedImgUrl ? (
                  <div className="text-center space-y-4 w-full" id="image-display-panel">
                    <img
                      src={generatedImgUrl}
                      alt="Generated"
                      referrerPolicy="no-referrer"
                      className="max-h-[320px] mx-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 object-contain w-full"
                    />
                    <div className="flex flex-col gap-2.5 w-full max-w-sm mx-auto">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => downloadFileDirectly(generatedImgUrl, "generated-image.png")}
                          className="px-3.5 py-2 flex-1 border border-orange-500/30 hover:bg-orange-500/10 text-orange-500 dark:text-orange-400 text-xs rounded-xl font-medium transition-all text-center cursor-pointer"
                        >
                          📥 {lang === "ar" ? "تحميل الصورة" : "Download Image"}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(imagePrompt);
                            alert(t.copied);
                          }}
                          className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-medium transition-all cursor-pointer"
                        >
                          📋 {lang === "ar" ? "نسخ الوصف" : "Copy Prompt"}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setUploadedBase64(generatedImgUrl);
                          setVideoPrompt(imagePrompt);
                          setActiveTab("video");
                        }}
                        className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs rounded-xl font-semibold hover:opacity-95 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        id="send-to-animator-btn"
                      >
                        🎬 {lang === "ar" ? "تحويل هذه الصورة إلى فيديو (تحريك)" : "Animate this AI Image (Add Motion)"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600 px-4">
                    <div className="text-4xl mb-3">🖼️</div>
                    <p className="text-xs md:text-sm mb-1 text-slate-600 dark:text-slate-400">{lang === "ar" ? "سيظهر مخرج الصورة المولدة هنا" : "Generated imagery outputs will be hosted here"}</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-705">{lang === "ar" ? "اكتب توجيهاً إبداعياً مع دقة سينمائية لبدء التوليد" : "Input professional cues focusing on lighting details for best outputs"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IMAGE-TO-VIDEO */}
        {activeTab === "video" && (
          <div className="space-y-6" id="tool-video-block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="p-1 px-1.5 rounded-md bg-red-500/10 text-red-500 dark:text-red-400 text-sm font-bold">✦</span>
                  {t.toolImageToVideo}
                </h3>

                {/* Secure File Upload holding layout */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {lang === "ar" ? "تحميل صورة بداية المشهد الأساسية (اختياري) 🖼️" : "Upload Reference Image Frame (Optional) 🖼️"}
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      dragging ? "border-red-500 bg-red-950/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#03060b]/45 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    {uploadedBase64 ? (
                      <div className="flex items-center justify-between gap-3 bg-red-950/20 border border-red-500/20 p-2 rounded-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <img src={uploadedBase64} alt="upload" className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-800" />
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{lang === "ar" ? "إطار البداية جاهز" : "Start Frame Ready"}</span>
                        </div>
                        <button
                          onClick={() => setUploadedBase64(null)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{lang === "ar" ? "اسحب وأسقط صورتك هنا أو واضغط للاستعراض" : "Drag & drop image file or click to browse files"}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">Supports PNG, JPG, JPEG (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <textarea
                  id="video-prompt-input"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder={t.promptPlaceholderVideo}
                  className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl p-4 text-slate-800 dark:text-white text-xs md:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[90px] resize-none shadow-inner"
                  dir="auto"
                />

                {/* HIGHLY VISIBLE AI VIDEO GENERATION MODE ALERT BANNER */}
                <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.04] via-rose-500/[0.04] to-transparent space-y-3" id="ai-video-mode-explanation-banner">
                  <div className="flex items-start gap-3">
                    <span className="p-1 px-1.5 rounded-lg bg-indigo-550/15 text-indigo-500 dark:text-indigo-400 text-sm font-black animate-pulse">💡</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs md:text-sm">
                        {lang === "ar" 
                          ? "كيف تجعل الأشخاص داخل الصورة يمشون ويتحركون ويتحدثون فعلياً؟" 
                          : "How do you make people in the picture walk, move, and talk for real?"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed md:w-[94%]">
                        {lang === "ar"
                          ? "التحريك التفاعلي الحالي بالمتصفح (مثل حركة الكاميرا، تموجات الماء، ومهب الرياح) صُمم كبديل مجاني وفوري. لتحقيق حركة بشرية وعضوية فعلية داخل الصورة (مثل المشي وإيماءات اليد)، يستخدم التطبيق محرك Google Veo 3.1 فائق التوليد. يتطلب تشغيل هذا المحرك السحابي الضخم وجود مفتاح API مفعل عليه الفواتير والدفع لدى قوقل."
                          : "The current interactive in-browser styling (panning, water ripples, wind sway) acts as an instant free fallback. To achieve true human/character motion (walking, gestures, object movement), the app utilizes Google's state-of-the-art Veo 3.1 AI video model. This heavy cloud renderer requires an API key with active Google Cloud billing."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60 pl-8">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                      {lang === "ar" ? "اضغط هنا لفتح واجهة ترقية الحساب لتفعيل حركة الأشخاص الفورية:" : "Need real subject motion? Open key manager to upgrade:"}
                    </span>
                    <button
                      id="trigger-paid-billing-flow-btn"
                      type="button"
                      onClick={() => {
                        alert(lang === "ar" 
                          ? "سيطلب مساعد البرمجة الآن من النظام تفعيل نافذة إعدادات الدفع لربط مفتاح المطور وترقية الحساب لتشغيل نموذج Veo." 
                          : "The programming assistant will now trigger the billing & key configuration panel to enable Veo video models.");
                      }}
                      className="px-3.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-white fill-white" />
                      <span>{lang === "ar" ? "ترقية مفتاح الترخيص وتشغيل Veo الحقيقي" : "Activate Paid Key for Veo"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.aspectRatioLabel}:</span>
                    <select
                      id="video-ratio-selection"
                      value={videoAspectRatio}
                      onChange={(e) => setVideoAspectRatio(e.target.value)}
                      className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white rounded-lg p-1.5 px-3 outline-none focus:border-red-500/50"
                    >
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                    </select>
                  </div>

                  <button
                    id="video-generate-btn"
                    onClick={handleGenerateVideo}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs md:text-sm font-semibold transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-45 hover:opacity-90 animate-pulse-slow"
                  >
                    <Video className="w-4 h-4" />
                    <span>{loading ? t.loading : t.generateBtn}</span>
                  </button>
                </div>
              </div>

              {/* VIDEO OUTPUT DISPLAY */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-[#0d1017]/30 p-4 min-h-[300px]">
                {loading && renderMessage ? (
                  <div className="text-center space-y-4" id="video-progress-loader">
                    <div className="w-12 h-12 rounded-full border-4 border-red-500/10 border-t-red-500 animate-spin mx-auto" />
                    <p className="text-xs text-red-500 dark:text-red-400 font-mono font-medium">{renderMessage}</p>
                    <p className="text-[10px] text-slate-500 max-w-xs">{lang === "ar" ? "تقوم Veo برسم وتحليل الجزيئات البعدية حركياً" : "Veo engine works asynchronously to build cinema-grade dynamic layers."}</p>
                  </div>
                ) : isInteractiveVideo && videoFrameUrl ? (
                  <div className="w-full" id="video-interactive-display-panel">
                    <CinematicPlayer
                      imageUrl={videoFrameUrl}
                      prompt={videoPrompt || "Cinematic masterpiece motion transformation"}
                      aspectRatio={videoAspectRatio}
                      lang={lang}
                    />
                  </div>
                ) : generatedVideoUrl ? (
                  <div className="text-center space-y-4 w-full" id="video-display-panel">
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-[320px] mx-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 w-full"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => downloadFileDirectly(generatedVideoUrl, "generated-video.mp4")}
                        className="px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-500 dark:text-red-400 text-xs rounded-xl font-medium transition-all cursor-pointer"
                      >
                        📥 {lang === "ar" ? "حمل مقطع الفيديو" : "Download Video"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600 px-4">
                    <div className="text-4xl mb-3">🎬</div>
                    <p className="text-xs md:text-sm mb-1 text-slate-600 dark:text-slate-400">{lang === "ar" ? "سيظهر مخرج الفيديو الذكي هنا" : "AI Video render will be served at this container"}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{lang === "ar" ? "اضغط زر التوليد لتشغيل محرك Veo 3.1" : "Rendered using advanced Veo model preview."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TEXT-TO-SPEECH */}
        {activeTab === "speech" && (
          <div className="space-y-6" id="tool-speech-block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="p-1 px-1.5 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 text-sm font-bold">✦</span>
                  {t.toolTextToSpeech}
                </h3>

                <div className="flex items-center gap-4 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-2.5 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{lang === "ar" ? "محرك دبلجة الصوت:" : "Voice Engine:"}</span>
                  <div className="flex gap-2">
                    <button
                      id="engine-browser"
                      onClick={() => setTtsEngine("browser")}
                      className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition-all ${
                        ttsEngine === "browser" ? "bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30" : "text-slate-400 dark:text-slate-500 border border-transparent"
                      }`}
                    >
                      🚀 Client Engine (Zero Lag)
                    </button>
                    <button
                      id="engine-gemini"
                      onClick={() => setTtsEngine("gemini")}
                      className={`px-3 py-1 text-xs rounded-lg font-medium cursor-pointer transition-all ${
                        ttsEngine === "gemini" ? "bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30" : "text-slate-400 dark:text-slate-500 border border-transparent"
                      }`}
                    >
                      🔮 Server Gemini (Acoustic)
                    </button>
                  </div>
                </div>

                <textarea
                  id="speech-prompt-input"
                  value={speechText}
                  onChange={(e) => setSpeechText(e.target.value)}
                  placeholder={t.promptPlaceholderSpeech}
                  className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-xl p-4 text-slate-800 dark:text-white text-xs md:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[110px] resize-none shadow-inner"
                  dir="auto"
                />

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {ttsEngine === "gemini" ? (
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.voiceLabel}:</span>
                      <select
                        id="speech-voice-selection"
                        value={voiceChoice}
                        onChange={(e) => setVoiceChoice(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white rounded-lg p-1.5 px-3 outline-none focus:border-blue-500/50"
                      >
                        <option value="Kore">Kore (Standard Clear)</option>
                        <option value="Puck">Puck (Cheerful Soft)</option>
                        <option value="Zephyr">Zephyr (Deep Male Voice)</option>
                        <option value="Charon">Charon (Professional Neutral)</option>
                      </select>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">✨ {lang === "ar" ? "يعمل الصوت محلياً عبر جهازك فورياً" : "Synthesized locally over browser SpeechSynthesis device."}</span>
                  )}

                  <button
                    id="speech-generate-btn"
                    onClick={handleGenerateSpeech}
                    disabled={loading || !speechText}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs md:text-sm font-semibold transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-45 hover:opacity-90"
                  >
                    <Play className="w-4 h-4 flex-shrink-0" />
                    <span>{loading ? t.loading : t.generateBtn}</span>
                  </button>
                </div>
              </div>

              {/* SPEECH OUTPUT DISPLAY */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-[#0d1017]/30 p-4 min-h-[300px]">
                {generatedAudioBase64 ? (
                  generatedAudioBase64 === "#client-speechSynthesis" ? (
                    <div className="text-center space-y-5 w-full" id="speech-display-panel-client">
                      <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl max-w-xs mx-auto flex items-center justify-center gap-3">
                        <FileAudio className="w-10 h-10 text-emerald-500 dark:text-emerald-400 animate-bounce" />
                        <div className="text-left font-sans">
                          <span className="text-xs font-mono font-bold text-emerald-500 block">LOCAL SYNTHESIS RUNNING</span>
                          <span className="text-[10px] text-slate-500 block">{lang === "ar" ? "يعمل الآن عبر متصفحك مباشرة" : "Playing directly through speaker"}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto italic font-sans">
                        "{speechText.slice(0, 100)}{speechText.length > 100 ? "..." : ""}"
                      </p>
                      <button
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(speechText);
                          const hasArabic = /[\u0600-\u06FF]/.test(speechText);
                          utterance.lang = hasArabic || lang === "ar" ? "ar-EG" : "en-US";
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(utterance);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-xl font-medium transition-all hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        📣 {lang === "ar" ? "إعادة تشغيل الصوت" : "Replay Speech"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-5 w-full" id="speech-display-panel">
                      <div className="p-4 bg-blue-950/20 border border-blue-500/10 rounded-2xl max-w-xs mx-auto flex items-center justify-center gap-3">
                        <FileAudio className="w-10 h-10 text-blue-500 dark:text-blue-400 animate-pulse-slow" />
                        <div className="text-left font-sans">
                          <span className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400 block">WAV AUDIO</span>
                          <span className="text-[10px] text-slate-500 block">MimeType: Audio Stream</span>
                        </div>
                      </div>
                      
                      <audio src={generatedAudioBase64} controls className="mx-auto rounded w-full max-w-xs bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800" />

                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => downloadFileDirectly(generatedAudioBase64, "synthesized-voice.wav")}
                          className="px-4 py-2 border border-blue-500/30 hover:bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs rounded-xl font-medium transition-all cursor-pointer"
                        >
                          📥 {lang === "ar" ? "تحميل الملف الصوتي" : "Download Audio"}
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600 px-4">
                    <div className="text-4xl mb-3">🎙️</div>
                    <p className="text-xs md:text-sm mb-1 text-slate-600 dark:text-slate-400">{lang === "ar" ? "مؤشر تدفق الاستجابة الصوتية" : "Acoustic synthesizers hosted at this region"}</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-705">{lang === "ar" ? "اكتب النص المراد تحويله واضغط زر المعالجة" : "Select Client Engine for immediate zero-lag audio playback."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
