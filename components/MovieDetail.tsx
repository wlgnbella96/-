
import React, { useState, useRef, useEffect } from 'react';
import { Movie } from '../types';
import { ICONS, MAX_REVIEW_LENGTH } from '../constants';
import StarRating from './StarRating';
import { analyzeReview } from '../services/geminiService';

interface MovieDetailProps {
  movie: Movie;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdate: (movie: Movie) => void;
}

const MovieDetail: React.FC<MovieDetailProps> = ({ movie, onBack, onDelete, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedReview, setEditedReview] = useState(movie.review);
  const [editedRating, setEditedRating] = useState(movie.rating);
  const [editedImageUrl, setEditedImageUrl] = useState(movie.imageUrl || '');
  const [editedTagsInput, setEditedTagsInput] = useState((movie.tags || []).join(', '));
  
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize edit state when movie changes or edit mode opens
  useEffect(() => {
    if (isEditing) {
      setEditedReview(movie.review);
      setEditedRating(movie.rating);
      setEditedImageUrl(movie.imageUrl || '');
      setEditedTagsInput((movie.tags || []).join(', '));
    }
  }, [isEditing, movie]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeReview(movie.title, movie.review, movie.rating);
    onUpdate({ ...movie, aiAnalysis: analysis });
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (editedReview.trim().length === 0) return;
    
    // Process tags
    const processedTags = editedTagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onUpdate({ 
      ...movie, 
      review: editedReview,
      rating: editedRating,
      imageUrl: editedImageUrl,
      tags: processedTags
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset handled by useEffect
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Determine which image to show
  const displayImage = isEditing ? editedImageUrl : (movie.imageUrl || '');
  const bgImage = !imgError && displayImage 
    ? displayImage 
    : `https://picsum.photos/seed/${movie.id}/400/600`;

  return (
    <div className="animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ICONS.ArrowLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </button>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium border border-gray-200 dark:border-zinc-700 shadow-sm"
          >
            <ICONS.Edit className="w-4 h-4" />
            수정 모드
          </button>
        )}
        
        {isEditing && (
           <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-4 py-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-zinc-900 rounded-lg"
              >
                <ICONS.X className="w-4 h-4" /> 취소
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
              >
                <ICONS.Check className="w-4 h-4" /> 저장
              </button>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Poster & Quick Info */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-xl sticky top-6">
            
            {/* Poster Image Section */}
            <div className="aspect-[2/3] w-full relative bg-gray-100 dark:bg-zinc-800 group overflow-hidden">
               <img 
                src={bgImage} 
                alt={movie.title} 
                onError={() => setImgError(true)}
                className={`w-full h-full object-cover transition-opacity duration-500 ${isEditing ? 'opacity-50' : 'opacity-90 group-hover:opacity-100'}`}
              />
              
              {!isEditing && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                    <h1 className="text-3xl font-bold text-white leading-tight drop-shadow-md">{movie.title}</h1>
                    {movie.releaseYear && (
                      <p className="text-zinc-300 mt-1 font-medium text-sm drop-shadow-sm">{movie.releaseYear} • {movie.director}</p>
                    )}
                  </div>
                </>
              )}

              {/* Edit Image Overlay */}
              {isEditing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                   <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                   />
                   <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-xl text-white border border-white/20 transition-all hover:scale-105"
                   >
                      <ICONS.Upload className="w-8 h-8" />
                      <span className="font-medium text-sm">사진 변경</span>
                   </button>
                </div>
              )}
            </div>
            
            {/* Edit Image URL Input (Visible only in edit mode) */}
            {isEditing && (
              <div className="px-6 pt-4">
                 <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <ICONS.Link className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                     </div>
                     <input 
                        type="text" 
                        placeholder="이미지 URL 입력..." 
                        value={editedImageUrl}
                        onChange={(e) => setEditedImageUrl(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-zinc-600"
                     />
                 </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              
              {/* Tags Section */}
              {(isEditing || (movie.tags && movie.tags.length > 0)) && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold mb-2 flex items-center gap-1">
                    <ICONS.Tag className="w-3 h-3" />
                    태그 / 컬렉션
                  </p>
                  {isEditing ? (
                    <div>
                        <input 
                          type="text" 
                          value={editedTagsInput}
                          onChange={(e) => setEditedTagsInput(e.target.value)}
                          placeholder="태그1, 태그2 (쉼표로 구분)"
                          className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1">쉼표(,)로 구분하여 여러 개를 입력하세요.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                        {movie.tags?.map((tag, idx) => (
                             <span key={idx} className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-sm font-medium">
                               {tag}
                             </span>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rating Section */}
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold mb-2">
                  {isEditing ? "평점 수정" : "나의 평점"}
                </p>
                <div className={isEditing ? "p-2 bg-gray-50 dark:bg-zinc-950 rounded-lg border border-gray-300 dark:border-zinc-700 inline-block" : ""}>
                   <StarRating 
                     rating={isEditing ? editedRating : movie.rating} 
                     readOnly={!isEditing} 
                     setRating={isEditing ? setEditedRating : undefined}
                     size="lg" 
                   />
                </div>
              </div>

              {/* Read-only Metadata */}
              {!isEditing && movie.rottenTomatoesScore && (
                 <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-500/10">
                   <p className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold mb-2 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                     로튼 토마토 지수
                   </p>
                   <div className="flex items-center gap-3">
                     <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FA320A] text-white font-black text-sm shadow-lg shadow-red-600/20 transform -rotate-6">
                       RT
                     </span>
                     <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{movie.rottenTomatoesScore}</span>
                   </div>
                 </div>
              )}
              
              {!isEditing && movie.plotSummary && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold mb-2">줄거리</p>
                  <p className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed italic border-l-2 border-gray-300 dark:border-zinc-700 pl-3">"{movie.plotSummary}"</p>
                </div>
              )}

              {!isEditing && (
                <button
                  onClick={() => onDelete(movie.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/30 text-sm font-medium"
                >
                  <ICONS.Trash2 className="w-4 h-4" />
                  기록 삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Review & AI Analysis */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* User Review Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 lg:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ICONS.Clapperboard className="w-6 h-6 text-indigo-600 dark:text-indigo-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">나의 감상평</h2>
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-4 animate-fadeIn">
                <textarea
                  value={editedReview}
                  onChange={(e) => setEditedReview(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg p-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                  rows={6}
                  maxLength={MAX_REVIEW_LENGTH}
                />
                <div className="flex justify-end items-center">
                   <span className={`text-xs ${editedReview.length > MAX_REVIEW_LENGTH ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500'}`}>
                     {editedReview.length} / {MAX_REVIEW_LENGTH}
                   </span>
                </div>
              </div>
            ) : (
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap">{movie.review}</p>
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-500/30 p-6 lg:p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ICONS.BrainCircuit className="w-32 h-32 text-indigo-400" />
             </div>
             
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <ICONS.Sparkles className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI 심층 분석</h2>
              </div>
              {!movie.aiAnalysis && !isAnalyzing && (
                <button 
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                  <ICONS.BrainCircuit className="w-4 h-4" />
                  내 취향 분석하기
                </button>
              )}
            </div>

            {isAnalyzing && (
               <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                 <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-indigo-600 dark:text-indigo-300 font-medium">Gemini가 리뷰를 깊이 생각하고 있습니다...</p>
               </div>
            )}

            {!isAnalyzing && movie.aiAnalysis && (
               <div className="prose prose-indigo dark:prose-invert max-w-none relative z-10 animate-fadeIn">
                  <div className="pl-4 border-l-2 border-indigo-500/50">
                    <p className="text-gray-700 dark:text-zinc-300 italic leading-relaxed">
                      {movie.aiAnalysis}
                    </p>
                  </div>
               </div>
            )}
            
            {!isAnalyzing && !movie.aiAnalysis && (
              <p className="text-gray-500 dark:text-zinc-500 italic relative z-10">
                '내 취향 분석하기'를 클릭하여 Gemini Pro(Thinking Mode)가 영화의 주제와 내 리뷰를 연결하여 분석하게 하세요.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieDetail;