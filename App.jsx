import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Snail, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  History, 
  BookOpen, 
  User, 
  ChevronDown, 
  Trash2, 
  Check, 
  Settings, 
  ArrowRight,
  RefreshCw,
  Search,
  Key
} from 'lucide-react';

// Default Profiles
const DEFAULT_USERS = ['Marc', 'Laura', 'Pau', 'Anna', 'Pol'];

// Pre-defined Phrase of the Day collection
const DAILY_PHRASES = [
  {
    english: "Long time no see!",
    catalan: "Fa molt de temps que no ens veiem!",
    register: "Molt col·loquial",
    pronunciation: "long taim no sii",
    context: "Conversa informal"
  },
  {
    english: "Hit the spot!",
    catalan: "Ha caigut de coa de fons! / Què bé que m'ha segut!",
    register: "Informal",
    pronunciation: "hit d'e spot",
    context: "Conversa informal"
  },
  {
    english: "Let's call it a day.",
    catalan: "Ho deixem estar per avui.",
    register: "Feina / Informal",
    pronunciation: "lets col it e dei",
    context: "Feina"
  },
  {
    english: "Safe travels!",
    catalan: "Bon viatge!",
    register: "Càlid i amigable",
    pronunciation: "seif trèvels",
    context: "Viatge"
  }
];

