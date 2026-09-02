// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";

// const CUSTOM_GAMES = [
//   { key: "kohlapur", label: "कोहलापुर (Kohlapur)", time: "1:30 PM" },
//   { key: "manipur", label: "मणिपुर (Manipur)", time: "2:30 PM" },
//   { key: "palwal-city", label: "पलवल City (Palwal City)", time: "4:30 PM" },
//   { key: "mathura-city", label: "मथूरा City (Mathura City)", time: "6:50 PM" },
// ];

// const ADMIN_EMAIL = "kapil123@gmail.com";
// const ADMIN_PASSWORD = "Kapil@1997";

// type Entry = { date: string; game: string; value: string };

// function gameMeta(key: string) {
//   return CUSTOM_GAMES.find((g) => g.key === key);
// }

// export default function AddGameValuePage() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loginError, setLoginError] = useState("");

//   const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
//   const [values, setValues] = useState<Record<string, string>>({});
//   const [savedValues, setSavedValues] = useState<Record<string, string>>({});
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState("");

//   // ----- Results list state -----
//   const [entries, setEntries] = useState<Entry[]>([]);
//   const [currentMonthOnly, setCurrentMonthOnly] = useState(true);
//   const [filterDate, setFilterDate] = useState("");
//   const [filterGame, setFilterGame] = useState("");
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [perPage, setPerPage] = useState(10);

//   // Inline edit state
//   const [editing, setEditing] = useState<string | null>(null); // `${date}__${game}`
//   const [editValue, setEditValue] = useState("");

//   // ---- Fetch saved values for the form's date ----
//   const fetchValues = useCallback(async () => {
//     try {
//       const res = await fetch(`/api/custom-games?date=${date}`);
//       const data = await res.json();
//       if (data.success && data.games) {
//         const existing: Record<string, string> = {};
//         CUSTOM_GAMES.forEach((g) => {
//           if (data.games[g.key]) existing[g.key] = data.games[g.key];
//         });
//         setSavedValues(existing);
//         setValues(existing);
//       }
//     } catch {
//       /* ignore */
//     }
//   }, [date]);

//   // ---- Fetch results list ----
//   const fetchEntries = useCallback(async () => {
//     try {
//       const now = new Date();
//       const qs = currentMonthOnly
//         ? `list=1&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
//         : `list=1&all=1`;
//       const res = await fetch(`/api/custom-games?${qs}`);
//       const data = await res.json();
//       if (data.success) setEntries(data.entries || []);
//     } catch {
//       /* ignore */
//     }
//   }, [currentMonthOnly]);

//   useEffect(() => {
//     if (!isLoggedIn) return;
//     fetchValues();
//   }, [isLoggedIn, fetchValues]);

//   useEffect(() => {
//     if (!isLoggedIn) return;
//     fetchEntries();
//   }, [isLoggedIn, fetchEntries]);

//   const handleLogin = () => {
//     if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
//       setIsLoggedIn(true);
//       setLoginError("");
//     } else {
//       setLoginError("Invalid email or password");
//     }
//   };

//   const handleSave = async () => {
//     setSaving(true);
//     setMessage("");

//     const games: Record<string, string> = {};
//     CUSTOM_GAMES.forEach((g) => {
//       if (values[g.key]?.trim()) games[g.key] = values[g.key].trim();
//     });

//     try {
//       const res = await fetch("/api/custom-games", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password, games, date }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setMessage("Values saved successfully!");
//         setSavedValues({ ...savedValues, ...games });
//         fetchEntries();
//       } else {
//         setMessage("Error: " + data.error);
//       }
//     } catch {
//       setMessage("Network error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleUpdate = async (e: Entry) => {
//     try {
//       const res = await fetch("/api/custom-games", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password, date: e.date, game: e.game, value: editValue.trim() }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setEditing(null);
//         fetchEntries();
//         if (e.date === date) fetchValues();
//       }
//     } catch {
//       /* ignore */
//     }
//   };

//   const handleDelete = async (e: Entry) => {
//     if (!confirm(`Delete ${gameMeta(e.game)?.label || e.game} result (${e.value}) for ${e.date}?`)) return;
//     try {
//       const res = await fetch("/api/custom-games", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password, date: e.date, game: e.game }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         fetchEntries();
//         if (e.date === date) fetchValues();
//       }
//     } catch {
//       /* ignore */
//     }
//   };

