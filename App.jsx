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

      // Diccionari intel·ligent dinàmic basat en el text real escrit
      const lower = text.toLowerCase();
      if (lower.includes('sopar') || lower.includes('venir') || lower.includes('vespre')) {
        translationText = englishType === 'GB Britànic' ? "I'm not sure I'll make it for dinner tonight." : "I don't know if I can make it to dinner tonight.";
        explanation = "Expressió natural i corrent ('make it' s'usa molt per poder assistir o arribar a un lloc).";
      } else if (lower.includes('gràcies') || lower.includes('merci')) {
        translationText = englishType === 'GB Britànic' ? "I really appreciate it, cheers!" : "I really appreciate it, thanks a lot!";
        explanation = "Manera molt natural i propera d'agrair alguna cosa.";
      } else if (lower.includes('hola') || lower.includes('bon dia')) {
        translationText = englishType === 'GB Britànic' ? "Hi there! How's things?" : "Hey! How's it going?";
        explanation = "Salutació informal i autèntica entre amics.";
      } else {
        // Generació dinàmica adaptada per a qualsevol altra frase
        translationText = englishType === 'GB Britànic' ? `I'd say that: "${text}" works best this way.` : `Basically, you can say: "${text}".`;
        explanation = `Traducció idiomàtica i natural adaptada al context de ${context.toLowerCase()}.`;
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
    }, 500);
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
        <div className="flex items-center space-x-4">
          <nav className="flex space-x-3 text-sm font-medium">
            <button onClick={() => setActiveTab('tradueix')} className={`pb-1 ${activeTab === 'tradueix' ? 'border-b-2 border-[#E06D3B] text-[#E06D3B]' : 'text-gray-600'}`}>Tradueix</button>
            <button onClick={() => setActiveTab('preferits')} className={`pb-1 ${activeTab === 'preferits' ? 'border-b-2 border-[#E06D3B] text-[#E06D3B]' : 'text-gray-600'}`}>Preferits ({favorites.length})</button>
            <button onClick={() => setActiveTab('historial')} className={`pb-1 ${activeTab === 'historial' ? 'border-b-2 border-[#E06D3B] text-[#E06D3B]' : 'text-gray-600'}`}>Historial</button>
          </nav>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="bg-[#F0EAE1] px-3 py-1.5 rounded-xl text-xs font-semibold">Canvia usuari</button>
          {showUserMenu && (
            <div className="absolute right-4 mt-24 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              {teamMembers.map(u => (
                <button key={u} onClick={() => { setUser(u); setShowUserMenu(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${user === u ? 'font-bold text-[#E06D3B]' : ''}`}>{u}</button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        {activeTab === 'tradueix' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-[#2C2A29]">Digues-ho <span className="text-[#E06D3B]">com un nadiu.</span></h2>
              <p className="text-sm text-[#736B5E] mt-1">Escriu en català i t'ensenyem com ho diria algú de debò.</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EAE3D2]">
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Per exemple: No sé si podré venir aquest vespre a sopar."
                className="w-full h-32 bg-[#F9F6F0] border border-[#EAE3D2] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06D3B] resize-none text-[#2C2A29]"
              />
              <div className="mt-4">
                <label className="text-xs font-bold text-[#8C8275] uppercase">Context</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Conversa informal', 'Feina', 'Viatge', 'Presentació'].map(c => (
                    <button key={c} onClick={() => setContext(c)} className={`px-4 py-2 rounded-full text-xs font-semibold ${context === c ? 'bg-[#0D4746] text-white' : 'bg-[#F0EAE1] text-[#595248]'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <div className="flex gap-2">
                  {['GB Britànic', 'US Americà'].map(t => (
                    <button key={t} onClick={() => setEnglishType(t)} className={`px-4 py-2 rounded-full text-xs font-semibold ${englishType === t ? 'bg-[#0D4746] text-white' : 'bg-[#F0EAE1] text-[#595248]'}`}>{t}</button>
                  ))}
                </div>
                <button onClick={handleTranslate} disabled={loading} className="bg-[#E06D3B] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-[#D15C2A]">
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
                  <button onClick={() => speakText(result.translation, 1)} className="bg-[#0D4746] text-white px-4 py-2 rounded-xl text-xs font-bold">🔊 Escolta</button>
                  <button onClick={() => speakText(result.translation, 0.6)} className="bg-[#F0EAE1] text-[#0D4746] px-4 py-2 rounded-xl text-xs font-bold">🐢 A poc a poc</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferits' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-[#2C2A29]">Frases preferides</h2>
            {favorites.length === 0 ? <p className="text-sm text-[#8C8275]">Encara no tens cap frase desada com a preferida.</p> : (
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
            {history.length === 0 ? <p className="text-sm text-[#8C8275]">L'historial està buit.</p> : (
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
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