export default function App() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState('tradueix'); // 'tradueix', 'preferits', 'historial', 'practica'
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('apn_active_user') || 'Marc';
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [customUser, setCustomUser] = useState('');

  // Form State
  const [inputText, setInputText] = useState('');
  const [selectedContext, setSelectedContext] = useState('Conversa informal');
  const [selectedAccent, setSelectedAccent] = useState('GB Britànic');

  // Translation Results State
  const [loading, setLoading] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState(null);
  const [apiError, setApiError] = useState('');

  // User Isolated Data
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Flashcards Game State
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Phrase of the day state
  const [dailyPhrase] = useState(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return DAILY_PHRASES[dayOfYear % DAILY_PHRASES.length];
  });

  // Load user data on profile change
  useEffect(() => {
    localStorage.setItem('apn_active_user', currentUser);
    
    const userHistoryKey = `apn_history_${currentUser}`;
    const userFavoritesKey = `apn_favorites_${currentUser}`;
    
    try {
      const savedHistory = JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
      const savedFavorites = JSON.parse(localStorage.getItem(userFavoritesKey) || '[]');
      setHistory(savedHistory);
      setFavorites(savedFavorites);
    } catch (e) {
      console.error("Error loading user data", e);
      setHistory([]);
      setFavorites([]);
    }
  }, [currentUser]);

  // Save history to localStorage
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem(`apn_history_${currentUser}`, JSON.stringify(newHistory));
  };

  // Save favorites to localStorage
  const saveFavorites = (newFavs) => {
    setFavorites(newFavs);
    localStorage.setItem(`apn_favorites_${currentUser}`, JSON.stringify(newFavs));
  };

  // Save API Key
  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowApiKeyModal(false);
  };

  // Speech Synthesis Helper
  const speak = (text, slow = false, isUS = false) => {
    if (!('speechSynthesis' in window)) {
      alert("El teu navegador no suporta la reproducció de veu.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = slow ? 0.6 : 0.95;
    
    // Choose appropriate accent accent
    const lang = isUS || selectedAccent === 'US Americà' ? 'en-US' : 'en-GB';
    utterance.lang = lang;

    // Try finding exact matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  // Execute Translation via Gemini API
  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setApiError('');
    setCurrentTranslation(null);

    const promptText = `Tradueix aquesta frase del català a l'anglès amb una expressió natural per al context: ${selectedContext} i variant: ${selectedAccent}. Explica breument les alternatives, el registre i la pronunciació aproximada. Frase: "${inputText.trim()}"`;

    const systemInstruction = `Ets un tutor d'anglès expert en frases fetes i expressions naturals.
Respon ÚNICAMENT en un objecte JSON rigorós amb el següent format sense codi markdown addicional:
{
  "englishMain": "Traducció principal més natural",
  "pronunciation": "Pronunciació aproximada adaptada a un catalanoparlant (ex: long taim no sii)",
  "register": "Breu explicació del registre (ex: Informal, Apte per feina, Col·loquial, etc.)",
  "explanation": "Explicació breu de per què s'utilitza aquesta frase.",
  "alternatives": [
    {"phrase": "Opció alternativa 1", "note": "Subtil diferència o context"},
    {"phrase": "Opció alternativa 2", "note": "Altra variant"}
  ]
}`;

    try {
      let resultData = null;

      // Check if user has an API Key or environment key available
      const keyToUse = apiKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '');

      if (keyToUse) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${keyToUse}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) {
          throw new Error(`Error en la resposta de l'API (${response.status})`);
        }

        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          resultData = JSON.parse(jsonText);
        }
      }

      // Fallback realistic AI generator if API key is not configured or fails
      if (!resultData) {
        // Simulated smart responses for quick usage without key
        await new Promise(r => setTimeout(r, 1200)); // Smooth loading simulation
        
        resultData = generateFallbackResponse(inputText.trim(), selectedContext, selectedAccent);
      }

      const newEntry = {
        id: Date.now().toString(),
        catalanOriginal: inputText.trim(),
        context: selectedContext,
        accent: selectedAccent,
        timestamp: new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        ...resultData
      };

      setCurrentTranslation(newEntry);

      // Add to user history (limit to 50 items)
      const updatedHistory = [newEntry, ...history.filter(h => h.catalanOriginal !== newEntry.catalanOriginal)].slice(0, 50);
      saveHistory(updatedHistory);

    } catch (err) {
      console.error(err);
      setApiError("No s'ha pogut realitzar la traducció. Revisa la connexió o la clau API.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Favorite Status
  const toggleFavorite = (item) => {
    const exists = favorites.some(f => f.id === item.id || f.catalanOriginal === item.catalanOriginal);
    let updated;
    if (exists) {
      updated = favorites.filter(f => f.id !== item.id && f.catalanOriginal !== item.catalanOriginal);
    } else {
      updated = [item, ...favorites];
    }
    saveFavorites(updated);
  };

  const isFavorite = (item) => {
    if (!item) return false;
    return favorites.some(f => f.id === item.id || f.catalanOriginal === item.catalanOriginal);
  };

  // Helper mock translator for seamless testing when API key is unset
  const generateFallbackResponse = (text, context, accent) => {
    const isUS = accent === 'US Americà';
    const textLower = text.toLowerCase();

    if (textLower.includes('sap greu') || textLower.includes('sento')) {
      return {
        englishMain: isUS ? "I'm really sorry, but I won't make it today." : "I'm so sorry, but I won't be able to come today.",
        pronunciation: "aim so so-ri, bat aim wount bi eibl tu cam tu-dei",
        register: context === 'Feina' ? "Formal i educat" : "Informal i natural",
        explanation: "En anglès natural no se sol dir 'it grieves me', sinón 'I won't make it' (no arribaré) o 'I won't be able to come'.",
        alternatives: [
          { phrase: "Something came up, so I can't come today.", note: "Per a quan ha sorgit un imprevist" },
          { phrase: "I can't make it today, unfortunately.", note: "Molt habitual entre amics" }
        ]
      };
    }

    if (textLower.includes('hola') || textLower.includes('com va')) {
      return {
        englishMain: isUS ? "Hey! How's it going?" : "Hi there! How are you getting on?",
        pronunciation: "hei! haus it gou-ing?",
        register: "Informal de carrer",
        explanation: "És la forma quotidiana de saludar en comptes del 'How are you?' de llibre de text.",
        alternatives: [
          { phrase: isUS ? "What's up?" : "Alright, mate?", note: "Molt col·loquial entre coneguts" },
          { phrase: "How have you been?", note: "Quan fa dies que no us veieu" }
        ]
      };
    }

    // Generic fallback for any other sentence
    return {
      englishMain: `Here's how a native would say it (${context.toLowerCase()}): "${text.split(' ')[0]}..."`,
      pronunciation: "pron-un-si-ei-shon na-tu-ral",
      register: `${context} — Expressió fluïda`,
      explanation: `Estructura adaptada per sonar natural en un entorn de ${context.toLowerCase()} amb variant ${accent}.`,
      alternatives: [
        { phrase: "Alternative option with a subtle nuance", note: "Més directe" },
        { phrase: "Another common idiom used in conversation", note: "Més distès" }
      ]
    };
  };

  // Clear user history
  const handleClearHistory = () => {
    if (window.confirm(`Vols esborrar tot l'historial de ${currentUser}?`)) {
      saveHistory([]);
    }
  };

  // Practice Flashcards source
  const practiceList = favorites.length > 0 ? favorites : (history.length > 0 ? history : DAILY_PHRASES.map(p => ({
    catalanOriginal: p.catalan,
    englishMain: p.english,
    register: p.register,
    pronunciation: p.pronunciation,
    id: p.english
  })));

  const currentFlashcard = practiceList[flashcardIndex % practiceList.length];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C] font-sans flex flex-col items-center pb-12">
      {/* HEADER NAVBAR */}
      <header className="w-full max-w-5xl px-4 py-4 md:py-6 flex flex-wrap items-center justify-between border-b border-[#E8E1D5]/60 mb-6 bg-[#FAF7F2]/90 backdrop-blur sticky top-0 z-30">
        
        {/* LOGO & TITLE */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tradueix')}>
          <div className="w-10 h-10 rounded-full bg-[#E06D3B] text-white flex items-center justify-center font-bold text-xl shadow-sm">
            A
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight text-[#2C2C2C]">Anglès</span>
            <span className="text-xl font-bold text-[#E06D3B]">· Parla Natural</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex items-center gap-1 md:gap-6 my-2 md:my-0 text-sm font-medium text-[#666]">
          <button 
            onClick={() => setActiveTab('tradueix')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'tradueix' ? 'text-[#2C2C2C] font-bold bg-[#E8E1D5]/50' : 'hover:text-[#2C2C2C]'}`}
          >
            Tradueix
          </button>
          <button 
            onClick={() => setActiveTab('preferits')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'preferits' ? 'text-[#2C2C2C] font-bold bg-[#E8E1D5]/50' : 'hover:text-[#2C2C2C]'}`}
          >
            Preferits
            {favorites.length > 0 && (
              <span className="ml-1 bg-[#E06D3B] text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
                {favorites.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'historial' ? 'text-[#2C2C2C] font-bold bg-[#E8E1D5]/50' : 'hover:text-[#2C2C2C]'}`}
          >
            Historial
          </button>
          <button 
            onClick={() => setActiveTab('practica')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'practica' ? 'text-[#2C2C2C] font-bold bg-[#E8E1D5]/50' : 'hover:text-[#2C2C2C]'}`}
          >
            Practica
          </button>
        </nav>

        {/* USER PROFILE SELECTOR */}
        <div className="relative flex items-center gap-2">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-[#EFE8DC] hover:bg-[#E5DDCF] border border-[#DDD4C5] text-[#2C2C2C] px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all shadow-sm"
          >
            <div className="w-5 h-5 rounded-full bg-[#0D4746] text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <span>{currentUser}</span>
            <ChevronDown size={14} className="text-[#666]" />
          </button>

          {/* User Selector Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-xl border border-[#E8E1D5] py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#888] uppercase tracking-wider border-b border-gray-100">
                Canvia d'usuari
              </div>
              {DEFAULT_USERS.map((user) => (
                <button
                  key={user}
                  onClick={() => {
                    setCurrentUser(user);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[#FAF7F2] ${currentUser === user ? 'font-bold text-[#E06D3B]' : 'text-[#444]'}`}
                >
                  <span>{user}</span>
                  {currentUser === user && <Check size={14} className="text-[#E06D3B]" />}
                </button>
              ))}

              {/* Custom User Option */}
              <div className="p-2 border-t border-gray-100">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (customUser.trim()) {
                    setCurrentUser(customUser.trim());
                    setCustomUser('');
                    setShowUserMenu(false);
                  }
                }} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nou perfil..."
                    value={customUser}
                    onChange={(e) => setCustomUser(e.target.value)}
                    className="w-full text-xs px-2 py-1 border rounded focus:outline-none focus:border-[#E06D3B]"
                  />
                  <button type="submit" className="bg-[#0D4746] text-white text-xs px-2 py-1 rounded">
                    +
                  </button>
                </form>
              </div>

              {/* API Key Modal Toggle Button */}
              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowApiKeyModal(true);
                  }}
                  className="w-full text-left px-4 py-1.5 text-xs text-[#666] hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Key size={12} />
                  <span>Clau API Gemini</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-3xl px-4 flex-1">

        {/* TAB 1: TRADUEIX (MAIN SCREEN) */}
        {activeTab === 'tradueix' && (
          <div className="space-y-6">
            
            {/* HERO TITLE */}
            <div className="text-left mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2C2C] tracking-tight">
                Digues-ho <span className="text-[#E06D3B]">com un nadiu.</span>
              </h1>
              <p className="text-[#666] text-sm md:text-base mt-1.5">
                Escriu en català i t'ensenyem com ho diria algú de debò.
              </p>
            </div>

            {/* MAIN FORM CARD */}
            <div className="bg-white rounded-3xl p-5 md:p-7 shadow-sm border border-[#E8E1D5]/80 space-y-5">
              
              {/* INPUT AREA */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Per exemple: Em sap greu, però avui no podré venir."
                  className="w-full h-36 p-4 md:p-5 rounded-2xl bg-[#F0EAE1] text-[#2C2C2C] placeholder-[#8C8479] text-base md:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#E06D3B]/40 transition-all border border-transparent font-medium"
                />
                {inputText && (
                  <button 
                    onClick={() => setInputText('')}
                    className="absolute top-3 right-3 text-xs text-[#8C8479] hover:text-[#2C2C2C] bg-white/60 rounded-full px-2 py-0.5"
                  >
                    Neteja
                  </button>
                )}
              </div>

              {/* OPTIONS ROW */}
              <div className="space-y-4">
                {/* CONTEXT CHIPS */}
                <div>
                  <span className="text-[11px] font-extrabold tracking-wider text-[#777] uppercase block mb-2">
                    CONTEXT
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['Conversa informal', 'Feina', 'Viatge', 'Presentació'].map((ctx) => (
                      <button
                        key={ctx}
                        onClick={() => setSelectedContext(ctx)}
                        className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                          selectedContext === ctx
                            ? 'bg-[#0D4746] text-white shadow-sm'
                            : 'bg-white border border-[#DDD5C7] text-[#444] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        {ctx}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACCENT CHIPS & SUBMIT BUTTON */}
                <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
                  <div>
                    <span className="text-[11px] font-extrabold tracking-wider text-[#777] uppercase block mb-2">
                      ANGLÈS
                    </span>
                    <div className="flex gap-2">
                      {[
                        { label: 'GB Britànic', code: 'GB' },
                        { label: 'US Americà', code: 'US' }
                      ].map((acc) => (
                        <button
                          key={acc.label}
                          onClick={() => setSelectedAccent(acc.label)}
                          className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                            selectedAccent === acc.label
                              ? 'bg-[#0D4746] text-white shadow-sm'
                              : 'bg-white border border-[#DDD5C7] text-[#444] hover:bg-[#F5EFE6]'
                          }`}
                        >
                          <span className="font-extrabold text-[11px] opacity-80">{acc.code}</span>
                          <span>{acc.label.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    onClick={handleTranslate}
                    disabled={loading || !inputText.trim()}
                    className="w-full sm:w-auto bg-[#E06D3B] hover:bg-[#D15C2A] disabled:opacity-50 text-white font-bold px-7 py-3 rounded-full text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-98"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Traduint...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Tradueix</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ERROR NOTICE */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm">
                {apiError}
              </div>
            )}

            {/* TRANSLATION RESULT CARD */}
            {currentTranslation && (
              <div className="bg-white rounded-3xl p-6 md:p-7 shadow-md border border-[#E06D3B]/30 relative animate-fadeIn space-y-5">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0D4746] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                      {currentTranslation.context}
                    </span>
                    <span className="text-xs text-[#777] font-medium">
                      {currentTranslation.accent}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(currentTranslation)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#E06D3B] transition-colors bg-[#F7F3EC] px-3 py-1.5 rounded-full"
                  >
                    {isFavorite(currentTranslation) ? (
                      <>
                        <BookmarkCheck size={16} className="text-[#E06D3B] fill-[#E06D3B]" />
                        <span className="text-[#E06D3B]">Desat</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={16} />
                        <span>Desa a preferits</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Main Native Translation */}
                <div>
                  <span className="text-xs font-bold text-[#E06D3B] uppercase tracking-wider block mb-1">
                    Traducció natural
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-[#2C2C2C] leading-tight">
                    {currentTranslation.englishMain}
                  </h2>
                  <p className="text-xs text-[#888] italic mt-1">
                    "{currentTranslation.catalanOriginal}"
                  </p>
                </div>

                {/* Audio Controls & Pronunciation */}
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D5] flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">
                      Pronunciació aproximada
                    </span>
                    <p className="text-sm font-semibold text-[#0D4746] italic">
                      🗣️ "{currentTranslation.pronunciation}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speak(currentTranslation.englishMain, false)}
                      className="bg-white hover:bg-[#EFE8DC] border border-[#DDD5C7] text-[#2C2C2C] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Volume2 size={15} className="text-[#E06D3B]" />
                      <span>Escolta</span>
                    </button>
                    <button
                      onClick={() => speak(currentTranslation.englishMain, true)}
                      className="bg-white hover:bg-[#EFE8DC] border border-[#DDD5C7] text-[#2C2C2C] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Snail size={15} className="text-[#0D4746]" />
                      <span>A poc a poc</span>
                    </button>
                  </div>
                </div>

                {/* Explanation & Register */}
                {currentTranslation.explanation && (
                  <div className="text-xs md:text-sm text-[#444] bg-[#F7F4EF] p-3.5 rounded-xl border-l-4 border-[#0D4746]">
                    <strong className="text-[#2C2C2C]">Registre ({currentTranslation.register}):</strong> {currentTranslation.explanation}
                  </div>
                )}

                {/* Alternatives */}
                {currentTranslation.alternatives && currentTranslation.alternatives.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#777]">
                      Alternatives naturals
                    </span>
                    <div className="grid gap-2">
                      {currentTranslation.alternatives.map((alt, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E1D5]">
                          <div>
                            <span className="font-bold text-sm text-[#2C2C2C] block">
                              {alt.phrase}
                            </span>
                            <span className="text-xs text-[#777]">{alt.note}</span>
                          </div>
                          <button
                            onClick={() => speak(alt.phrase, false)}
                            className="text-[#888] hover:text-[#E06D3B] p-1.5 rounded-full hover:bg-white transition-colors"
                            title="Escolta"
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* FRASE DEL DIA CARD (MATCHING EXACT IMAGE DESIGN) */}
            <div className="bg-[#F6E8C3] rounded-3xl p-6 md:p-7 border border-[#E8D49E] shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#7A5B10] uppercase tracking-wider mb-2">
                <span className="text-base">☀️</span>
                <span>FRASE DEL DIA</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-[#2C2C2C] tracking-tight mb-1">
                {dailyPhrase.english}
              </h3>

              <p className="text-sm md:text-base text-[#4A3B18] font-medium mb-5">
                {dailyPhrase.catalan} — <span className="italic">{dailyPhrase.register}</span>
              </p>

              {/* AUDIO BUTTONS */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => speak(dailyPhrase.english, false)}
                  className="bg-white hover:bg-white/90 text-[#2C2C2C] font-bold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Volume2 size={16} className="text-[#2C2C2C]" />
                  <span>Escolta</span>
                </button>

                <button
                  onClick={() => speak(dailyPhrase.english, true)}
                  className="bg-white hover:bg-white/90 text-[#2C2C2C] font-bold px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Snail size={16} className="text-[#2C2C2C]" />
                  <span>A poc a poc</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PREFERITS */}
        {activeTab === 'preferits' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]">Les teves frases preferides</h2>
                <p className="text-xs text-[#666]">Guardades per a l'usuari <strong className="text-[#E06D3B]">{currentUser}</strong></p>
              </div>
              <span className="text-xs bg-[#0D4746] text-white px-3 py-1 rounded-full font-bold">
                {favorites.length} guardades
              </span>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E1D5]">
                <Bookmark className="mx-auto text-[#CCC] mb-3" size={40} />
                <p className="text-[#666] text-sm font-medium">Encara no has guardat cap frase als teus preferits.</p>
                <p className="text-xs text-[#888] mt-1">Quan tradueixis una frase, prem la icona de la icona de la secció per desar-la aquí.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="bg-white rounded-2xl p-5 border border-[#E8E1D5] shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#0D4746] bg-[#0D4746]/10 px-2 py-0.5 rounded">
                          {fav.context}
                        </span>
                        <h3 className="text-xl font-bold text-[#2C2C2C] mt-2">{fav.englishMain}</h3>
                        <p className="text-xs text-[#666] italic mt-0.5">"{fav.catalanOriginal}"</p>
                        {fav.pronunciation && (
                          <p className="text-xs font-semibold text-[#E06D3B] mt-2">🗣️ {fav.pronunciation}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => speak(fav.englishMain, false)}
                          className="p-2 hover:bg-[#FAF7F2] rounded-full text-[#666] hover:text-[#E06D3B]"
                          title="Escolta"
                        >
                          <Volume2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleFavorite(fav)}
                          className="p-2 hover:bg-red-50 rounded-full text-red-500"
                          title="Elimina de preferits"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]">Historial de cerques</h2>
                <p className="text-xs text-[#666]">Consultes recents de <strong className="text-[#E06D3B]">{currentUser}</strong></p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Esborra l'historial
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E1D5]">
                <History className="mx-auto text-[#CCC] mb-3" size={40} />
                <p className="text-[#666] text-sm font-medium">L'historial d'aquest perfil està buit.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {history.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#E8E1D5] flex items-center justify-between hover:border-[#E06D3B]/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#888]">{item.timestamp}</span>
                        <span className="text-[10px] bg-[#EFE8DC] font-semibold px-2 py-0.2 rounded text-[#444]">{item.context}</span>
                      </div>
                      <p className="text-xs text-[#777]">Català: "{item.catalanOriginal}"</p>
                      <p className="text-base font-bold text-[#2C2C2C]">{item.englishMain}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speak(item.englishMain, false)}
                        className="p-2 hover:bg-[#FAF7F2] rounded-full text-[#0D4746]"
                        title="Escolta"
                      >
                        <Volume2 size={18} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(item)}
                        className={`p-2 rounded-full ${isFavorite(item) ? 'text-[#E06D3B]' : 'text-[#BBB] hover:text-[#E06D3B]'}`}
                      >
                        <Bookmark size={18} className={isFavorite(item) ? 'fill-[#E06D3B]' : ''} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRACTICA (FLASHCARDS) */}
        {activeTab === 'practica' && (
          <div className="space-y-6 animate-fadeIn text-center">
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C]">Targetes de Repàs</h2>
              <p className="text-xs text-[#666]">Posa a prova la teva memòria amb les frases del teu historial/preferits</p>
            </div>

            {practiceList.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E1D5]">
                <BookOpen className="mx-auto text-[#CCC] mb-3" size={40} />
                <p className="text-[#666] text-sm font-medium">No hi ha prou frases per practicar.</p>
                <p className="text-xs text-[#888] mt-1">Fes algunes traduccions o desat preferits primer.</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                
                {/* FLASHCARD CARD */}
                <div 
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="bg-white rounded-3xl p-8 border-2 border-[#E8E1D5] shadow-lg min-h-[260px] flex flex-col justify-between items-center cursor-pointer hover:border-[#E06D3B] transition-all transform active:scale-98 relative"
                >
                  <span className="text-[11px] font-extrabold uppercase text-[#0D4746] bg-[#0D4746]/10 px-3 py-1 rounded-full">
                    Targeta {(flashcardIndex % practiceList.length) + 1} / {practiceList.length}
                  </span>

                  <div className="my-auto py-4">
                    {!showAnswer ? (
                      <div>
                        <span className="text-xs font-bold text-[#888] uppercase block mb-2">Com ho diries en anglès?</span>
                        <h3 className="text-2xl font-black text-[#2C2C2C]">
                          "{currentFlashcard.catalanOriginal}"
                        </h3>
                        <p className="text-xs text-[#E06D3B] font-semibold mt-3">Prem per veure la traducció 🔄</p>
                      </div>
                    ) : (
                      <div className="animate-fadeIn">
                        <span className="text-xs font-bold text-[#E06D3B] uppercase block mb-1">Anglès natural</span>
                        <h3 className="text-2xl font-black text-[#0D4746]">
                          {currentFlashcard.englishMain}
                        </h3>
                        {currentFlashcard.pronunciation && (
                          <p className="text-xs text-[#666] font-semibold mt-2">
                            🗣️ {currentFlashcard.pronunciation}
                          </p>
                        )}
                        <div className="mt-4 flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(currentFlashcard.englishMain, false);
                            }}
                            className="bg-[#E06D3B] text-white p-2.5 rounded-full shadow-sm hover:bg-[#D15C2A]"
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-[#A0988C]">Context: {currentFlashcard.context || 'General'}</span>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowAnswer(false);
                      setFlashcardIndex((prev) => (prev > 0 ? prev - 1 : practiceList.length - 1));
                    }}
                    className="flex-1 bg-white border border-[#DDD5C7] text-[#2C2C2C] py-2.5 rounded-full font-bold text-sm hover:bg-[#FAF7F2]"
                  >
                    Anterior
                  </button>

                  <button
                    onClick={() => {
                      setShowAnswer(false);
                      setFlashcardIndex((prev) => prev + 1);
                    }}
                    className="flex-1 bg-[#0D4746] text-white py-2.5 rounded-full font-bold text-sm hover:bg-[#0A3837] shadow-sm"
                  >
                    Següent
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* GEMINI API KEY MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E8E1D5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-[#2C2C2C] flex items-center gap-2">
                <Key size={18} className="text-[#E06D3B]" /> Clau API de Gemini
              </h3>
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#666] leading-relaxed">
              Per defecte, l'aplicació ofereix respostes simulades de franc. Si vols traduccions reals il·limitades, pots afegir la teva pròpia clau gratuïta de Google Gemini AI.
            </p>

            <div>
              <label className="text-xs font-bold text-[#444] block mb-1">Clau API (Gemini):</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:border-[#E06D3B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleSaveApiKey('')}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Esborra clau
              </button>
              <button
                onClick={() => handleSaveApiKey(apiKey)}
                className="bg-[#E06D3B] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#D15C2A]"
              >
                Desa la clau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-12 text-center text-xs text-[#A0988C]">
        Anglès · Parla Natural • Dissenyat per a ús personal i grups reduïts (Cost 0€)
      </footer>
    </div>
  );
}
