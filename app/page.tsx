"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { Upload, Play, Save, Info, Trash2, UserPlus, Trophy, Download, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

interface Student {
  id: number;
  name: string;
  scores: (number | string)[];
}

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
  '#FF6384', '#C9CBCF', '#7BC225', '#B2D732', '#666666', '#22AA99',
  '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6',
  '#3B3EAC', '#B77322', '#16D620', '#B91383', '#F4359E', '#9C5935',
  '#A9C413', '#2A778D', '#668D1C', '#BEA413', '#0C5922', '#743411'
];

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [rotation, setRotation] = useState(0);
  const [removeWinner, setRemoveWinner] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<{ rotation: number }>({ rotation: 0 });
  const audioTickRef = useRef<HTMLAudioElement | null>(null);
  const audioWinRef = useRef<HTMLAudioElement | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('lucky_wheel_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.students) setStudents(parsed.students);
        if (parsed.showTable) setShowTable(parsed.showTable);
      } catch (e) {
        console.error('Failed to load saved data', e);
      }
    }

    audioTickRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
    audioWinRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audioTickRef.current.volume = 1.0;
    audioWinRef.current.volume = 1.0;
    
    // Preload sounds
    audioTickRef.current.load();
    audioWinRef.current.load();
  }, []);

  const saveToLocalStorage = () => {
    const data = {
      students,
      showTable
    };
    localStorage.setItem('lucky_wheel_data', JSON.stringify(data));
    setSaveMessage('Đã lưu điểm thành công!');
    setTimeout(() => setSaveMessage(''), 3000);
    
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.9, x: 0.8 }
    });
  };

  const downloadExcel = () => {
    if (students.length === 0) return;

    const header = ['STT', 'Họ và tên', 'KTTX 1', 'KTTX 2', 'KTTX 3', 'KTTX 4', 'KTTX 5'];
    const rows = students.map((s, i) => [
      i + 1,
      s.name,
      ...s.scores
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách điểm');
    
    // Auto-size columns
    const maxWidths = header.map((h, i) => {
      let max = h.length;
      rows.forEach(row => {
        const cellValue = String(row[i] || '');
        if (cellValue.length > max) max = cellValue.length;
      });
      return { wch: max + 2 };
    });
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, 'Danh_sach_diem_hoc_sinh.xlsx');
  };

  // Draw the wheel
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    const activeStudents = students;
    const sliceAngle = (2 * Math.PI) / (activeStudents.length || 1);

    activeStudents.forEach((student, i) => {
      const startAngle = i * sliceAngle + wheelRef.current.rotation;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 24px Arial';
      
      // Truncate name if too long
      let displayName = student.name;
      if (displayName.length > 25) displayName = displayName.substring(0, 22) + '...';
      
      ctx.fillText(displayName, radius - 15, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();

    // Draw pointer (triangle on the right pointing inwards)
    ctx.beginPath();
    ctx.moveTo(size - 55, centerY); // Tip pointing left
    ctx.lineTo(size - 5, centerY - 25); // Base right
    ctx.lineTo(size - 5, centerY + 25); // Base right
    ctx.closePath();
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [students]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const spin = () => {
    if (spinning || students.length === 0) return;

    setSpinning(true);
    setWinner(null);

    const spinDuration = 5000;
    const startRotation = wheelRef.current.rotation;
    const extraSpins = 5 + Math.random() * 5;
    const targetRotation = startRotation + extraSpins * 2 * Math.PI;
    const startTime = performance.now();
    let lastSliceIndex = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress;
      wheelRef.current.rotation = currentRotation;
      drawWheel();

      // Play tick sound when passing a slice
      if (students.length > 0) {
        const sliceAngle = (2 * Math.PI) / students.length;
        const currentSliceIndex = Math.floor((currentRotation % (2 * Math.PI)) / sliceAngle);
        
        if (currentSliceIndex !== lastSliceIndex) {
          if (audioTickRef.current) {
            audioTickRef.current.currentTime = 0;
            audioTickRef.current.play().catch(() => {}); // Ignore errors if browser blocks autoplay
          }
          lastSliceIndex = currentSliceIndex;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        
        // Calculate winner
        const totalRotation = wheelRef.current.rotation % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / students.length;
        
        // The pointer is at 0 radians (right side)
        let normalizedRotation = (2 * Math.PI - totalRotation) % (2 * Math.PI);
        if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
        
        const winnerIndex = Math.floor(normalizedRotation / sliceAngle) % students.length;
        const selectedWinner = students[winnerIndex];
        setWinner(selectedWinner);
        
        // Play win sound
        if (audioWinRef.current) {
          audioWinRef.current.currentTime = 0;
          audioWinRef.current.play().catch(() => {});
        }

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });

        if (removeWinner) {
          setTimeout(() => {
            setStudents(prev => prev.filter(s => s.id !== selectedWinner.id));
          }, 2000);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length === 0) return;

      // Find the header row and name column index
      let nameColIndex = 0;
      let startRowIndex = 1;
      
      const nameKeywords = ['họ và tên', 'họ tên', 'tên', 'name', 'full name'];
      
      // Look through the first 10 rows to find headers
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row) continue;
        
        const foundIndex = row.findIndex(cell => 
          typeof cell === 'string' && nameKeywords.some(kw => cell.toLowerCase().includes(kw))
        );
        
        if (foundIndex !== -1) {
          nameColIndex = foundIndex;
          startRowIndex = i + 1;
          break;
        }
      }

      // If we didn't find a header, try to guess: 
      // Often column 0 is STT, column 1 is Name
      if (startRowIndex === 1 && nameColIndex === 0 && data[0]) {
        const firstRow = data[0];
        // If first cell is a number or "STT", name is likely in second cell
        if (typeof firstRow[0] === 'number' || (typeof firstRow[0] === 'string' && firstRow[0].toLowerCase() === 'stt')) {
          nameColIndex = 1;
        }
      }

      const newStudents: Student[] = data.slice(startRowIndex)
        .map((row, index) => {
          const name = String(row[nameColIndex] || '').trim();
          if (!name) return null;
          
          // Scores are usually the columns following the name
          const scores = [];
          for (let i = 1; i <= 5; i++) {
            scores.push(row[nameColIndex + i] || '');
          }
          
          return {
            id: index + 1,
            name: name,
            scores: scores
          };
        })
        .filter((s): s is Student => s !== null);

      if (newStudents.length > 0) {
        setStudents(newStudents);
        setShowTable(true);
      }
    };
    reader.readAsBinaryString(file);
  };

  const updateScore = (studentId: number, scoreIndex: number, value: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId 
        ? { ...s, scores: s.scores.map((score, i) => i === scoreIndex ? value : score) }
        : s
    ));
  };

  const generateWithAI = async () => {
    if (generating) return;
    setGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a list of 10 sample Vietnamese student names for a lucky wheel app. Return ONLY a JSON array of strings.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const names = JSON.parse(response.text || "[]");
      if (Array.isArray(names)) {
        const newStudents: Student[] = names.map((name, i) => ({
          id: Date.now() + i,
          name: name,
          scores: ['', '', '', '', '']
        }));
        setStudents(prev => [...prev, ...newStudents]);
        setShowTable(true);
        
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI Generation failed. Please check your API key.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
      {/* Developer Credit Bar */}
      <div className="bg-blue-600 text-white py-1.5 px-4 text-center">
        <p className="text-[10px] md:text-xs font-medium tracking-wider uppercase opacity-90">
          Phát triển bởi Lương Đình Hùng - Zalo: 0986282414 © 2026
        </p>
      </div>

      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-800 uppercase">Vòng Quay May Mắn</h1>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Quản lý điểm KTTX</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={spin}
              disabled={spinning || students.length === 0}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 md:px-6 py-2 rounded-xl shadow-indigo-200 shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>QUAY NGAY!</span>
            </button>

            <button 
              onClick={generateWithAI}
              disabled={generating}
              className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-bold text-xs uppercase tracking-wider"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>AI Generate</span>
            </button>

            <label className="flex items-center space-x-2 bg-white border border-neutral-200 px-2 md:px-3 py-2 rounded-xl shadow-sm hover:bg-neutral-50 transition-all cursor-pointer">
              <div className={`w-8 h-4 rounded-full transition-colors relative ${removeWinner ? 'bg-indigo-600' : 'bg-neutral-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${removeWinner ? 'left-4.5' : 'left-0.5'}`} />
              </div>
              <span className="hidden sm:block text-[10px] font-bold text-neutral-600 uppercase tracking-tight whitespace-nowrap">Loại bỏ người thắng</span>
              <input type="checkbox" checked={removeWinner} onChange={(e) => setRemoveWinner(e.target.checked)} className="hidden" />
            </label>

            <label className="hidden md:flex items-center space-x-2 bg-neutral-100 border border-neutral-200 px-4 py-2 rounded-xl hover:bg-neutral-200 cursor-pointer transition-all font-bold text-xs uppercase tracking-wider text-neutral-600">
              <Upload className="w-4 h-4" />
              <span>Tải File Excel</span>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </label>

            <button 
              onClick={saveToLocalStorage}
              className="hidden md:flex items-center space-x-2 bg-white border border-neutral-200 px-4 py-2 rounded-xl shadow-sm hover:bg-neutral-50 transition-all font-bold text-xs uppercase tracking-wider text-neutral-600 relative"
            >
              <Save className="w-4 h-4" />
              <span>Lưu điểm</span>
              <AnimatePresence>
                {saveMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -40 }}
                    exit={{ opacity: 0 }}
                    className="absolute whitespace-nowrap bg-emerald-500 text-white text-[10px] py-1 px-2 rounded shadow-lg left-1/2 -translate-x-1/2"
                  >
                    {saveMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={downloadExcel}
              disabled={students.length === 0}
              className="hidden md:flex items-center space-x-2 bg-white border border-neutral-200 px-4 py-2 rounded-xl shadow-sm hover:bg-neutral-50 disabled:opacity-50 transition-all font-bold text-xs uppercase tracking-wider text-neutral-600"
            >
              <Download className="w-4 h-4" />
              <span>Tải về</span>
            </button>

            <button 
              onClick={() => setShowAbout(!showAbout)}
              className="flex items-center space-x-2 bg-white border border-neutral-200 px-4 py-2 rounded-xl shadow-sm hover:bg-neutral-50 transition-all font-bold text-xs uppercase tracking-wider text-neutral-600"
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Wheel (Sticky on Desktop) */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="lg:sticky lg:top-28 space-y-3">
            <div className="relative bg-white p-4 md:p-6 rounded-3xl shadow-xl border border-neutral-200 flex justify-center">
              <canvas 
                ref={canvasRef} 
                width={780} 
                height={780} 
                className="w-full max-w-[730px] h-auto cursor-pointer"
                onClick={spin}
              />
              
              <AnimatePresence>
                {winner && !spinning && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none p-4"
                  >
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border-4 border-yellow-400 text-center max-w-full">
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <h2 className="text-xl font-black text-neutral-800 mb-1 uppercase tracking-tight">CHÚC MỪNG!</h2>
                      <p className="text-2xl font-black text-indigo-600 break-words">{winner.name}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Danh sách học sinh & Điểm số</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Đang hoạt động</span>
            </div>
          </div>

          {showTable && (
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50/50 border-b border-neutral-200">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-r border-neutral-200 w-12 text-center">#</th>
                      <th className="p-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-r border-neutral-200" style={{ width: '6cm', minWidth: '6cm' }}>Họ và tên</th>
                      {[1, 2, 3, 4, 5].map(i => (
                        <th key={i} className="p-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-r border-neutral-200 text-center w-14">KTTX {i}</th>
                      ))}
                      <th className="p-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="p-4 text-xs font-bold text-neutral-400 border-r border-neutral-100 text-center">{idx + 1}</td>
                        <td className="p-4 text-sm font-bold text-neutral-800 border-r border-neutral-100 truncate" style={{ width: '6cm', minWidth: '6cm', maxWidth: '6cm' }} title={student.name}>{student.name}</td>
                        {student.scores.map((score, sIdx) => (
                          <td key={sIdx} className="p-1 border-r border-neutral-100">
                            <input 
                              type="text" 
                              value={score}
                              onChange={(e) => updateScore(student.id, sIdx, e.target.value)}
                              className="w-full text-center p-2 text-sm font-medium bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg transition-all"
                              placeholder="-"
                            />
                          </td>
                        ))}
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setStudents(prev => prev.filter(s => s.id !== student.id))}
                            className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-20 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="bg-neutral-100 p-4 rounded-full">
                              <UserPlus className="w-8 h-8 text-neutral-300" />
                            </div>
                            <p className="text-sm text-neutral-400 font-medium italic">
                              Chưa có danh sách học sinh. Hãy tải file Excel hoặc thêm thủ công.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Add Student Row */}
              <div className="p-6 bg-neutral-50/50 border-t border-neutral-200 mt-auto">
                <button 
                  onClick={() => setStudents(prev => [...prev, { id: Date.now(), name: 'Học sinh mới', scores: ['', '', '', '', ''] }])}
                  className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-neutral-300 rounded-2xl text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all font-bold text-sm uppercase tracking-widest"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Thêm học sinh mới</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              >
                <Trash2 className="w-6 h-6 rotate-45" />
              </button>
              <h2 className="text-2xl font-black mb-4 text-indigo-600">Vòng Quay May Mắn</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>Ứng dụng hỗ trợ giáo viên trong việc gọi tên học sinh ngẫu nhiên và quản lý điểm số thường xuyên (KTTX).</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Nhập danh sách từ file Excel (.xlsx)</li>
                  <li>Vòng quay mượt mà với hiệu ứng vật lý</li>
                  <li>Tự động loại bỏ người đã trúng (tùy chọn)</li>
                  <li>Quản lý 5 cột điểm KTTX</li>
                  <li>Giao diện hiện đại, dễ sử dụng</li>
                </ul>
                <p className="text-sm pt-4 border-t border-neutral-100">Phiên bản 1.0.0 - Phát triển bởi AI Studio</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
