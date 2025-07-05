
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ColoringBook, ColoringPage } from './types';
import { generateStory, generateImage } from './services/geminiService';
import Spinner from './components/Spinner';
import { MagicWandIcon, DownloadIcon, BookOpenIcon, BrushIcon, EraserIcon, TrashIcon } from './components/Icons';

// TypeScript declarations for libraries loaded from CDN
declare const html2canvas: any;
declare const jspdf: any;

const PagePlaceholder: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
    <div className="w-full aspect-square bg-slate-200 relative overflow-hidden shimmer"></div>
    <div className="p-6">
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
    </div>
  </div>
);

const colors = [
  '#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9', '#B10DC9', 
  '#F012BE', '#7FDBFF', '#39CCCC', '#3D9970', '#01FF70', '#85144b',
  '#A0522D', '#000000',
];
const brushSizes = [4, 8, 16, 32];


const InteractiveColoringPage: React.FC<{ page: ColoringPage; pageNumber: number }> = ({ page, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [selectedColor, setSelectedColor] = useState('#FF4136');
  const [selectedBrushSize, setSelectedBrushSize] = useState(8);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  const getCanvasContext = () => {
    return canvasRef.current?.getContext('2d', { willReadFrequently: true });
  }
  
  const drawImageOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx || !page.imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = page.imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => {
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = '16px Nunito';
        ctx.fillText("Error al cargar imagen", canvas.width / 2, canvas.height / 2);
    }
  }, [page.imageUrl]);

  useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const event = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0] : e.nativeEvent;
    
    // Calculate scale
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
  
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = selectedBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : selectedColor;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    e.preventDefault(); // prevent scrolling on touch devices
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    isDrawingRef.current = false;
  };
  
  return (
    <div id={`page-${pageNumber}`} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300">
      <div className="w-full aspect-square bg-slate-100">
        {page.imageUrl ? (
          <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="w-full h-full object-contain cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Spinner className="w-10 h-10 text-slate-400" />
          </div>
        )}
      </div>
      
      {page.imageUrl && (
        <div className="p-3 bg-slate-50 border-t">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 p-1 bg-slate-200 rounded-lg">
                <button onClick={() => setTool('brush')} className={`p-2 rounded-md transition ${tool === 'brush' ? 'bg-orange-400 text-white shadow' : 'hover:bg-slate-300'}`} aria-label="Pincel"><BrushIcon className="w-5 h-5"/></button>
                <button onClick={() => setTool('eraser')} className={`p-2 rounded-md transition ${tool === 'eraser' ? 'bg-orange-400 text-white shadow' : 'hover:bg-slate-300'}`} aria-label="Borrador"><EraserIcon className="w-5 h-5"/></button>
              </div>
              <div className="flex-grow"></div>
              <button onClick={drawImageOnCanvas} className="p-2 rounded-lg transition bg-red-100 text-red-700 hover:bg-red-200" aria-label="Limpiar dibujo"><TrashIcon className="w-5 h-5" /></button>
            </div>
          
            <div className="flex items-center gap-3 mb-3">
                {brushSizes.map(size => (
                  <button key={size} onClick={() => setSelectedBrushSize(size)} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 transition hover:bg-slate-300" style={{ border: selectedBrushSize === size ? '3px solid #fb923c' : '3px solid transparent' }}>
                      <span className="rounded-full" style={{ width: `${size/1.5}px`, height: `${size/1.5}px`, backgroundColor: tool === 'brush' ? '#333' : '#fff', border: tool === 'eraser' ? '1px solid #999' : 'none' }}></span>
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {colors.map(color => (
                <button key={color} onClick={() => { setTool('brush'); setSelectedColor(color); }} className="w-full aspect-square rounded-full transition-transform duration-150 transform hover:scale-110" style={{ backgroundColor: color, outlineOffset: '2px', outline: selectedColor === color && tool === 'brush' ? `2px solid ${color}` : 'none' }} aria-label={`Color ${color}`} />
                ))}
            </div>
        </div>
      )}

      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-purple-700">{page.pageTitle}</h3>
        <p className="text-base text-slate-700 mt-2">{page.description}</p>
      </div>
      <div className="p-3 bg-rose-100 border-t border-rose-200 text-center">
        <span className="text-sm font-bold text-rose-600">Página {pageNumber}</span>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<string>('');
  const [coloringBook, setColoringBook] = useState<ColoringBook | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  
  const handleGenerate = async () => {
    if (!theme.trim()) {
      setError("Por favor, introduce un tema para tu libro de colorear.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setColoringBook(null);

    try {
      setLoadingMessage("Creando tu historia única...");
      const bookStructure = await generateStory(theme);
      
      setColoringBook(bookStructure);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        generateAllImages(bookStructure);
      }, 100);

    } catch (e: any) {
      setError(e.message || "Ha ocurrido un error desconocido.");
      setIsLoading(false);
    }
  };

  const generateAllImages = useCallback(async (book: ColoringBook) => {
    setLoadingMessage(`Dibujando las ${book.pages.length} ilustraciones...`);

    const imageGenerationPromises = book.pages.map((page, i) =>
      generateImage(page.imagePrompt)
        .then(imageUrl => {
          setColoringBook(prev => {
            if (!prev) return null; // Should not happen
            const newPages = [...prev.pages];
            newPages[i] = { ...newPages[i], imageUrl };
            return { ...prev, pages: newPages };
          });
        })
        .catch(imageError => {
          console.error(`Error al generar la imagen para la página ${i + 1}:`, imageError);
          setColoringBook(prev => {
            if (!prev) return null;
            const newPages = [...prev.pages];
            newPages[i] = { ...newPages[i], imageUrl: 'error' };
            return { ...prev, pages: newPages };
          });
        })
    );

    await Promise.all(imageGenerationPromises);

    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const handleDownloadPdf = async () => {
    if (!coloringBook || !coloringBook.pages.every(p => p.imageUrl)) {
        setError("Por favor, espera a que se generen todas las imágenes antes de descargar.");
        return;
    }
    setIsPdfGenerating(true);
    setError(null);

    try {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: 'a4',
        });

        const a4Width = pdf.internal.pageSize.getWidth();
        const a4Height = pdf.internal.pageSize.getHeight();

        // --- Create and add Cover Page ---
        const coverElement = document.createElement('div');
        coverElement.style.width = `${a4Width}px`;
        coverElement.style.height = `${a4Height}px`;
        coverElement.style.backgroundColor = 'white';
        coverElement.style.display = 'flex';
        coverElement.style.flexDirection = 'column';
        coverElement.style.alignItems = 'center';
        coverElement.style.justifyContent = 'center';
        coverElement.style.padding = '20px';
        coverElement.style.fontFamily = 'Nunito, sans-serif';
        coverElement.innerHTML = `
            <div style="text-align: center; border: 5px solid #c084fc; background-color: #f5d0fe; padding: 40px; border-radius: 12px; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <h1 style="font-size: 32px; font-weight: 900; color: #581c87; margin: 0 0 16px 0; line-height: 1.2;">${coloringBook.bookTitle}</h1>
                <p style="font-size: 18px; color: #7e22ce; font-weight: 700;">Una Aventura para Colorear</p>
                <p style="font-size: 14px; color: #a855f7; margin-top: 40px;">Tema: ${theme}</p>
            </div>
        `;
        document.body.appendChild(coverElement);
        const coverCanvas = await html2canvas(coverElement, { scale: 2 });
        document.body.removeChild(coverElement);
        const coverImgData = coverCanvas.toDataURL('image/png');
        pdf.addImage(coverImgData, 'PNG', 0, 0, a4Width, a4Height);
        
        // --- Add Coloring Pages ---
        for (let i = 0; i < coloringBook.pages.length; i++) {
            pdf.addPage();
            const pageElement = document.getElementById(`page-${i + 1}`);
            if (pageElement) {
                const canvas = await html2canvas(pageElement, {
                  scale: 2, 
                  logging: false,
                  useCORS: true,
                  windowWidth: pageElement.scrollWidth,
                  windowHeight: pageElement.scrollHeight
                });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, a4Width, a4Height, undefined, 'FAST');
            }
        }

        pdf.save(`${coloringBook.bookTitle.replace(/ /g, '_')}.pdf`);

    } catch (e) {
        console.error(e);
        setError("Ocurrió un error al generar el PDF.");
    } finally {
        setIsPdfGenerating(false);
    }
  };


  return (
    <div className="min-h-screen">
      <header className="bg-rose-400 shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="w-10 h-10 text-white" />
            <h1 className="text-3xl font-black text-white" style={{fontFamily: 'Nunito, sans-serif'}}>A colorear con Ivanna</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        <div className="text-center mb-10 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border-4 border-purple-200 ring-4 ring-purple-100/50">
            <h2 className="text-4xl sm:text-5xl font-black text-purple-700 mb-3" style={{ textShadow: '2px 2px 0px #fff, 4px 4px 0px #e9d5ff' }}>
              ¡Hola, Artista!
            </h2>
            <p className="text-xl text-slate-800 leading-relaxed max-w-2xl mx-auto">
              ¿Listo para crear un libro mágico para colorear? ¡Es súper fácil! Solo escribe tu idea en la cajita de abajo y yo dibujaré una aventura increíble para ti.
            </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8 max-w-3xl mx-auto border-4 border-rose-200">
          <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">¡Cuéntame tu idea secreta!</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ej: gatitos astronautas buscando planetas de queso"
              className="flex-grow p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-lg text-center sm:text-left"
              disabled={isLoading}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !theme}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-orange-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-orange-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-5 h-5" />
                  <span>{loadingMessage || 'Creando Magia...'}</span>
                </>
              ) : (
                <>
                  <MagicWandIcon className="w-6 h-6" />
                  <span>Crear mi Libro</span>
                </>
              )}
            </button>
          </div>
          {error && <p className="text-red-600 mt-4 font-semibold text-center">{error}</p>}
        </div>

        <div ref={resultsRef}>
          {coloringBook && (
            <div className="bg-rose-100/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-4xl font-black text-purple-800 tracking-tight">{coloringBook.bookTitle}</h2>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating || isLoading || !coloringBook.pages.every(p => p.imageUrl)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200  transform hover:scale-105"
                >
                  {isPdfGenerating ? (
                    <>
                      <Spinner className="w-5 h-5" />
                      <span>Creando PDF...</span>
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="w-5 h-5" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {coloringBook.pages.map((page, index) => (
                  <InteractiveColoringPage key={index} page={page} pageNumber={index + 1} />
                ))}
              </div>
            </div>
          )}
          {isLoading && !coloringBook && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, index) => <PagePlaceholder key={index} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
