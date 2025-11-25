
import React, { useState, useEffect } from 'react';
import { ICONS } from './constants';
import { Movie, ViewState } from './types';
import AddMovieForm from './components/AddMovieForm';
import MovieDetail from './components/MovieDetail';
import StarRating from './components/StarRating';

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [view, setView] = useState<ViewState>('list');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Tag Filtering State
  const [selectedTag, setSelectedTag] = useState<string>('전체');

  // Load from LocalStorage on mount & Migrate Data
  useEffect(() => {
    const saved = localStorage.getItem('cineLog_movies');
    if (saved) {
      try {
        const parsedMovies = JSON.parse(saved);
        
        // Data Migration: Convert legacy 'theme' string to 'tags' array if needed
        const migratedMovies = parsedMovies.map((m: any) => {
          if (!m.tags && m.theme) {
            return { ...m, tags: [m.theme], theme: undefined };
          }
          return m;
        });

        setMovies(migratedMovies);
      } catch (e) {
        console.error("Failed to parse movies", e);
      }
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('cineLog_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('cineLog_movies', JSON.stringify(movies));
  }, [movies]);

  // Handle Theme Change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cineLog_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cineLog_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Extract unique tags from all movies
  const allTags = movies.flatMap(m => m.tags || []);
  const uniqueTags = Array.from(new Set(allTags)).sort();

  const handleSaveMovie = (movie: Movie) => {
    setMovies((prev) => [movie, ...prev]); // Add new to top
    setView('list');
    setSelectedTag('전체'); // Reset filter to show new movie
  };

  const handleUpdateMovie = (updatedMovie: Movie) => {
    setMovies((prev) => prev.map(m => m.id === updatedMovie.id ? updatedMovie : m));
    // Don't change view, stay on detail
  };

  const handleDeleteMovie = (id: string) => {
    setMovies((prev) => prev.filter(m => m.id !== id));
    setView('list');
    setSelectedMovieId(null);
  };

  const handleSelectMovie = (id: string) => {
    setSelectedMovieId(id);
    setView('detail');
  };

  // Filter movies based on selection
  const filteredMovies = selectedTag === '전체' 
    ? movies 
    : movies.filter(m => m.tags && m.tags.includes(selectedTag));

  const renderContent = () => {
    if (view === 'add') {
      return (
        <AddMovieForm 
          onSave={handleSaveMovie} 
          onCancel={() => setView('list')} 
        />
      );
    }

    if (view === 'detail' && selectedMovieId) {
      const movie = movies.find(m => m.id === selectedMovieId);
      if (movie) {
        return (
          <MovieDetail 
            movie={movie} 
            onBack={() => setView('list')}
            onDelete={handleDeleteMovie}
            onUpdate={handleUpdateMovie}
          />
        );
      }
    }

    // List View
    return (
      <div className="animate-fadeIn">
         {/* Header for List */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">나만의 영화 컬렉션</h2>
              <p className="text-gray-500 dark:text-zinc-400 mt-1">
                {movies.length}편의 영화를 감상했습니다
              </p>
            </div>
            <button 
              onClick={() => setView('add')}
              className="group flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-semibold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-lg shadow-gray-200 dark:shadow-white/5 hover:shadow-indigo-500/20"
            >
              <ICONS.Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              영화 기록하기
            </button>
         </div>

         {/* Tag Filter Chips */}
         {movies.length > 0 && (
           <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              <button
                 onClick={() => setSelectedTag('전체')}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                   selectedTag === '전체' 
                   ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                   : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white'
                 }`}
              >
                 전체 보기
              </button>
              {uniqueTags.map(tag => (
                 <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedTag === tag
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                 >
                    <ICONS.Tag className="w-3 h-3" />
                    {tag}
                 </button>
              ))}
           </div>
         )}

         {movies.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800/50">
               <ICONS.Clapperboard className="w-16 h-16 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
               <h3 className="text-xl font-semibold text-gray-400 dark:text-zinc-400 mb-2">아직 기록된 영화가 없습니다</h3>
               <p className="text-gray-500 dark:text-zinc-500 max-w-md mx-auto">
                 나만의 영화 기록을 시작해보세요. 영화를 검색하고, 평가하고, AI 분석을 받아보세요.
               </p>
            </div>
         ) : filteredMovies.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800/50 animate-fadeIn">
               <ICONS.Tag className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-gray-400 dark:text-zinc-400 mb-2">"{selectedTag}" 태그가 포함된 영화가 없습니다</h3>
               <button 
                  onClick={() => setSelectedTag('전체')}
                  className="mt-4 text-indigo-500 hover:text-indigo-400 underline underline-offset-4"
               >
                  전체 목록으로 돌아가기
               </button>
            </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
              {filteredMovies.map((movie) => {
                // Determine image source with error fallback handling handled by UI if needed
                // Simple version: if movie.imageUrl exists, use it, else fallback
                const imgSrc = movie.imageUrl || `https://picsum.photos/seed/${movie.id}/400/200`;

                return (
                <div 
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie.id)}
                  className="group bg-white dark:bg-zinc-900/50 hover:bg-gray-50 dark:hover:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full"
                >
                  {/* Top section: Image & Gradient Overlay */}
                  <div className="h-48 bg-gray-200 dark:bg-zinc-800 relative overflow-hidden">
                     <img 
                        src={imgSrc} 
                        alt={movie.title} 
                        className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${movie.id}/400/200`;
                        }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-zinc-900 via-transparent to-transparent opacity-90" />
                     <div className="absolute top-3 right-3 flex gap-2">
                       {movie.rottenTomatoesScore && (
                         <span className="bg-red-600/90 dark:bg-red-900/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-lg border border-red-400/30 dark:border-red-500/30">
                           🍅 {movie.rottenTomatoesScore}
                         </span>
                       )}
                     </div>
                     <div className="absolute bottom-3 left-4 right-4">
                       <h3 className="text-xl font-bold text-white truncate drop-shadow-md">{movie.title}</h3>
                       <div className="text-xs text-zinc-200 dark:text-zinc-300 flex justify-between items-center mt-1">
                         <span>{movie.releaseYear || '연도 미상'}</span>
                         <span className="italic text-zinc-300 dark:text-zinc-400">{new Date(movie.createdAt).toLocaleDateString()}</span>
                       </div>
                     </div>
                  </div>

                  {/* Bottom section: Rating & Snippet */}
                  <div className="p-4 flex flex-col flex-grow">
                     <div className="mb-3 flex justify-between items-center">
                       <StarRating rating={movie.rating} readOnly size="sm" />
                       <div className="flex gap-1 overflow-hidden">
                          {movie.tags?.slice(0, 2).map((tag, i) => (
                             <span key={i} className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 truncate max-w-[60px]">
                                {tag}
                             </span>
                          ))}
                          {movie.tags && movie.tags.length > 2 && (
                             <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 px-1 py-0.5 rounded-full">
                               +{movie.tags.length - 2}
                             </span>
                          )}
                       </div>
                     </div>
                     <p className="text-gray-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4 flex-grow">
                       {movie.review || "작성된 리뷰가 없습니다."}
                     </p>
                     {movie.aiAnalysis && (
                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                           <ICONS.BrainCircuit className="w-3 h-3" />
                           <span>AI 분석 완료</span>
                        </div>
                     )}
                  </div>
                </div>
              )})}
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-zinc-200 pb-20 transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('list')}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ICONS.Clapperboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">시네마로그</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button
               onClick={toggleTheme}
               className="p-2 rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
               title={isDarkMode ? "브라이트 모드" : "다크 모드"}
             >
               {isDarkMode ? <ICONS.Sun className="w-5 h-5" /> : <ICONS.Moon className="w-5 h-5" />}
             </button>
             {/* User avatar placeholder */}
             <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-zinc-300">
                나
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;