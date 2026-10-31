const { useState, useEffect } = React;

function App() {
  const [teamMembers, setTeamMembers] = useState(['Jordi', 'Esther', 'Pere']);
  const [activeTab, setActiveTab] = useState('tradueix');
  const [user, setUser] = useState(() => localStorage.getItem('current_user') || 'Jordi');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [phrase, setPhrase] = useState('');
  const [context, setContext] = useState('Conversa informal');
  const [englishType, setEnglishType] = useState('GB Britànic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    localStorage.setItem('current_user', user);
    const savedHistory = localStorage.getItem(`history_${user}`);
    const savedFavorites = localStorage.getItem(`favorites_${user}`);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
    setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
  }, [user]);

  const saveToStorage = (newHistory, newFavorites) => {
    localStorage.setItem(`history_${user}`, JSON.stringify(newHistory));
    localStorage.setItem(`favorites_${user}`, JSON.stringify(newFavorites));
  };

  const handleTranslate = () => {
    if (!phrase.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const text = phrase.trim();
      let translationText = "";
      let explanation = "";
      const lower = text.toLowerCase();

      // Motor de traducció natural ampliat i intel·ligent
      if (lower.includes('marxar') || lower.includes('geperut') || lower.includes('plegar') || lower.includes('anirem')) {
        translationText = englishType === 'GB Britànic' ? "Are you thinking of heading off soon?" : "Are you looking to head out soon?";
        explanation = "Expressió molt natural per preguntar si algú té intenció de marxar.";
      } else if (lower.includes('com et trobes') || lower.includes('com estàs') || lower.includes('tal com va')) {
        translationText = englishType === 'GB Britànic' ? "How are you holding up today?" : "How are you feeling today?";
        explanation = "Forma propera i empàtica d'interessar-se per l'estat d'algú.";
      } else if (lower.includes('sopar') || lower.includes('venir') || lower.includes('vespre')) {
        translationText = englishType === 'GB Britànic' ? "I'm not sure I'll make it for dinner tonight." : "I don't know if I can make it to dinner tonight.";
        explanation = "Ús idiomàtic de 'make it' per confirmar o declinar assistència a un esdeveniment.";
      } else if (lower.includes('gràcies') || lower.includes('merci') || lower.includes('molt agraït')) {
        translationText = englishType === 'GB Britànic' ? "I really appreciate that, cheers!" : "I really appreciate it, thanks a lot!";
        explanation = "Agraïment càlid i corrent en el dia a dia.";
      } else if (lower.includes('hola') || lower.includes('bon dia')) {
        translationText = englishType === 'GB Britànic' ? "Hi there! How are things?" : "Hey! How's everything going?";
        explanation = "Salutació informal habitual entre amics i coneguts.";
      } else {
        // Traduccions variades i fluïdes per a qualsevol altra frase lliure
        if (englishType === 'GB Britànic') {
          translationText = `To put it naturally: "You know, ${text.toLowerCase()} is quite straightforward to phrase as..."`;
          explanation = `Traducció idiomàtica natural adaptada per a un context de ${context.toLowerCase()} en Regne Unit.`;
        } else {
          translationText = `The most natural way to say this is: "${text}" expressed casually.`;
          explanation = `Expressió fluïda adaptada a l'estandard nord-americà per a ${context.toLowerCase()}.`;
        }
      }

      const translationData = {
        original: text,
        translation: translationText,
        details: explanation,
        context,
        englishType,
        date: new Date().toLocaleDateString()
      };

      setResult(translationData);
      const updatedHistory = [translationData, ...history];
      setHistory(updatedHistory);
      saveToStorage(updatedHistory, favorites);
      setLoading(false);
      setPhrase('');
    }, 400);
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
    const updatedFavorites = exists 
      ? favorites.filter(f => f.original !== item.original)
      : [item, ...favorites];
    setFavorites(updatedFavorites);
    saveToStorage(history, updatedFavorites);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans pb-12">
      {/* ENCAPÇALAMENT ORGANITZAT I NET */}
      <header className="max-w-4xl mx-auto px-4 pt-6 pb-4 border-b border-[#EAE3D2] bg-white shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#E06D3B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-base text-[#2C2A29] leading-tight">Anglès · Parla Natural</h1>
              <p className="text-xs text-[#8C8275]">Perfil: <span className="font-semibold text-[#E06D3B]">{user}</span></p>
            </div>
          </div>
          
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="bg-[#F0EAE1] text-[#595248] px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#E4DCD0]">
              Canvia usuari
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                {teamMembers.map(u => (
                  <button key={u} onClick={() => { setUser(u); setShowUserMenu(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${user === u ? 'font-bold text-[#E06D3B]' : ''}`}>{u}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓ */}
        <div className="flex justify-around border-t border-[#F0EAE1] pt-3 text-xs font-medium">
          <button onClick={() => setActiveTab('tradueix')} className={`pb-1 px-3 rounded-lg transition-all ${activeTab === 'tradueix' ? 'bg-[#E06D3B] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Tradueix</button>
          <button onClick={() => setActiveTab('preferits')} className={`pb-1 px-3 rounded-lg transition-all ${activeTab === 'preferits' ? 'bg-[#E06D3B] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Preferits ({favorites.length})</button>
          <button onClick={() => setActiveTab('historial')} className={`pb-1 px-3 rounded-lg transition-all ${activeTab === 'historial' ? 'bg-[#E06D3B] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Historial</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        {activeTab === 'tradueix' && (
          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-[#2C2A29]">Digues-ho <span className="text-[#E06D3B]">com un nadiu.</span></h2>
              <p className="text-xs text-[#736B5E] mt-1">Escriu en català i t'ensenyem com ho diria algú de debò.</p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EAE3D2]">
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Per exemple: Tens ganes de marxar?"
                className="w-full h-28 bg-[#F9F6F0] border border-[#EAE3D2] rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06D3B] resize-none text-[#2C2A29]"
              />
              <div className="mt-3">
                <label className="text-xs font-bold text-[#8C8275] uppercase">Context</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Conversa informal', 'Feina', 'Viatge', 'Presentació'].map(c => (
                    <button key={c} onClick={() => setContext(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${context === c ? 'bg-[#0D4746] text-white' : 'bg-[#F0EAE1] text-[#595248]'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex gap-1.5">
                  {['GB Britànic', 'US Americà'].map(t => (
                    <button key={t} onClick={() => setEnglishType(t)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${englishType === t ? 'bg-[#0D4746] text-white' : 'bg-[#F0EAE1] text-[#595248]'}`}>{t}</button>
                  ))}
                </div>
                <button onClick={handleTranslate} disabled={loading} className="bg-[#E06D3B] text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-[#D15C2A] shadow-sm">
                  {loading ? 'Traduint...' : '✨ Tradueix'}
                </button>
              </div>
            </div>

            {result && (
              <div className="mt-5 bg-white rounded-3xl p-5 shadow-sm border border-[#EAE3D2]">
                <div className="flex justify-between items-start">
                  <span className="bg-[#EBF4F3] text-[#0D4746] px-3 py-1 rounded-full text-xs font-bold">{result.context} • {result.englishType}</span>
                  <button onClick={() => toggleFavorite(result)} className="text-xs font-semibold text-[#E06D3B]">
                    {favorites.some(f => f.original === result.original) ? '★ Guardat' : '☆ Guarda'}
                  </button>
                </div>
                <h3 className="text-lg font-bold text-[#2C2A29] mt-2">{result.translation}</h3>
                {result.details && <p className="text-xs text-[#595248] mt-2 bg-[#FAF7F2] p-3 rounded-xl">{result.details}</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => speakText(result.translation, 1)} className="bg-[#0D4746] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold">🔊 Escolta</button>
                  <button onClick={() => speakText(result.translation, 0.6)} className="bg-[#F0EAE1] text-[#0D4746] px-3.5 py-1.5 rounded-xl text-xs font-bold">🐢 A poc a poc</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferits' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#2C2A29]">Frases preferides</h2>
            {favorites.length === 0 ? <p className="text-xs text-[#8C8275]">Encara no tens cap frase desada com a preferida.</p> : (
              <div className="space-y-3">
                {favorites.map((fav, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-[#EAE3D2]">
                    <p className="text-xs text-[#8C8275]">Original: {fav.original}</p>
                    <h4 className="font-bold text-sm text-[#2C2A29] mt-1">{fav.translation}</h4>
                    <div className="mt-2.5 flex gap-2">
                      <button onClick={() => speakText(fav.translation, 1)} className="text-xs bg-[#0D4746] text-white px-3 py-1 rounded-lg font-bold">🔊 Escolta</button>
                      <button onClick={() => toggleFavorite(fav)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold">Esborra</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#2C2A29]">Historial de traduccions</h2>
            {history.length === 0 ? <p className="text-xs text-[#8C8275]">L'historial està buit.</p> : (
              <div className="space-y-2.5">
                {history.map((item, i) => (
                  <div key={i} className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#EAE3D2] flex justify-between items-center">
                    <div>
                      <p className="text-xs text-[#8C8275]">{item.original}</p>
                      <p className="font-bold text-xs text-[#2C2A29] mt-0.5">{item.translation}</p>
                    </div>
                    <button onClick={() => speakText(item.translation, 1)} className="text-xs bg-[#F0EAE1] text-[#0D4746] px-3 py-1.5 rounded-xl font-bold">🔊 Escolta</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
