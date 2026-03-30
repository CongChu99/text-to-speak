import { useEffect } from 'react';
import { useLanguageStore } from './store/languageStore';

function App() {
  const { languages, fetchLanguages, isLoading, error } = useLanguageStore();

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text to Speak</h1>
        <p className="text-gray-500 mb-8">Real-time speech translation powered by AI</p>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading languages...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && languages.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {languages.length} languages available
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
                >
                  <span className="font-medium text-gray-700">{lang.displayName}</span>
                  <span className="text-xs text-gray-400 uppercase">{lang.code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
