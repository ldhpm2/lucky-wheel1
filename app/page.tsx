"use client";
import { useEffect, useRef, useState } from "react";

// ✅ Khai báo kiểu dữ liệu
type Student = {
  id: number;
  name: string;
  scores: string[];
};

export default function Page() {
  // ✅ Fix lỗi TypeScript
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Lê Tuấn Anh", scores: ["-", "-", "-", "-", "-"] },
    { id: 2, name: "Nguyễn Bá Đức Anh", scores: ["-", "-", "-", "-", "-"] },
  ]);

  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Student | null>(null);

  const colors = [
    "#FF5722","#E91E63","#9C27B0","#673AB7","#3F51B5",
    "#2196F3","#03A9F4","#00BCD4","#009688","#4CAF50"
  ];

  // 🎡 Vẽ vòng quay
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const num = activeStudents.length;
    if (num === 0) return;

    const arc = (2 * Math.PI) / num;
    const center = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    activeStudents.forEach((s, i) => {
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, center - 10, i * arc, (i + 1) * arc);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      // ✏️ Viết tên
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "right";
      ctx.fillText(s.name, center - 20, 10);
      ctx.restore();
    });
  };

  // Load danh sách
  useEffect(() => {
    setActiveStudents(students);
  }, [students]);

  // Vẽ lại khi đổi danh sách
  useEffect(() => {
    drawWheel();
  }, [activeStudents]);

  // 🎯 Quay vòng
  const spinWheel = () => {
    if (isSpinning || activeStudents.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    const spins = Math.floor(Math.random() * 5) + 5;
    const randomDeg = Math.random() * 360;
    const total = spins * 360 + randomDeg;

    const newRotation = rotation + total;
    setRotation(newRotation);

    setTimeout(() => {
      const actual = newRotation % 360;
      const pointer = (360 - actual) % 360;
      const segment = 360 / activeStudents.length;

      const index = Math.floor(pointer / segment);
      setWinner(activeStudents[index]);
      setIsSpinning(false);
    }, 5000);
  };

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>🎡 Vòng quay may mắn</h1>

      <button
        onClick={spinWheel}
        style={{
          padding: "10px 20px",
          fontSize: 18,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        QUAY
      </button>

      {winner && (
        <h2 style={{ color: "red" }}>
          🎉 Người trúng: {winner.name}
        </h2>
      )}

      <div>
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          style={{
            borderRadius: "50%",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 5s ease-out",
          }}
        />
      </div>
    </div>
  );
}