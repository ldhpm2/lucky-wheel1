'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===== DATA =====
  const [students, setStudents] = useState<any[]>([
    { id: 1, name: 'Lê Tuấn Anh', scores: ['-', '-', '-', '-', '-'] },
    { id: 2, name: 'Nguyễn Bá Đức Anh', scores: ['-', '-', '-', '-', '-'] },
    { id: 3, name: 'Nguyễn Gia Tuấn Anh', scores: ['7', '-', '-', '-', '-'] },
  ]);

  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [showPopup, setShowPopup] = useState(false);
  const [removeWinner, setRemoveWinner] = useState(false);

  // ===== AUDIO =====
  let audioCtx: AudioContext | null = null;
  let spinTime = 0;
  const spinDuration = 5000;

  const initAudio = () => {
    if (!audioCtx)
      audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };

  const playTick = () => {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = 1200;
    g.gain.value = 0.05;
    o.start();
    o.stop(audioCtx.currentTime + 0.05);
  };

  const playWin = () => {
    if (!audioCtx) return;
    const master = audioCtx.createGain();
    master.gain.value = 0.4;
    master.connect(audioCtx.destination);

    const note = (f: number, t: number, d: number) => {
      const o1 = audioCtx!.createOscillator();
      const o2 = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();

      o1.type = 'square';
      o2.type = 'sawtooth';
      o1.frequency.value = f;
      o2.frequency.value = f + 2;

      g.gain.setValueAtTime(0, audioCtx!.currentTime + t);
      g.gain.linearRampToValueAtTime(
        1,
        audioCtx!.currentTime + t + 0.05
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx!.currentTime + t + d
      );

      o1.connect(g);
      o2.connect(g);
      g.connect(master);

      o1.start(audioCtx!.currentTime + t);
      o2.start(audioCtx!.currentTime + t);
      o1.stop(audioCtx!.currentTime + t + d);
      o2.stop(audioCtx!.currentTime + t + d);
    };

    note(392, 0, 0.15);
    note(523, 0.15, 0.15);
    note(659, 0.3, 0.15);
    note(783, 0.45, 0.45);
    note(783, 1.05, 1.2);
  };

  const runTicks = () => {
    if (!isSpinning) return;
    playTick();

    let progress = spinTime / spinDuration;
    let delay = 30 + progress * progress * 400;
    spinTime += delay;

    if (spinTime < spinDuration) {
      setTimeout(runTicks, delay);
    }
  };

  // ===== DRAW =====
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const list = activeStudents;
    const n = list.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (n === 0) return;

    const arc = (2 * Math.PI) / n;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 20;

    const colors = ['#ff5722', '#e91e63', '#3f51b5', '#03a9f4', '#4caf50'];

    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, i * arc, (i + 1) * arc);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(list[i].name, r - 40, 10);
      ctx.restore();
    }
  };

  // ===== SPIN =====
  const spinWheel = () => {
    if (isSpinning || activeStudents.length === 0) return;

    initAudio();
    setIsSpinning(true);
    spinTime = 0;

    const spins = Math.floor(Math.random() * 5) + 6;
    const random = Math.random() * 360;
    const total = spins * 360 + random;

    const newRot = rotation + total;
    setRotation(newRot);

    runTicks();

    setTimeout(() => {
      setIsSpinning(false);

      const actual = newRot % 360;
      const pointer = (360 - actual) % 360;
      const segment = 360 / activeStudents.length;

      const index = Math.floor(pointer / segment);

      setWinner(activeStudents[index]);
      setWinnerIndex(index);
      setShowPopup(true);

      playWin();
    }, spinDuration);
  };

  // ===== SCORE =====
  const handleScore = () => {
    setShowPopup(false);

    const score = prompt(`Nhập điểm cho ${winner.name}`);
    if (score) {
      const list = [...students];
      const st = list.find(s => s.id === winner.id);
      const idx = st.scores.findIndex((x: any) => x === '-');
      if (idx !== -1) st.scores[idx] = score;
      setStudents(list);
    }

    if (removeWinner) {
      const newActive = activeStudents.filter(
        (_, i) => i !== winnerIndex
      );
      setActiveStudents(newActive);
      setRotation(0);
    }
  };

  // ===== EXCEL =====
  const importExcel = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const json: any[] = XLSX.utils.sheet_to_json(
        wb.Sheets[wb.SheetNames[0]]
      );

      let id = 1;
      const newList = json.map(row => ({
        id: id++,
        name: Object.values(row)[0],
        scores: ['-', '-', '-', '-', '-'],
      }));

      setStudents(newList);
      setActiveStudents(newList);
    };
    reader.readAsArrayBuffer(file);
  };

  const exportExcel = () => {
    const data = students.map((s, i) => ({
      STT: i + 1,
      'Họ và tên': s.name,
      TX1: s.scores[0],
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet');
    XLSX.writeFile(wb, 'data.xlsx');
  };

  const save = () => {
    localStorage.setItem('data', JSON.stringify(students));
    alert('Đã lưu');
  };

  // ===== INIT =====
  useEffect(() => {
    const saved = localStorage.getItem('data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStudents(parsed);
      setActiveStudents(parsed);
    } else setActiveStudents(students);
  }, []);

  useEffect(() => {
    drawWheel();
  }, [activeStudents]);

  // ===== UI =====
  return (
    <div style={{ padding: 20 }}>
      <h2>🎯 Vòng quay may mắn</h2>

      <button onClick={spinWheel}>QUAY</button>
      <button onClick={save}>Lưu</button>
      <button onClick={exportExcel}>Xuất Excel</button>
      <input type="file" onChange={importExcel} />

      <label>
        <input
          type="checkbox"
          checked={removeWinner}
          onChange={e => setRemoveWinner(e.target.checked)}
        />
        Loại người thắng
      </label>

      <div style={{ display: 'flex', gap: 20 }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 5s',
          }}
        />

        <table border={1}>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td>{s.name}</td>
                {s.scores.map((sc: any, j: number) => (
                  <td key={j}>{sc}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: 30,
            borderRadius: 10,
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <h2>🎉 CHÚC MỪNG</h2>
          <h1>{winner?.name}</h1>
          <button onClick={handleScore}>Tiếp tục</button>
        </div>
      )}
    </div>
  );
}
