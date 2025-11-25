
import React, { useState, useEffect, useRef } from 'react';
import { Movie, SearchResult } from '../types';
import { ICONS, MAX_REVIEW_LENGTH } from '../constants';
import StarRating from './StarRating';
import { searchMovieMetadata } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface AddMovieFormProps {
  onSave: (movie: Movie) => void;
  onCancel: () => void;
}

const AddMovieForm: React.FC<AddMovieFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [metadata, setMetadata] = useState<SearchResult | null>(null);
  
  // Custom image state
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine which image to show/save: Custom takes precedence over Metadata
  const displayImageUrl = customImageUrl || metadata?.imageUrl;

  const handleSearch = async () => {
    if (!title.trim()) return;
    setIsSearching(true);
    setMetadata(null); // Reset previous metadata
    setCustomImageUrl(''); // Reset custom image on new search to show found result
    
    const result = await searchMovieMetadata(title);
    if (result) {
      setMetadata(result);
      // Auto-fix title capitalization if found
      setTitle(result.title);
    }
    setIsSearching(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || rating === 0) return;

    // Process tags: split by comma, trim whitespace, remove empty strings
    const processedTags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const newMovie: Movie = {
      id: uuidv4(),
      title,
      rating,
      review,
      tags: processedTags,
      createdAt: new Date().toISOString(),
      director: metadata?.director,
      releaseYear: metadata?.year,
      plotSummary: metadata?.plot,
      rottenTomatoesScore: metadata?.rottenTomatoesScore,
      imageUrl: displayImageUrl,
    };

    onSave(newMovie);
  };

  return (
    <div className="max-w-2xl mx-auto animate-slideUp">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-zinc-800">
           <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
              <ICONS.Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">영화 기록하기</h2>
             <p className="text-gray-500 dark:text-zinc-500 text-sm">영화의 감동을 기록으로 남기세요.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Title Input with AI Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">영화 제목</label>
            <div className="relative flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 기생충, 매트릭스"
                  className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg py-3 pl-4 pr-12 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                {metadata && (
                  <span className="absolute right-3 top-3.5 text-green-500">
                    <ICONS.Sparkles className="w-5 h-5" />
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={!title || isSearching}
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 border border-gray-200 dark:border-zinc-700 whitespace-nowrap"
              >
                {isSearching ? (
                   <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ICONS.Search className="w-4 h-4" />
                )}
                <span>검색</span>
              </button>
            </div>
            
            {/* Search Result Text Info */}
            {metadata && (
              <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-4 animate-fadeIn">
                 <div className="flex-1 min-w-0">
                   <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2 mb-1">
                     <ICONS.Sparkles className="w-3.5 h-3.5" />
                     정보 발견: {metadata.title} ({metadata.year})
                   </p>
                   <p className="text-emerald-600/80 dark:text-emerald-500/70 text-xs truncate">감독: {metadata.director}</p>
                   
                   <div className="flex flex-wrap gap-2 mt-2">
                      {metadata.rottenTomatoesScore ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 text-xs border border-red-200 dark:border-red-500/20">
                          🍅 로튼 토마토: {metadata.rottenTomatoesScore}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs border border-gray-200 dark:border-zinc-700">
                          RT 점수 없음
                        </span>
                      )}
                   </div>
                 </div>
              </div>
            )}
            {!metadata && !isSearching && title && (
               <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                 "검색" 버튼을 누르면 영화 정보와 포스터를 자동으로 찾아옵니다.
               </p>
            )}
          </div>

          {/* Tags Input (Previously Theme) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">태그 / 컬렉션</label>
            <div className="relative">
                <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="예: 인생작, 공포 영화, 2024년 기록 (쉼표로 구분)"
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <ICONS.Tag className="w-4 h-4 text-gray-500 dark:text-zinc-500" />
                 </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-500">
                여러 개의 태그는 쉼표(,)로 구분하여 입력해주세요. 비슷한 영화들을 묶어서 볼 수 있습니다.
            </p>
          </div>

          {/* Image Registration Section */}
          <div className="space-y-3">
             <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">포스터 이미지</label>
             <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-lg border border-gray-200 dark:border-zinc-800">
                {/* Preview Box */}
                <div className="w-24 h-36 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center relative group shadow-sm">
                    {displayImageUrl ? (
                        <img 
                            src={displayImageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-100', 'dark:bg-zinc-800');
                            }}
                        />
                    ) : (
                        <ICONS.Image className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                    )}
                </div>
                
                {/* Controls */}
                <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2">
                         <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileUpload} 
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <ICONS.Upload className="w-4 h-4" />
                                <span>이미지 업로드</span>
                            </button>
                         </div>
                         
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <ICONS.Link className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                             </div>
                             <input 
                                type="text" 
                                placeholder="또는 이미지 URL 직접 입력..." 
                                value={customImageUrl}
                                onChange={(e) => setCustomImageUrl(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-zinc-600"
                             />
                         </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed">
                        검색된 이미지가 없거나 마음에 들지 않으면 직접 등록할 수 있습니다.
                    </p>
                </div>
             </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">평점</label>
            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 inline-block">
              <StarRating rating={rating} setRating={setRating} size="lg" />
            </div>
          </div>

          {/* Review Text Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
               <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">감상평</label>
               <span className={`text-xs ${review.length > MAX_REVIEW_LENGTH ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500'}`}>
                 {review.length} / {MAX_REVIEW_LENGTH}
               </span>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="영화에 대한 솔직한 감상평을 작성해주세요... (최대 1000자)"
              rows={6}
              className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg p-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={review.length > MAX_REVIEW_LENGTH || !title || rating === 0}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 dark:shadow-none"
            >
              <ICONS.Save className="w-4 h-4" />
              저장하기
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddMovieForm;