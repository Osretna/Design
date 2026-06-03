import React, { useState, useRef } from "react";
import { ARABIC_TRANSLATION, ENGLISH_TRANSLATION, LocalizationType } from "../types";
import { getApiUrl } from "../utils/api";
import { Image as ImageIcon, Video, Speech, Sliders, Play, Sparkles, Upload, FileAudio, Check, Trash2 } from "lucide-react";

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

  // 1. Text-to-Image State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);

  // 2. Image-to-Video State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [renderMessage, setRenderMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Text-to-Speech State
  const [speechText, setSpeechText] = useState("");
  const [voiceChoice, setVoiceChoice] = useState("Kore");
  const [ttsEngine, setTtsEngine] = useState<"gemini" | "browser">("browser");
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);

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
    setGeneratedImgUrl(null);

    try {
      const response = await fetch(getApiUrl("/api/generate-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Generation endpoint rejected request");
      }

      setGeneratedImgUrl(data.imageUrl);
      onGenerationSuccess("text-to-image", imagePrompt, data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || t.errorMsg);
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
    setGeneratedVideoUrl(null);
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
        throw new Error(startData.error || "Failed to start rendering video.");
      }

      const operationName = startData.operationName;
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

      // Download standard video binary stream
      const downloadRes = await fetch(getApiUrl("/api/video-download"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        throw new Error("Failed to stream video result from the gateway.");
      }

      const blob = await downloadRes.blob();
      const videoBlobUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoBlobUrl);

      onGenerationSuccess("image-to-video", videoPrompt || "Spectacular cinematography", videoBlobUrl);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || t.errorMsg);
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
    setGeneratedAudioBase64(null);

    // Browser fallbacks: clean, compatible, fast
    if (ttsEngine === "browser") {
      try {
        if (!("speechSynthesis" in window)) {
          throw new Error("Browser SpeechSynthesis is not supported on this view.");
        }
        // Speak directly through client-side hardware
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = lang === "ar" ? "ar-EG" : "en-US";
        
        // Find suitable voice if possible
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find((v) => v.lang.startsWith(utterance.lang));
        if (preferred) utterance.voice = preferred;

        window.speechSynthesis.speak(utterance);
        
        // Simulate a success blob audio url
        onGenerationSuccess("text-to-speech", speechText, "#client-audio");
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
        throw new Error(data.error || "TTS API endpoint failed.");
      }

      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      setGeneratedAudioBase64(audioUrl);
      onGenerationSuccess("text-to-speech", speechText, audioUrl);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Could not generate speech on server. Please use fallback Client Engine option.");
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
        <div className="mb-6 p-3.5 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs" id="generator-error-log">
          ⚠️ {errorText}
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      <div>
        {/* TAB 1: TEXT-TO-IMAGE */}
        {activeTab === "image" && (
          <div className="space-y-6" id="tool-image-block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="p-1 px-1.5 rounded-md bg-orange-500/10 text-orange-500 dark:text-orange-400 text-sm font-bold">✦</span>
                  {t.toolTextToImage}
                </h3>
                
                <textarea
                  id="image-prompt-input"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={t.promptPlaceholderImage}
                  className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 rounded-xl p-4 text-slate-805 dark:text-white text-xs md:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[120px] resize-none shadow-inner"
                  dir="auto"
                />

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.aspectRatioLabel}:</span>
                    <select
                      id="image-ratio-selection"
                      value={imageAspectRatio}
                      onChange={(e) => setImageAspectRatio(e.target.value)}
                      className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 text-xs text-slate-808 dark:text-white rounded-lg p-1.5 px-3 outline-none focus:border-orange-500/50"
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
                      className="max-h-[320px] mx-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 object-contain w-full"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <a
                        href={generatedImgUrl}
                        download="generated-image.png"
                        className="px-4 py-2 border border-orange-500/30 hover:bg-orange-500/10 text-orange-500 dark:text-orange-400 text-xs rounded-xl font-medium transition-all"
                      >
                        📥 {lang === "ar" ? "تحميل الصورة" : "Download File"}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(imagePrompt);
                          alert(t.copied);
                        }}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-medium transition-all"
                      >
                        📋 {lang === "ar" ? "نسخ الوصف" : "Copy Prompt"}
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
                        <p className="text-[10px] text-slate-450 dark:text-slate-600">Supports PNG, JPG, JPEG (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <textarea
                  id="video-prompt-input"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder={t.promptPlaceholderVideo}
                  className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl p-4 text-slate-805 dark:text-white text-xs md:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[90px] resize-none shadow-inner"
                  dir="auto"
                />

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.aspectRatioLabel}:</span>
                    <select
                      id="video-ratio-selection"
                      value={videoAspectRatio}
                      onChange={(e) => setVideoAspectRatio(e.target.value)}
                      className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 text-xs text-slate-808 dark:text-white rounded-lg p-1.5 px-3 outline-none focus:border-red-500/50"
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
                      <a
                        href={generatedVideoUrl}
                        download="generated-video.mp4"
                        className="px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-500 dark:text-red-400 text-xs rounded-xl font-medium transition-all"
                      >
                        📥 {lang === "ar" ? "حمل مقطع الفيديو" : "Download Video"}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600 px-4">
                    <div className="text-4xl mb-3">🎬</div>
                    <p className="text-xs md:text-sm mb-1 text-slate-600 dark:text-slate-400">{lang === "ar" ? "سيظهر مخرج الفيديو الذكي هنا" : "AI Video render will be served at this container"}</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-705">{lang === "ar" ? "اضغط زر التوليد لتشغيل محرك Veo 3.1" : "Rendered using advanced Veo model preview."}</p>
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
                  className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-xl p-4 text-slate-805 dark:text-white text-xs md:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[110px] resize-none shadow-inner"
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
                        className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 text-xs text-slate-808 dark:text-white rounded-lg p-1.5 px-3 outline-none focus:border-blue-500/50"
                      >
                        <option value="Kore">Kore (Standard Clear)</option>
                        <option value="Puck">Puck (Cheerful Soft)</option>
                        <option value="Zephyr">Zephyr (Deep Male Voice)</option>
                        <option value="Charon">Charon (Professional Neutral)</option>
                      </select>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">✨ Synthesized locally over browser SpeechSynthesis device.</span>
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
                  <div className="text-center space-y-5 w-full" id="speech-display-panel">
                    <div className="p-4 bg-blue-950/20 border border-blue-500/10 rounded-2xl max-w-xs mx-auto flex items-center justify-center gap-3">
                      <FileAudio className="w-10 h-10 text-blue-500 dark:text-blue-400 animate-pulse-slow" />
                      <div className="text-left">
                        <span className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400 block">WAV AUDIO</span>
                        <span className="text-[10px] text-slate-500 block">Sample Rate: 24000Hz</span>
                      </div>
                    </div>
                    
                    <audio src={generatedAudioBase64} controls className="mx-auto rounded w-full max-w-xs bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800" />

                    <div className="flex items-center justify-center gap-3">
                      <a
                        href={generatedAudioBase64}
                        download="synthesized-voice.wav"
                        className="px-4 py-2 border border-blue-500/30 hover:bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs rounded-xl font-medium transition-all"
                      >
                        📥 {lang === "ar" ? "تحميل الملف الصوتي" : "Download Audio"}
                      </a>
                    </div>
                  </div>
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
