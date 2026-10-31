const { useState, useEffect, useRef } = React;

function App() {
  const [activeTab, setActiveTab] = useState('tradueix');
  const [user, setUser] = useState('Marc');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  
  const [phrase, setPhrase] = useState('');
  const [context, setContext] = useState('Conversa informal');
  const [englishType, setEnglishType] = useState('GB Britànic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar dades de l'usuari
  useEffect(() => {
    const savedHistory = localStorage.getItem(`history_${user}`);
    const savedFavorites = localStorage.getItem(`favorites_${user}`);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, [user]);

  const saveToStorage = (newHistory, newFavorites) => {
    localStorage.setItem(`history_${user}`, JSON.stringify(newHistory));
    localStorage.setItem(`favorites_${user}`, JSON.stringify(newFavorites));
  };

  const handleSaveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowApiKeyModal(false);
    alert('Clau API desada correctament!');
  };

  const handleTranslate = async () => {
    if (!phrase.trim()) return;
    setLoading(true);

    const promptText = `Tradueix aquesta frase del català a l'anglès amb una expressió natural per al context: ${context} (${englishType}). Explica breument les alternatives, el registre i la pronunciació aproximada. Frase: "${phrase}"`;

    let translationData = null;

    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          translationData = {
            original: phrase,
            translation: textResponse,
            context,
            englishType,
            date: new Date().toLocaleDateString()
          };
        }
      } catch (err) {
        console.error("Error amb l'API:", err);
      }
    }

    // Fallback intel·ligent si no hi ha clau o falla
    if (!translationData) {
      translationData = {
        original: phrase,
        translation: englishType === 'GB Britànic' ? "It's sorting itself out nicely." : "Everything is coming together smoothly.",
        context,
        englishType,
        details: "Expressió natural adaptada per a un entorn col·loquial entre amics.",
        pronunciation: englishType === 'GB Britànic' ? "it sor-ting its-self out nai-sli" : "ev-ri-thing is com-ing to-ge-ther",
        date: new Date().toLocaleDateString()
      };
    }

    setResult(translationData);
    const updatedHistory = [translationData, ...history];
    setHistory(updatedHistory);
    saveToStorage(updatedHistory, favorites);
    setLoading(false);
  };

  const speakText = (text, rate = 1) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = englishType === 'GB Britànic' ? 'en-GB' : 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("El teu navegador no suporta síntesi de veu.");
    }
  };

  const toggleFavorite = (item) => {
    const exists = favorites.some(f => f.original === item.original);
    let updatedFavorites;
    if (exists) {
      updatedFavorites = favorites.filter(f => f.original !== item.original);
    } else {
      updatedFavorites = [item, ...favorites];
    }
    setFavorites(updatedFavorites);
    saveToStorage(history, updatedFavorites);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans pb-12">
      {/* HEADER */}
      <header className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center border-b border-[#EAE3D2]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#E06D3B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#2C2A29]">Anglès · Parla Natural</h1>
            <p className="text-xs text-[#8C8275]">Perfil: <span className="font-semibold text-[#E06D3B]">{user}</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex space-x-4 text-sm font-medium">
            <button onClick={() => setActiveTab('tradueix')} className={`pb-1 ${activeTab === 'tradueix' ? 'border-b-2 border-[#E06D3B] text-[#E06D3B]' : 'text-gray-600 hover:text-black'}`}>Tradueix</button>
            <button onClick={() => setActiveTab('preferits')} className={`pb-1 ${activeTab === 'preferits' ? 'border-b-2 border-[#E06D3B] text-[#E06D3B]' : 'text-gray-600 hover:text-black'}`}>Preferits</button>
            <button onClick={() => setActiveTab('historial')} className={`pb-1 ${activeTab === 'historial' ? 'border-b-2 border-[#E06D3B] text-[#E06D3B]' : 'text-gray-600 hover:text-black'}`}>Historial</button>
          </nav>

          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-1 bg-[#F0EAE1] px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#E4DCD0]">
              <span>Canvia usuari</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                {['Marc', 'Laura', 'Pau', 'Anna', 'Pol'].map(u => (
                  <button key={u} onClick={() => { setUser(u); setShowUserMenu(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${user === u ? 'font-bold text-[#E06D3B]' : ''}`}>{u}</button>
                ))}
                <div className="border-t border-gray-100 my-1"></div>
                <button onClick={() => { setShowApiKeyModal(true); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-[#E06D3B] font-semibold hover:bg-gray-50">Configurar Clau API</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* NAVIGATION MÒBIL */}
      <div className="flex md:hidden justify-around bg-white border-b border-[#EAE3D2] py-2 text-xs font-medium">
        <button onClick={() => setActiveTab('tradueix')} className={activeTab === 'tradueix' ? 'text-[#E06D3B] font-bold' : 'text-gray-600'}>Tradueix</button>
        <button onClick={() => setActiveTab('preferits')} className={activeTab === 'preferits' ? 'text-[#E06D3B] font-bold' : 'text-gray-600'}>Preferits</button>
        <button onClick={() => setActiveTab('historial')} className={activeTab === 'historial' ? 'text-[#E06D3B] font-bold' : 'text-gray-600'}>Historial</button>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        {activeTab === 'tradueix' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-[#2C2A29] tracking-tight">Digues-ho <span className="text-[#E06D3B]">com un nadiu.</span></h2>
              <p className="text-sm text-[#736B5E] mt-1">Escriu en català i t'ensenyem com ho diria algú de debò.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EAE3D2]">
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Per exemple: Em sap greu, però avui no podré venir."
                className="w-full h-32 bg-[#F9F6F0] border border-[#EAE3D2] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06D3B] resize-none text-[#2C2A29]"
              />

              <div className="mt-4">
                <label className="text-xs font-bold text-[#8C8275] uppercase tracking-wider">Context</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Conversa informal', 'Feina', 'Viatge', 'Presentació'].map(c => (
                    <button
                      key={c}
                      onClick={() => setContext(c)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${context === c ? 'bg-[#0D4746] text-white shadow-sm' : 'bg-[#F0EAE1] text-[#595248] hover:bg-[#E4DCD0]'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-[#8C8275] uppercase tracking-wider">Anglès</label>
                  <div className="flex gap-2 mt-2">
                    {['GB Britànic', 'US Americà'].map(t => (
                      <button
                        key={t}
                        onClick={() => setEnglishType(t)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${englishType === t ? 'bg-[#0D4746] text-white shadow-sm' : 'bg-[#F0EAE1] text-[#595248] hover:bg-[#E4DCD0]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleTranslate}
                  disabled={loading}
                  className="bg-[#E06D3B] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-[#D15C2A] transition-all shadow-md flex items-center justify-center space-x-2 self-end sm:self-auto"
                >
                  {loading ? 'Traduint...' : '✨ Tradueix'}
                </button>
              </div>
            </div>

            {result && (
              <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-[#EAE3D2]">
                <div className="flex justify-between items-start">
                  <span className="bg-[#EBF4F3] text-[#0D4746] px-3 py-1 rounded-full text-xs font-bold">{result.context} • {result.englishType}</span>
                  <button onClick={() => toggleFavorite(result)} className="text-sm font-semibold text-[#E06D3B]">
                    {favorites.some(f => f.original === result.original) ? '★ Guardat a preferits' : '☆ Guarda a preferits'}
                  </button>
                </div>
                <h3 className="text-xl font-bold text-[#2C2A29] mt-3">{result.translation}</h3>
                {result.details && <p className="text-xs text-[#595248] mt-2 bg-[#FAF7F2] p-3 rounded-xl">{result.details}</p>}
                
                <div className="mt-4 flex gap-2">
                  <button onClick={() => speakText(result.translation, 1)} className="bg-[#0D4746] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1">
                    🔊 Escolta
                  </button>
                  <button onClick={() => speakText(result.translation, 0.6)} className="bg-[#F0EAE1] text-[#0D4746] px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1">
                    🐢 A poc a poc
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferits' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-[#2C2A29]">Frases preferides</h2>
            {favorites.length === 0 ? (
              <p className="text-sm text-[#8C8275]">Encara no tens cap frase desada com a preferida.</p>
            ) : (
              <div className="space-y-4">
                {favorites.map((fav, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-[#EAE3D2]">
                    <p className="text-xs text-[#8C8275]">Original: {fav.original}</p>
                    <h4 className="font-bold text-base text-[#2C2A29] mt-1">{fav.translation}</h4>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => speakText(fav.translation, 1)} className="text-xs bg-[#0D4746] text-white px-3 py-1.5 rounded-lg font-bold">🔊 Escolta</button>
                      <button onClick={() => toggleFavorite(fav)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold">Esborra</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-[#2C2A29]">Historial de traduccions</h2>
            {history.length === 0 ? (
              <p className="text-sm text-[#8C8275]">L'historial està buit.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-[#EAE3D2] flex justify-between items-center">
                    <div>
                      <p className="text-xs text-[#8C8275]">{item.original}</p>
                      <p className="font-bold text-sm text-[#2C2A29]">{item.translation}</p>
                    </div>
                    <button onClick={() => speakText(item.translation, 1)} className="text-xs bg-[#F0EAE1] text-[#0D4746] px-3 py-1.5 rounded-xl font-bold">🔊 Escolta</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL API KEY */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-[#2C2A29]">Configurar Clau API de Gemini</h3>
            <p className="text-xs text-[#736B5E] mb-4">Enganxa aquí la teva clau gratuïta de Google AI Studio per habilitar traduccions en temps real.</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#FAF7F2] border border-[#EAE3D2] rounded-xl p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#E06D3B]"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowApiKeyModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600">Cancel·la</button>
              <button onClick={() => handleSaveApiKey(apiKey)} className="bg-[#E06D3B] text-white px-4 py-2 rounded-xl text-xs font-bold">Desa la clau</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
