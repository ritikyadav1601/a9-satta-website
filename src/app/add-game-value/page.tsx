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

import { useState, useEffect, useCallback, useMemo } from "react";

const CUSTOM_GAMES = [
  { key: "kohlapur", label: "कोहलापुर (Kohlapur)", time: "1:30 PM" },
  { key: "manipur", label: "मणिपुर (Manipur)", time: "2:30 PM" },
  { key: "up-bazar", label: "UP बाज़ार (UP Bazar)", time: "3:30 PM" },
  { key: "palwal-city", label: "पलवल City (Palwal City)", time: "4:30 PM" },
  { key: "mathura-city", label: "मथूरा City (Mathura City)", time: "6:50 PM" },
];

const ADMIN_EMAIL = "kapil123@gmail.com";
const ADMIN_PASSWORD = "Kapil@1997";

function gameMeta(key: string) {
  return CUSTOM_GAMES.find((g) => g.key === key);
}

type Entry = {
  date: string;
  game: string;
  value: string;
  khaiwalName?: string;
  whatsapp?: string;
};

export default function AddGameValuePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Default to today's IST date (same key the homepage reads).
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );

  const [values, setValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});

  // ✅ NEW FIELDS (KHAIWAL)
  const [khaiwalName, setKhaiwalName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savedKhaiwal, setSavedKhaiwal] = useState<{
    name: string;
    whatsapp: string;
  } | null>(null);
  const [savingKhaiwal, setSavingKhaiwal] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);

  const fetchValues = useCallback(async () => {
    try {
      const res = await fetch(`/api/custom-games?date=${date}`);
      const data = await res.json();

      if (data.success) {
        setValues(data.games || {});
        setKhaiwalName(data.khaiwal?.name || "");
        setWhatsapp(data.khaiwal?.whatsapp || "");
        setSavedKhaiwal(data.khaiwal || null);
      }
    } catch {}
  }, [date]);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/custom-games?list=1&all=1`);
      const data = await res.json();
      if (data.success) setEntries(data.entries || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchValues();
  }, [isLoggedIn, fetchValues]);

  useEffect(() => {
    if (isLoggedIn) fetchEntries();
  }, [isLoggedIn, fetchEntries]);

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid login");
    }
  };

  const handleSave = async () => {
    const games: Record<string, string> = {};

    CUSTOM_GAMES.forEach((g) => {
      if (values[g.key]) games[g.key] = values[g.key];
    });

    try {
      const res = await fetch("/api/custom-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          date,
          games,

          // ✅ NEW FIELDS
          khaiwalName,
          whatsapp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Saved Successfully!");
        fetchEntries();
      } else {
        alert("Error saving");
      }
    } catch {
      alert("Network error");
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
      const res = await fetch("/api/custom-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          date,
          khaiwalName: khaiwalName.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedKhaiwal(data.khaiwal || null);
        alert("Khaiwal Details Saved!");
      } else {
        alert("Error saving Khaiwal");
      }
    } catch {
      alert("Network error");
    } finally {
      setSavingKhaiwal(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-2xl shadow w-80">
          <input
            placeholder="Email"
            className="border p-2 w-full mb-3"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            className="border p-2 w-full mb-3"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-brand-100 text-slate-900 font-bold w-full py-2 rounded-xl"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* ===== DATE ===== */}
        <div className="mb-5">
          <label className="font-bold">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 w-full rounded-xl mt-2"
          />
        </div>

        {/* ===== KHAIWAL SECTION (SAME DESIGN THEME) ===== */}
        <div className="mb-6 border border-gray-200 rounded-2xl p-5 bg-gray-50">
          <h2 className="font-black text-lg mb-3">👤 Khaiwal Details</h2>

          <input
            placeholder="Khaiwal Name"
            value={khaiwalName}
            onChange={(e) => setKhaiwalName(e.target.value)}
            className="border p-2 w-full mb-3 rounded-xl"
          />

          <input
            placeholder="WhatsApp Number"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="border p-2 w-full rounded-xl"
            maxLength={10}
          />

          {/* ✅ SEPARATE SAVE BUTTON FOR KHAIWAL */}
          <button
            onClick={handleSaveKhaiwal}
            disabled={savingKhaiwal}
            className="bg-green-600 disabled:opacity-60 text-white w-full py-2.5 rounded-xl mt-3 font-semibold"
          >
            {savingKhaiwal ? "Saving..." : "💾 Save Khaiwal Details"}
          </button>

          {/* ✅ SHOW CURRENTLY SAVED KHAIWAL VALUE */}
          {savedKhaiwal && (savedKhaiwal.name || savedKhaiwal.whatsapp) && (
            <div className="mt-3 bg-white border border-green-200 rounded-xl p-3 text-sm">
              <p className="font-bold text-green-700 mb-1">Saved Khaiwal</p>
              <p>👤 {savedKhaiwal.name || "-"}</p>
              <p>📱 {savedKhaiwal.whatsapp || "-"}</p>
            </div>
          )}
        </div>

        {/* ===== GAME INPUTS ===== */}
        {CUSTOM_GAMES.map((g) => (
          <div key={g.key} className="mb-3">
            <label className="font-semibold">{g.label}</label>
            <input
              value={values[g.key] || ""}
              onChange={(e) =>
                setValues({ ...values, [g.key]: e.target.value })
              }
              className="border p-2 w-full rounded-xl mt-1"
            />
          </div>
        ))}

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          className="bg-brand-100 text-slate-900 font-bold w-full py-3 rounded-xl mt-4"
        >
          Save Result
        </button>

        {/* ===== LIST ===== */}
        <div className="mt-8">
          <h2 className="font-bold text-lg mb-3">Results</h2>

          {entries.map((e, i) => (
            <div
              key={i}
              className="border p-3 rounded-xl mb-2 bg-gray-50"
            >
              <p className="font-bold">{e.date}</p>
              <p>
                {e.game} → {e.value}
              </p>

              <p className="text-sm text-gray-600">
                👤 {e.khaiwalName || "-"} | 📱 {e.whatsapp || "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
