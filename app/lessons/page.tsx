'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Menu, 
  X, 
  ChevronRight, 
  BookOpen, 
  ArrowLeft, 
  ArrowRight,
  Play, 
  FileText,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { fetchModules, fetchLessons, fetchLessonById } from '@/lib/sheetsClient';

function LessonPageContent() {
  const searchParams = useSearchParams();
  const currentLessonId = searchParams.get('id') || '1';

  const [lesson, setLesson] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  // Fetch all initial data
  useEffect(() => {
    if (!currentLessonId) return;

    const fetchData = async () => {
      try {
        // Check auth client-side
        const token = localStorage.getItem('session_token');
        if (!token) {
          router.push('/');
          return;
        }

        // Fetch current lesson
        const currentLesson = await fetchLessonById(currentLessonId);
        if (!currentLesson) {
          throw new Error('Урок не найден');
        }
        setLesson(currentLesson);

        // Fetch all modules
        const allModules = await fetchModules();
        setModules(allModules || []);
        
        // Auto-expand current module
        if (currentLesson?.moduleId) {
          setExpandedModules(prev => ({
            ...prev,
            [currentLesson.moduleId]: true
          }));
        }

        // Fetch all lessons
        const allLessons = await fetchLessons();
        setLessons(allLessons || []);

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentLessonId, router]);

  // Toggle module expansion in sidebar
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Find next and previous lessons
  const getNavLessons = () => {
    if (!lessons.length || !currentLessonId) return { prev: null, next: null };
    const currentIndex = lessons.findIndex((l: any) => String(l.id) === String(currentLessonId));
    if (currentIndex === -1) return { prev: null, next: null };

    return {
      prev: currentIndex > 0 ? lessons[currentIndex - 1] : null,
      next: currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
    };
  };

  const { prev: prevLesson, next: nextLesson } = getNavLessons();

  const handleLogout = async () => {
    // Clear cookies and localStorage
    document.cookie = 'session_token=; path=/; max-age=0;';
    localStorage.removeItem('session_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  // Group lessons by module
  const groupedLessons = modules.reduce((acc, mod) => {
    acc[mod.id] = lessons.filter((l: any) => String(l.moduleId) === String(mod.id));
    return acc;
  }, {} as Record<string, any[]>);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-50 border-r border-zinc-100">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-zinc-950 tracking-tight">NWO Platform</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Обучение и контент</p>
        </div>
        <button 
          onClick={handleLogout} 
          title="Выйти"
          className="p-2 hover:bg-zinc-200/60 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Modules & Lessons Hierarchy */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-3">
        {modules.map((mod: any) => {
          const modLessons = groupedLessons[mod.id] || [];
          const isExpanded = expandedModules[mod.id];
          const hasActiveLesson = modLessons.some((l: any) => String(l.id) === String(currentLessonId));

          return (
            <div key={mod.id} className="space-y-1">
              {/* Module Header Button */}
              <button
                onClick={() => toggleModule(mod.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-medium text-sm text-left ${
                  hasActiveLesson 
                    ? 'bg-emerald-50 text-emerald-900' 
                    : 'hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className={`w-4 h-4 ${hasActiveLesson ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  <span className="truncate">{mod.title || `Модуль ${mod.id}`}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-zinc-400 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Lessons List under Module */}
              {isExpanded && (
                <div className="pl-6 pr-1 py-1 space-y-1 border-l border-zinc-200/60 ml-5 mt-1">
                  {modLessons.map((les: any) => {
                    const isActive = String(les.id) === String(currentLessonId);
                    return (
                      <button
                        key={les.id}
                        onClick={() => {
                          router.push(`/lessons?id=${les.id}`);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-between ${
                          isActive 
                            ? 'bg-white text-emerald-600 font-semibold shadow-sm border border-zinc-100' 
                            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
                        }`}
                      >
                        <span className="truncate mr-2">{les.title}</span>
                        {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0 text-emerald-600" />}
                      </button>
                    );
                  })}
                  {modLessons.length === 0 && (
                    <span className="text-xs text-zinc-400 block py-1 px-3 italic">Нет уроков</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-zinc-900 font-sans">
      
      {/* Desktop Left Sidebar Column */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 max-w-[85%] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Mobile Header / Top Bar */}
        <header className="md:hidden bg-white border-b border-zinc-100 h-16 px-4 flex items-center justify-between sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-zinc-950 text-sm tracking-tight">NWO Platform</span>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Lesson Main View Container */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-8 py-10 md:py-14 flex flex-col pb-32">
          {lesson ? (
            <>
              {/* Header Title */}
              <div className="mb-8">
                {lesson.moduleId && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100/50">
                    Модуль {lesson.moduleId}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-950 tracking-tight leading-tight">
                  {lesson.title}
                </h1>
              </div>

              {/* Aspect-Video Scaled Player */}
              <div className="w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 mb-10 group relative">
                {lesson.videoUrl ? (
                  <iframe
                    src={lesson.videoUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title={lesson.title}
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Play className="w-5 h-5 text-zinc-600" />
                    </div>
                    <span className="text-sm font-medium">Видео недоступно</span>
                  </div>
                )}
              </div>

              {/* Text Block - Content Focus, responsive margins/paddings and word wrapping */}
              <article className="prose prose-zinc prose-lg max-w-none text-zinc-800 break-words leading-relaxed">
                {lesson.content ? (
                  lesson.content.split('\n').map((paragraph: string, i: number) => (
                    <p key={i} className="mb-5">{paragraph}</p>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-12 text-zinc-400 gap-3">
                    <FileText className="w-8 h-8" />
                    <span className="text-sm italic">Контент урока отсутствует</span>
                  </div>
                )}
              </article>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 py-20">
              Данные урока отсутствуют
            </div>
          )}
        </main>

        {/* Navigation Bar at Bottom */}
        <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-white border-t border-zinc-100/80 backdrop-blur-md py-4 px-6 z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            
            {/* Prev Button */}
            {prevLesson ? (
              <button
                onClick={() => router.push(`/lessons?id=${prevLesson.id}`)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 font-medium text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Предыдущий</span>
              </button>
            ) : (
              <div className="w-32" /> // Spacer
            )}

            {/* Progress Dots */}
            {lessons.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {lessons.map((l: any) => (
                  <div
                    key={l.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      String(l.id) === String(currentLessonId)
                        ? 'w-6 bg-emerald-600'
                        : 'w-1.5 bg-zinc-200 hover:bg-zinc-300'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Next Button */}
            {nextLesson ? (
              <button
                onClick={() => router.push(`/lessons?id=${nextLesson.id}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-all shadow-sm shadow-emerald-600/10"
              >
                <span className="hidden sm:inline">Следующий</span> Далее
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-32" /> // Spacer
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    }>
      <LessonPageContent />
    </Suspense>
  );
}