//   // ---- Derived: filtered + paginated entries ----
//   const filtered = useMemo(() => {
//     return entries.filter((e) => {
//       if (filterDate && e.date !== filterDate) return false;
//       if (filterGame && e.game !== filterGame) return false;
//       if (search && !e.value.includes(search.trim())) return false;
//       return true;
//     });
//   }, [entries, filterDate, filterGame, search]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
//   const safePage = Math.min(page, totalPages);
//   const start = (safePage - 1) * perPage;
//   const pageItems = filtered.slice(start, start + perPage);

//   useEffect(() => {
//     setPage(1);
//   }, [filterDate, filterGame, search, perPage, currentMonthOnly]);

//   const clearFilters = () => {
//     setFilterDate("");
//     setFilterGame("");
//     setSearch("");
//   };

//   // ---------------- Login screen ----------------
//   if (!isLoggedIn) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
//         <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
//           <h1 className="text-xl font-black text-center text-gray-900 mb-6">Admin Login</h1>
//           {loginError && (
//             <p className="text-red-500 text-sm text-center mb-4 font-bold">{loginError}</p>
//           )}
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
//                 placeholder="Enter email"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
//                 placeholder="Enter password"
//                 onKeyDown={(e) => e.key === "Enter" && handleLogin()}
//               />
//             </div>
//             <button
//               onClick={handleLogin}
//               className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition"
//             >
//               Login
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ---------------- Admin panel ----------------
//   return (
//     <div className="min-h-screen bg-gray-50 py-6 px-4">
//       <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* ===== Left: Add New Result ===== */}
//         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
//           <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
//             <span className="text-amber-500">+</span> Add New Result
//           </h1>

//           {/* Date */}
//           <div className="mb-5">
//             <label className="block text-sm font-bold text-gray-700 mb-1.5">
//               Date <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
//             />
//           </div>

//           {/* Game inputs */}
//           <div className="space-y-4 mb-6">
//             {CUSTOM_GAMES.map((game) => (
//               <div key={game.key}>
//                 <label className="block text-sm font-bold text-gray-700 mb-1.5">
//                   {game.label}
//                   <span className="text-gray-500 font-normal ml-2">({game.time})</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={values[game.key] || ""}
//                   onChange={(e) => setValues({ ...values, [game.key]: e.target.value })}
//                   className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
//                   placeholder="Enter result (e.g. 45)"
//                   maxLength={2}
//                 />
//                 {savedValues[game.key] && (
//                   <p className="text-xs text-green-600 mt-1 font-bold">Saved: {savedValues[game.key]}</p>
//                 )}
//               </div>
//             ))}
//           </div>

//           <button
//             onClick={handleSave}
//             disabled={saving}
//             className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-50"
//           >
//             {saving ? "Saving..." : "Add Result"}
//           </button>

//           {message && (
//             <p
//               className={`text-sm text-center mt-3 font-bold ${
//                 message.includes("Error") ? "text-red-500" : "text-green-600"
//               }`}
//             >
//               {message}
//             </p>
//           )}
//         </div>

//         {/* ===== Right: Results ===== */}
//         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
//           <div className="flex items-center justify-between mb-5">
//             <h2 className="text-2xl font-black text-gray-900">
//               Results <span className="text-gray-600 font-bold">({filtered.length} total)</span>
//             </h2>
//             <button
//               onClick={clearFilters}
//               className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
//             >
//               ✕ Clear Filters
//             </button>
//           </div>

//           {/* Current month toggle */}
//           <div className="flex items-center justify-between bg-amber-100 rounded-2xl px-4 py-3 mb-4">
//             <span className="text-sm font-bold text-gray-800">Show current month only</span>
//             <button
//               onClick={() => setCurrentMonthOnly((v) => !v)}
//               className={`relative w-12 h-6 rounded-full transition ${
//                 currentMonthOnly ? "bg-amber-500" : "bg-gray-400"
//               }`}
//               aria-label="Toggle current month"
//             >
//               <span
//                 className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
//                   currentMonthOnly ? "translate-x-6" : ""
//                 }`}
//               />
//             </button>
//           </div>

