import React, { useState, useMemo } from "react";
import { Report, LocalizationType, ARABIC_TRANSLATION, ENGLISH_TRANSLATION } from "../types";
import { BookOpen, Search, DownloadCloud, FileSpreadsheet, Eye, Printer, X, EyeOff } from "lucide-react";

interface Props {
  reports: Report[];
  lang: "ar" | "en";
  currentUserId: string;
  isAdmin: boolean;
}

export default function ReportsPanel({ reports, lang, currentUserId, isAdmin }: Props) {
  const t: LocalizationType = lang === "ar" ? ARABIC_TRANSLATION : ENGLISH_TRANSLATION;

  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Filter logs based on user scopes and selections
  const filteredReports = useMemo(() => {
    // If Admin, they see ALL logs. Otherwise they see only their OWN logs
    const scoped = reports.filter((r) => {
      if (isAdmin) return true;
      return r.userId === currentUserId;
    });

    return scoped.filter((r) => {
      const matchesType = filterType === "all" || r.type === filterType;
      const matchesSearch =
        r.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [reports, filterType, searchTerm, currentUserId, isAdmin]);

  // Export to Excel (CSV format)
  const handleExportCSV = () => {
    const headers = ["Report ID", "User Name", "User Email", "Type", "Prompt Input", "Execution Date/Time", "Result Resource"];
    const csvRows = [headers];

    filteredReports.forEach((r) => {
      csvRows.push([
        r.id,
        r.userDisplayName,
        r.userEmail,
        r.type,
        r.prompt.replace(/\n/g, " "),
        r.timestamp,
        r.resultUrl,
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AI_Studio_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to simple PDF using standard browsers printing formatting
  const handlePrintPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const direction = lang === "ar" ? "rtl" : "ltr";
    const title = lang === "ar" ? "تقرير عمليات المبدع الذكي في الوقت الفعلي" : "Smart Creator Real-Time Operations Logs";

    const rowsHtml = filteredReports
      .map(
        (r) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; font-size: 11px; font-family: monospace;">${r.id.substring(0, 8)}...</td>
        <td style="padding: 10px;">${r.userDisplayName}</td>
        <td style="padding: 10px; font-size: 12px; color: #555;">${r.userEmail}</td>
        <td style="padding: 10px; text-transform: uppercase; font-size: 11px; font-weight: bold; color: #f25f22;">${r.type}</td>
        <td style="padding: 10px; max-width: 250px; font-size: 12px;">${r.prompt}</td>
        <td style="padding: 10px; font-size: 11px; color: #666;">${new Date(r.timestamp).toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    const pageContent = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${direction}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Cairo', 'Inter', sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #ff6a00; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; color: #ff6a00; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: ${lang === "ar" ? "right" : "left"}; }
          th { background-color: #f5f5f5; padding: 12px 10px; font-size: 13px; font-weight: bold; border-bottom: 2px solid #ddd; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 11px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${lang === "ar" ? "وثيقة رسمية مستخرجة مفرزة تلقائياً" : "Official automated documented logs sheet."}</p>
          <p><strong>${lang === "ar" ? "تاريخ التصدير:" : "Generated on:"}</strong> ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>${lang === "ar" ? "المستعمل" : "User"}</th>
              <th>${lang === "ar" ? "البريد الإلكتروني" : "Email"}</th>
              <th>${lang === "ar" ? "العملية" : "Service Type"}</th>
              <th>${lang === "ar" ? "الأمر المعالج" : "Processed Prompt"}</th>
              <th>${lang === "ar" ? "الوقت" : "Timestamp"}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Smart Creator AI Platform - Secured telemetry logs
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pageContent);
    printWindow.document.close();
  };

  return (
    <div className="w-full bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-xl mt-8 transition-all duration-300" id="reports-panel-module">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-500 animate-pulse-slow flex-shrink-0" />
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{lang === "ar" ? "قائمة تفاعلية بالعمليات المنجزة ومراقبة الدخول الموثق" : "Interactive operations telemetry logging & secure entry audit"}</p>
        </div>

        {/* Toolbar & CSV/PDF Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-105 dark:hover:bg-emerald-500/20 border border-emerald-250 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.exportExel}</span>
          </button>
          
          <button
            id="export-pdf-btn"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs bg-red-50 dark:bg-red-950/20 hover:bg-red-105 dark:hover:bg-red-500/20 border border-red-250 dark:border-red-500/30 text-red-600 dark:text-red-400 font-semibold cursor-pointer transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Database Filters & Searches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            id="log-search-input"
            type="text"
            placeholder={lang === "ar" ? "بحث بالبريد، الاسم، أو الوصف..." : "Search queries, users or names..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 focus:border-orange-500/50 rounded-xl py-2.5 pl-11 pr-4 text-slate-800 dark:text-white text-xs outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 block shrink-0">{lang === "ar" ? "تصفية النوع:" : "Filter:"}</span>
          <select
            id="log-type-select-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800/80 text-xs text-slate-800 dark:text-white rounded-xl p-2.5 outline-none focus:border-orange-500/50"
          >
            <option value="all">{t.reportsFilterAll}</option>
            <option value="text-to-image">{t.reportsFilterTextToImage}</option>
            <option value="image-to-video">{t.reportsFilterImageToVideo}</option>
            <option value="text-to-speech">{t.reportsFilterTextToSpeech}</option>
            <option value="login">{lang === "ar" ? "سجلات دخول" : "Login Events"}</option>
          </select>
        </div>

        <div className="flex items-center justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {lang === "ar" ? "مفرز:" : "Filtered:"} <b className="text-orange-500 font-bold">{filteredReports.length}</b> / {reports.length}
          </span>
        </div>
      </div>

      {/* DATA GRID TABLE */}
      <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse" id="reports-table-data">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#0d1017] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <th className="p-4">{lang === "ar" ? "المعرف" : "ID"}</th>
              <th className="p-4 font-semibold">{lang === "ar" ? "المستخدم" : "User Name"}</th>
              <th className="p-4 font-semibold">{lang === "ar" ? "العملية" : "Service Type"}</th>
              <th className="p-4 font-semibold">{lang === "ar" ? "لوحة التوجيه / الأمر" : "Prompt Metadata"}</th>
              <th className="p-4 font-semibold">{lang === "ar" ? "الوقت والتاريخ" : "Timestamp"}</th>
              <th className="p-4 font-semibold text-center">{lang === "ar" ? "تفاصيل" : "Inspect"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#151821]">
                  <div className="text-3xl mb-2">📥</div>
                  <p>{t.noReports}</p>
                </td>
              </tr>
            ) : (
              filteredReports.map((r, idx) => (
                <tr key={r.id || idx} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-[#151821] dark:even:bg-[#13151d] hover:bg-slate-100/70 dark:hover:bg-slate-800/30 transition-all font-mono text-slate-700 dark:text-slate-300">
                  <td className="p-4 font-semibold text-orange-500">#{r.id.substring(0, 8)}</td>
                  <td className="p-4">
                    <span className="font-sans block font-semibold text-slate-800 dark:text-white">{r.userDisplayName || "Creative Expert"}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">{r.userEmail}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      r.type === "text-to-image" ? "bg-orange-50 dark:bg-orange-950/20 text-orange-650 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20" :
                      r.type === "image-to-video" ? "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-505/20" :
                      r.type === "text-to-speech" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 border border-blue-200 dark:border-blue-505/20" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="p-4 font-sans text-xs max-w-[220px] truncate" title={r.prompt}>
                    {r.prompt}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">{new Date(r.timestamp).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</td>
                  <td className="p-4 text-center">
                    <button
                      id={`inspect-trigger-${r.id}`}
                      onClick={() => setSelectedReport(r)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-orange-500 dark:hover:border-orange-400/50 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer text-slate-400"
                      title={t.reportDetailTitle}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP DETAIL DRAWER */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-[#020509]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="report-mdl-container">
          <div className="w-full max-w-lg bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 font-sans">
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-sans">
                🔍 {t.reportDetailTitle}
              </h3>
              <button
                id="close-mdl-btn"
                onClick={() => setSelectedReport(null)}
                className="p-1 px-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-mono block mb-1">{lang === "ar" ? "مُعرِّف السجل:" : "Log ID:"}</span>
                  <p className="font-mono text-orange-500 dark:text-orange-400 font-semibold">{selectedReport.id}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-mono block mb-1">{lang === "ar" ? "العملية المنفذة:" : "Category:"}</span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 dark:bg-orange-950/20 text-orange-650 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 font-mono">
                    {selectedReport.type}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#0d1017] border border-slate-100 dark:border-slate-900 rounded-xl space-y-4 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-lg">💡</div>
                  <div>
                    <h5 className="text-slate-800 dark:text-white font-semibold text-xs leading-none mb-1">{selectedReport.userDisplayName}</h5>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{selectedReport.userEmail}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-900 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">{lang === "ar" ? "رقم التعريف البصري:" : "User UID:"}</span>
                    <p className="font-mono truncate text-[10px] text-slate-500 dark:text-slate-300">{selectedReport.userId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">{lang === "ar" ? "الزمن المفرز:" : "Verified Date:"}</span>
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-300">{new Date(selectedReport.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-mono block mb-2">{lang === "ar" ? "توجيهات الإدخال والوصف:" : "Processed Prompt Cues:"}</span>
                <p className="bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-900 p-4 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-serif leading-relaxed" dir="auto">
                  {selectedReport.prompt || "No prompt parameters logged for this action pattern."}
                </p>
              </div>

              {selectedReport.resultUrl && selectedReport.resultUrl !== "#client-audio" && selectedReport.resultUrl !== "login_success" && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-mono block mb-2">{lang === "ar" ? "المورد المولد الموثق:" : "Generated Resource Asset:"}</span>
                  {selectedReport.resultUrl.includes("truncated...") ? (
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
                        💾 {lang === "ar" 
                          ? "تم حفظ البيانات الثنائية (Base64) بنجاح للعميل واقتصاص السجل لتوفير التخزين وتجنب تجاوز سعة Firestore." 
                          : "Base64 binary payload processed. Telemetry metadata was truncated to conserve Firestore document size limits."}
                      </p>
                      <p className="font-mono text-[10px] text-orange-500 mt-1">
                        {selectedReport.resultUrl}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      {selectedReport.type === "text-to-image" && (
                        <img src={selectedReport.resultUrl} alt="Inspection" className="max-h-24 rounded border border-slate-200 dark:border-slate-800 object-cover" />
                      )}
                      <a
                        href={selectedReport.resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500/30 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 text-xs rounded-xl font-medium transition-all"
                      >
                        🔗 {lang === "ar" ? "معاينة الرابط الكامل" : "Preview Resource Link"}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
