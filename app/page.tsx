"use client";

import { useEffect, useRef, useState } from "react";

type Student = {
  id: number;
  name: string;
  scores: string[];
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Lê Tuấn Anh", scores: ["-", "-", "-", "-", "-"] },
    { id: 2, name: "Nguyễn Bá Đức Anh", scores: ["-", "-", "-", "-", "-"] },
    { id: 3, name: "Nguyễn Gia Tuấn Anh", scores: ["7", "-", "-", "-", "-"] },
  ]);

  const [activeStudents, setActiveStudents] = useState<Student[]>(students);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Student | null>(null);

  // 🎯 Vẽ vòng quay
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const num = activeStudents.length;
    if (num === 0) return;

    const radius = canvas.width / 2;
    const arc = (2 * Math.PI) / num;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    activeStudents.forEach((s, i) => {
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 10, i * arc, (i + 1) * arc);
      ctx.fillStyle = `hsl(${i * 40}, 70%, 60%)`;
      ctx.fill();

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px Arial";
      ctx.fillText(s.name, radius - 50, 0);
      ctx.restore();
    });
  };

  useEffect(() => {
    drawWheel();
  }, [activeStudents]);

  // 🎯 Quay
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    const spins = 5 + Math.random() * 5;
    const deg = spins * 360;
    const newRotation = rotation + deg;

    setRotation(newRotation);

    setTimeout(() => {
      const index = Math.floor(Math.random() * activeStudents.length);
      setWinner(activeStudents[index]);
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* HEADER */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm font-bold">
        PHÁT TRIỂN BỞI THẦY LƯƠNG ĐÌNH HÙNG
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-4 shadow">
        <h1 className="text-xl font-bold">🎡 Vòng quay may mắn</h1>

        <button
          onClick={spinWheel}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          ▶ Quay ngay
        </button>
      </div>

      {/* MAIN */}
      <div className="flex gap-6 mt-4">
        {/* VÒNG QUAY */}
        <div className="flex-1 flex justify-center items-center bg-white p-4 rounded shadow">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="rounded-full transition-transform duration-[3000ms]"
              style={{ transform: `rotate(${rotation}deg)` }}
            />

            <div className="absolute top-1/2 right-[-20px] w-0 h-0 border-t-[20px] border-b-[20px] border-r-[30px] border-transparent border-r-black"></div>
          </div>
        </div>

        {/* BẢNG */}
        <div className="w-[400px] bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-3">Danh sách</h2>

          <table className="w-full text-sm border">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th>TX1</th>
                <th>TX2</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="border-t text-center">
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.scores[0]}</td>
                  <td>{s.scores[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WINNER */}
      {winner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded text-center">
            <h2 className="text-xl font-bold text-red-500">🎉 Trúng!</h2>
            <p className="text-2xl font-bold mt-2">{winner.name}</p>

            <button
              onClick={() => setWinner(null)}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
