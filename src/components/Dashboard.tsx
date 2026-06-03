import React, { useMemo } from "react";
import { Report, LocalizationType, ARABIC_TRANSLATION, ENGLISH_TRANSLATION } from "../types";
import { User, Image as ImageIcon, Video, Speech, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

interface Props {
  reports: Report[];
  usersCount: number;
  lang: "ar" | "en";
}

export default function Dashboard({ reports, usersCount, lang }: Props) {
  const t: LocalizationType = lang === "ar" ? ARABIC_TRANSLATION : ENGLISH_TRANSLATION;

  // Compute stat metrics from live reports
  const stats = useMemo(() => {
    let images = 0;
    let videos = 0;
    let speech = 0;
    let logins = 0;

    reports.forEach((r) => {
      if (r.type === "text-to-image") images++;
      else if (r.type === "image-to-video") videos++;
      else if (r.type === "text-to-speech") speech++;
      else if (r.type === "login") logins++;
    });

    return { images, videos, speech, logins };
  }, [reports]);

  // Compute percentage calculations for bar indicators
  const totalGenerations = stats.images + stats.videos + stats.speech;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="dashboard-metric-cards">
      {/* Metric 1 - Active Members */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md" id="metric-card-members">
        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl">
            <User className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-blue-500 dark:text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded-full">
            {lang === "ar" ? "نشط" : "LIVE"}
          </span>
        </div>
        <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">{usersCount || 1}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">{t.activeUsers}</p>
        <div className="mt-4 flex items-center gap-1 text-[11px] text-blue-500 dark:text-blue-400">
          <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{lang === "ar" ? "قاعدة بيانات آمنة في الوقت الفعلي" : "Secure real-time DB sync"}</span>
        </div>
      </div>

      {/* Metric 2 - Images Rendered */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] hover:border-orange-500/30 dark:hover:border-orange-500/20 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md" id="metric-card-images">
        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-xl">
            <ImageIcon className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-orange-500 dark:text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded-full">
            Imagen / Flash
          </span>
        </div>
        <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">{stats.images}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">{lang === "ar" ? "الصور المستحدثة" : "Images Generated"}</p>
        <div className="mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-rose-500 h-1.5 rounded-full"
              style={{ width: `${totalGenerations > 0 ? (stats.images / totalGenerations) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric 3 - Videos Rendered */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] hover:border-rose-500/30 dark:hover:border-rose-500/20 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md" id="metric-card-videos">
        <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl">
            <Video className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-rose-500 dark:text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded-full">
            Veo 3.1 Live
          </span>
        </div>
        <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">{stats.videos}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">{lang === "ar" ? "الفيديوهات المنتجة" : "Videos Processed"}</p>
        <div className="mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500 h-1.5 rounded-full"
              style={{ width: `${totalGenerations > 0 ? (stats.videos / totalGenerations) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric 4 - Speech Generated */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md" id="metric-card-speech">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-505 dark:text-indigo-400 rounded-xl">
            <Speech className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-indigo-505 dark:text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-full">
            TTS Preview
          </span>
        </div>
        <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">{stats.speech}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">{lang === "ar" ? "النصوص الصوتية" : "Kore & Puck Synths"}</p>
        <div className="mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
              style={{ width: `${totalGenerations > 0 ? (stats.speech / totalGenerations) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