//           {/* Filters */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => setFilterDate(e.target.value)}
//               className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
//             />
//             <select
//               value={filterGame}
//               onChange={(e) => setFilterGame(e.target.value)}
//               className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
//             >
//               <option value="">All Games</option>
//               {CUSTOM_GAMES.map((g) => (
//                 <option key={g.key} value={g.key}>
//                   {g.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Search */}
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="🔍  Search by result number..."
//             className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
//           />

//           {/* Count + per page */}
//           <div className="flex items-center justify-between mb-3">
//             <p className="text-sm text-amber-600 font-medium">
//               {currentMonthOnly && "Current month: "}
//               {filtered.length === 0
//                 ? "No results"
//                 : `Showing ${start + 1}-${Math.min(start + perPage, filtered.length)} of ${filtered.length}`}
//             </p>
//             <select
//               value={perPage}
//               onChange={(e) => setPerPage(Number(e.target.value))}
//               className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none"
//             >
//               {[10, 20, 50].map((n) => (
//                 <option key={n} value={n}>
//                   {n} per page
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Result cards */}
//           <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
//             {pageItems.length === 0 && (
//               <p className="text-center text-gray-500 text-sm py-8">No results found.</p>
//             )}
//             {pageItems.map((e) => {
//               const meta = gameMeta(e.game);
//               const id = `${e.date}__${e.game}`;
//               const isEditing = editing === id;
//               return (
//                 <div
//                   key={id}
//                   className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5"
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2">
//                         <span className="text-amber-500">📍</span>
//                         <span className="font-bold text-gray-900 uppercase text-sm">
//                           {meta?.label || e.game}
//                         </span>
//                         {isEditing ? (
//                           <input
//                             value={editValue}
//                             onChange={(ev) => setEditValue(ev.target.value)}
//                             maxLength={2}
//                             className="w-14 bg-white border border-amber-400 rounded px-2 py-0.5 text-sm font-mono text-gray-900 focus:outline-none"
//                             autoFocus
//                           />
//                         ) : (
//                           <span className="font-black text-gray-900 ml-1">{e.value}</span>
//                         )}
//                       </div>
//                       <p className="text-xs text-gray-500 mt-1.5 ml-7">Time: {meta?.time || "-"}</p>
//                       <p className="text-xs text-gray-500 mt-1 ml-7">📅 {e.date}</p>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       {isEditing ? (
//                         <>
//                           <button
//                             onClick={() => handleUpdate(e)}
//                             className="text-green-600 hover:text-green-700 text-sm font-bold"
//                           >
//                             Save
//                           </button>
//                           <button
//                             onClick={() => setEditing(null)}
//                             className="text-gray-500 hover:text-gray-700 text-sm"
//                           >
//                             Cancel
//                           </button>
//                         </>
//                       ) : (
//                         <>
//                           <button
//                             onClick={() => {
//                               setEditing(id);
//                               setEditValue(e.value);
//                             }}
//                             className="text-amber-600 hover:text-amber-700"
//                             aria-label="Edit"
//                           >
//                             ✎
//                           </button>
//                           <button
//                             onClick={() => handleDelete(e)}
//                             className="text-red-500 hover:text-red-600"
//                             aria-label="Delete"
//                           >
//                             🗑
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <div className="flex items-center justify-center gap-2 mt-5">
//               <button
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 disabled={safePage === 1}
//                 className="w-9 h-9 rounded-lg bg-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-400 transition"
//               >
//                 ‹
//               </button>
//               {Array.from({ length: totalPages }, (_, i) => i + 1)
//                 .filter((p) => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
//                 .map((p, idx, arr) => (
//                   <span key={p} className="flex items-center">
//                     {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
//                     <button
//                       onClick={() => setPage(p)}
//                       className={`w-9 h-9 rounded-lg font-bold transition ${
//                         p === safePage
//                           ? "bg-amber-500 text-white"
//                           : "bg-gray-300 text-gray-700 hover:bg-gray-400"
//                       }`}
//                     >
//                       {p}
//                     </button>
//                   </span>
//                 ))}
//               <button
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={safePage === totalPages}
//                 className="w-9 h-9 rounded-lg bg-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-400 transition"
//               >
//                 ›
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type TopGameRow = {
  name: string;
  time: string;
  cityId: string | null;
  value: string;
};

type AdminBlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  image: string;
  date: string;
};

function currentISTDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function AddGameValuePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"khaiwal" | "results" | "blog">("khaiwal");
  const [resultDate, setResultDate] = useState(currentISTDate);
  const [topGames, setTopGames] = useState<TopGameRow[]>([]);
  const [selectedGameName, setSelectedGameName] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [loadingGames, setLoadingGames] = useState(false);
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [savingBlog, setSavingBlog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [adminBlogs, setAdminBlogs] = useState<AdminBlogPost[]>([]);
  const [originalBlogSlug, setOriginalBlogSlug] = useState("");
  const [activeEditorFormats, setActiveEditorFormats] = useState<Record<string, boolean>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    metaTitle: "",
    metaDescription: "",
    content: "",
    slug: "",
    image: "",
  });

  // ✅ NEW FIELDS (KHAIWAL)
  const [khaiwalName, setKhaiwalName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savedKhaiwal, setSavedKhaiwal] = useState<{
    name: string;
    whatsapp: string;
  } | null>(null);
  const [savingKhaiwal, setSavingKhaiwal] = useState(false);

  const fetchValues = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/khaiwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "list" }),
      });
      const data = await res.json();

      if (data.success) {
        setKhaiwalName(data.khaiwal?.name || "");
        setWhatsapp(data.khaiwal?.whatsapp || "");
        setSavedKhaiwal(data.khaiwal || null);
      }
    } catch {}
  }, [email, password]);

  const fetchTopGames = useCallback(async (date = resultDate) => {
    setLoadingGames(true);
    try {
      const res = await fetch("/api/admin/top-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, date, action: "list" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to load games");
      const games = (data.games || []) as TopGameRow[];
      setTopGames(games);
      setSelectedGameName((current) =>
        games.some((game) => game.name === current) ? current : games[0]?.name || ""
      );
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setLoadingGames(false);
    }
  }, [email, password, resultDate]);

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "list" }),
      });
      const data = await res.json();
      if (data.success) setAdminBlogs(data.posts || []);
    } catch {}
  }, [email, password]);

  useEffect(() => {
    const selected = topGames.find((game) => game.name === selectedGameName);
    setResultValue(selected?.value && selected.value !== "XX" ? selected.value : "");
  }, [selectedGameName, topGames]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchValues();
      fetchTopGames();
      fetchBlogs();
    }
  }, [isLoggedIn, fetchValues, fetchTopGames, fetchBlogs]);

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice("");
        setIsLoggedIn(true);
      } else setNotice("Invalid admin ID or password");
    } catch {
      setNotice("Unable to connect to admin login");
    }
  };

  // ✅ Save ONLY Khaiwal details (name + whatsapp) — separate from game results
  const handleSaveKhaiwal = async () => {
    if (!khaiwalName.trim() && !whatsapp.trim()) {
      alert("Please enter Khaiwal Name or WhatsApp Number");
      return;
    }

    setSavingKhaiwal(true);
    try {
      const res = await fetch("/api/admin/khaiwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          action: "save",
          name: khaiwalName.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedKhaiwal(data.khaiwal || null);
        setNotice("Khaiwal details saved successfully.");
      } else {
        setNotice(data.error || "Error saving Khaiwal details");
      }
    } catch {
      setNotice("Network error while saving Khaiwal details");
    } finally {
      setSavingKhaiwal(false);
    }
  };

  const handleSaveGame = async () => {
    const game = topGames.find((item) => item.name === selectedGameName);
    if (!game) {
      setNotice("Select a top game.");
      return;
    }
    if (!/^\d{1,2}$/.test(resultValue)) {
      setNotice("Enter a result from 00 to 99.");
      return;
    }
    setSavingGame(game.name);
    setNotice("");
    try {
      const res = await fetch("/api/admin/top-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          date: resultDate,
          action: "save",
          game: game.name,
          value: resultValue,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to save result");
      setTopGames((games) => games.map((item) =>
        item.name === game.name ? { ...item, value: data.result.value } : item
      ));
      setResultValue(data.result.value);
      setNotice(`${game.name} result saved for ${resultDate}.`);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSavingGame(null);
    }
  };

  const setBlogField = (field: keyof typeof blogForm, value: string) => {
    setBlogForm((form) => ({ ...form, [field]: value }));
  };

  const handleBlogTitle = (title: string) => {
    setBlogForm((form) => ({
      ...form,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"),
    }));
  };

  const handleSaveBlog = async () => {
    setSavingBlog(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "save", originalSlug: originalBlogSlug, ...blogForm }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to publish blog");
      setNotice(`Blog published at /blog/${data.post.slug}`);
      setBlogForm({ title: "", metaTitle: "", metaDescription: "", content: "", slug: "", image: "" });
      setOriginalBlogSlug("");
      if (editorRef.current) editorRef.current.innerHTML = "";
      await fetchBlogs();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSavingBlog(false);
    }
  };

  const editBlog = (post: AdminBlogPost) => {
    setOriginalBlogSlug(post.slug);
    setBlogForm({
      title: post.title,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      content: post.content,
      slug: post.slug,
      image: post.image || "",
    });
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = post.content;
      editorRef.current?.focus();
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBlog = async (post: AdminBlogPost) => {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "delete", slug: post.slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to delete blog");
      setNotice("Blog deleted.");
      await fetchBlogs();
    } catch (error) {
      setNotice((error as Error).message);
    }
  };

  const uploadBlogImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("email", email);
      form.append("password", password);
      form.append("image", file);
      const res = await fetch("/api/admin/blog-images", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Image upload failed");
      setBlogField("image", data.url);
      setNotice("Image uploaded.");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setUploadingImage(false);
    }
  };

  const formatBlogContent = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setBlogField("content", editorRef.current?.innerHTML || "");
    updateEditorFormats();
  };

  const updateEditorFormats = useCallback(() => {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    if (!anchor || !editorRef.current?.contains(anchor)) return;
    const element = anchor.nodeType === Node.ELEMENT_NODE ? anchor as Element : anchor.parentElement;
    const block = String(document.queryCommandValue("formatBlock") || "").toLowerCase();
    setActiveEditorFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      h2: block === "h2",
      h3: block === "h3",
      unordered: document.queryCommandState("insertUnorderedList"),
      ordered: document.queryCommandState("insertOrderedList"),
      quote: block === "blockquote",
      link: Boolean(element?.closest("a")),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateEditorFormats);
    return () => document.removeEventListener("selectionchange", updateEditorFormats);
  }, [updateEditorFormats]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-fuchsia-950 to-cyan-950 px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-2xl">🔐</div>
            <h1 className="text-2xl font-black text-slate-950">A9 Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Manage Khaiwal and top-game results</p>
          </div>
          <input
            placeholder="Admin ID"
            value={email}
            className="mb-3 h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            className="mb-3 h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {notice && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{notice}</p>}
          <button
            className="h-12 w-full rounded-xl bg-violet-700 font-black text-white shadow-lg shadow-violet-700/20 active:scale-[0.98]"
            onClick={handleLogin}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-gradient-to-r from-violet-950 via-fuchsia-950 to-cyan-950 px-4 pb-8 pt-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">A9 Control Room</p>
            <h1 className="mt-1 text-2xl font-black">Admin Panel</h1>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="rounded-xl border border-white/20 px-3 py-2 text-sm font-bold">Logout</button>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-3xl px-3 sm:px-5">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1.5 shadow-lg">
          <button
            onClick={() => setActiveTab("khaiwal")}
            className={`min-h-14 rounded-xl px-2 text-sm font-black transition ${activeTab === "khaiwal" ? "bg-brand-100 text-slate-950" : "text-slate-500"}`}
          >
            <span className="block text-lg">👤</span>Khaiwal Chart
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`min-h-14 rounded-xl px-2 text-sm font-black transition ${activeTab === "results" ? "bg-brand-100 text-slate-950" : "text-slate-500"}`}
          >
            <span className="block text-lg">🎯</span>Top Games
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`min-h-14 rounded-xl px-1 text-sm font-black transition ${activeTab === "blog" ? "bg-brand-100 text-slate-950" : "text-slate-500"}`}
          >
            <span className="block text-lg">✍️</span>Blog
          </button>
        </div>

        {notice && (
          <button onClick={() => setNotice("")} className="mt-4 w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-left text-sm font-bold text-slate-800">
            {notice} <span className="float-right">×</span>
          </button>
        )}

        {activeTab === "khaiwal" ? (
          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">Khaiwal chart settings</h2>
              <p className="mt-1 text-sm text-slate-500">Update the contact card shown on the homepage.</p>
            </div>
            <label className="mb-2 block text-sm font-black text-slate-700">Khaiwal name</label>
            <input
              placeholder="Enter Khaiwal name"
              value={khaiwalName}
              onChange={(e) => setKhaiwalName(e.target.value)}
              className="mb-4 h-13 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <label className="mb-2 block text-sm font-black text-slate-700">WhatsApp number</label>
            <input
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="h-13 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={handleSaveKhaiwal}
              disabled={savingKhaiwal}
              className="mt-5 h-13 w-full rounded-2xl bg-emerald-600 font-black text-white shadow-sm disabled:opacity-60 active:scale-[0.99]"
            >
              {savingKhaiwal ? "Saving…" : "Save Khaiwal changes"}
            </button>
            {savedKhaiwal && (savedKhaiwal.name || savedKhaiwal.whatsapp) && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Currently live</p>
                <p className="mt-2 font-black text-slate-950">{savedKhaiwal.name || "No name"}</p>
                <p className="text-sm font-semibold text-slate-600">{savedKhaiwal.whatsapp || "No WhatsApp number"}</p>
              </div>
            )}
          </section>
        ) : activeTab === "results" ? (
          <section className="mt-4">
            <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-slate-950">Top-game results</h2>
              <p className="mt-1 text-sm text-slate-500">Select a date and top game, enter its result, then save.</p>
              <label className="mt-5 mb-2 block text-sm font-black text-slate-700">Result date</label>
              <input
                type="date"
                value={resultDate}
                onChange={(e) => {
                  setResultDate(e.target.value);
                }}
                className="h-13 w-full rounded-2xl border border-slate-300 px-4 text-base font-bold outline-none focus:border-brand-500"
              />

              <label className="mt-5 mb-2 block text-sm font-black text-slate-700">Select game</label>
              <select
                value={selectedGameName}
                onChange={(e) => setSelectedGameName(e.target.value)}
                disabled={loadingGames}
                className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base font-bold outline-none focus:border-brand-500 disabled:opacity-60"
              >
                {loadingGames ? (
                  <option>Loading top games…</option>
                ) : topGames.map((game) => (
                  <option key={game.name} value={game.name}>
                    {game.name} — {game.time}
                  </option>
                ))}
              </select>

              <label className="mt-5 mb-2 block text-sm font-black text-slate-700">Result</label>
              <input
                inputMode="numeric"
                aria-label="Selected game result"
                placeholder="Enter 00–99"
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="h-16 w-full rounded-2xl border-2 border-slate-300 px-4 text-center font-mono text-3xl font-black outline-none focus:border-brand-500"
              />

              <button
                onClick={handleSaveGame}
                disabled={loadingGames || !selectedGameName || savingGame === selectedGameName}
                className="mt-5 h-14 w-full rounded-2xl bg-violet-700 px-5 text-base font-black text-white shadow-lg shadow-violet-700/20 disabled:opacity-60 active:scale-[0.98]"
              >
                {savingGame === selectedGameName ? "Saving result…" : "Save result"}
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">Add blog post</h2>
              <p className="mt-1 text-sm text-slate-500">Publish a new article with its search metadata.</p>
            </div>

            <label className="mb-2 block text-sm font-black text-slate-700">Title</label>
            <input
              value={blogForm.title}
              onChange={(e) => handleBlogTitle(e.target.value)}
              placeholder="Public blog title"
              className="mb-4 h-13 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500"
            />

            <label className="mb-2 block text-sm font-black text-slate-700">Slug</label>
            <div className="mb-4 flex items-center rounded-2xl border border-slate-300 bg-slate-50 px-4 focus-within:border-brand-500">
              <span className="shrink-0 text-sm font-bold text-slate-400">/blog/</span>
              <input
                value={blogForm.slug}
                onChange={(e) => setBlogField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="blog-post-slug"
                className="h-13 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
              />
            </div>

            <label className="mb-2 block text-sm font-black text-slate-700">Meta title</label>
            <input
              value={blogForm.metaTitle}
              onChange={(e) => setBlogField("metaTitle", e.target.value)}
              placeholder="SEO title shown in search results"
              maxLength={70}
              className="mb-1 h-13 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500"
            />
            <p className="mb-4 text-right text-xs font-semibold text-slate-400">{blogForm.metaTitle.length}/70</p>

            <label className="mb-2 block text-sm font-black text-slate-700">Meta description</label>
            <textarea
              value={blogForm.metaDescription}
              onChange={(e) => setBlogField("metaDescription", e.target.value)}
              placeholder="Short description for Google and the blog listing"
              maxLength={170}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 p-4 text-base outline-none focus:border-brand-500"
            />
            <p className="mb-4 text-right text-xs font-semibold text-slate-400">{blogForm.metaDescription.length}/170</p>

            <label className="mb-2 block text-sm font-black text-slate-700">Featured image</label>
            <label className="mb-4 flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 text-center text-sm font-black text-brand-700">
              {uploadingImage ? "Uploading image…" : blogForm.image ? "Replace image" : "Choose image (max 5 MB)"}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                onChange={(e) => e.target.files?.[0] && uploadBlogImage(e.target.files[0])}
                className="hidden"
              />
            </label>
            {blogForm.image && (
              <div className="relative mb-4">
                <img src={blogForm.image} alt="Blog preview" className="aspect-video w-full rounded-2xl border border-slate-200 object-cover" />
                <button onClick={() => setBlogField("image", "")} className="absolute right-2 top-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black text-white">Remove</button>
              </div>
            )}

            <label className="mb-2 block text-sm font-black text-slate-700">Content</label>
            <div className="max-h-[32rem] overflow-y-auto rounded-2xl border-2 border-slate-300 bg-white focus-within:border-brand-500">
              <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50/95 p-2 shadow-sm backdrop-blur">
                {[
                  { command: "bold", label: "B", state: "bold" },
                  { command: "italic", label: "I", state: "italic" },
                  { command: "underline", label: "U", state: "underline" },
                  { command: "formatBlock", label: "H2", value: "h2", state: "h2" },
                  { command: "formatBlock", label: "H3", value: "h3", state: "h3" },
                  { command: "insertUnorderedList", label: "• List", state: "unordered" },
                  { command: "insertOrderedList", label: "1. List", state: "ordered" },
                  { command: "formatBlock", label: "Quote", value: "blockquote", state: "quote" },
                ].map(({ command, label, value, state }) => (
                  <button
                    key={`${command}-${label}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatBlogContent(command, value)}
                    aria-pressed={Boolean(activeEditorFormats[state])}
                    className={`min-h-9 rounded-lg border px-3 text-xs font-black transition ${
                      activeEditorFormats[state]
                        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const url = window.prompt("Enter link URL");
                    if (url) formatBlogContent("createLink", url);
                  }}
                  aria-pressed={Boolean(activeEditorFormats.link)}
                  className={`min-h-9 rounded-lg border px-3 text-xs font-black transition ${
                    activeEditorFormats.link
                      ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  Link
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  setBlogField("content", e.currentTarget.innerHTML);
                  updateEditorFormats();
                }}
                onKeyUp={updateEditorFormats}
                onMouseUp={updateEditorFormats}
                data-placeholder="Write the full blog content…"
                className="min-h-80 p-4 text-base leading-relaxed text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_h2]:my-3 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:my-2 [&_h3]:text-xl [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
              />
            </div>

            <button
              onClick={handleSaveBlog}
              disabled={savingBlog}
              className="mt-5 h-14 w-full rounded-2xl bg-violet-700 text-base font-black text-white shadow-lg shadow-violet-700/20 disabled:opacity-60 active:scale-[0.98]"
            >
              {savingBlog ? "Saving…" : originalBlogSlug ? "Update blog" : "Publish blog"}
            </button>

            {originalBlogSlug && (
              <button
                onClick={() => {
                  setOriginalBlogSlug("");
                  setBlogForm({ title: "", metaTitle: "", metaDescription: "", content: "", slug: "", image: "" });
                  if (editorRef.current) editorRef.current.innerHTML = "";
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 font-black text-slate-700"
              >
                Cancel editing
              </button>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-black text-slate-950">Published blogs</h3>
              <div className="mt-3 space-y-3">
                {adminBlogs.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No admin blogs published yet.</p>
                ) : adminBlogs.map((post) => (
                  <article key={post.slug} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-black text-slate-950">{post.title}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">/blog/{post.slug}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => editBlog(post)} className="h-11 rounded-xl bg-brand-100 font-black text-brand-800">Edit</button>
                      <button onClick={() => deleteBlog(post)} className="h-11 rounded-xl bg-red-50 font-black text-red-700">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
