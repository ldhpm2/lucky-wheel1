"use client";

import { useEffect, useRef, useState } from "react";

const students = [
  "Lê Tuấn Anh",
  "Nguyễn Bá Đức Anh",
  "Nguyễn Gia Tuấn Anh",
  "Tạ Thị Vân Anh",
  "Trịnh Phương Anh",
  "Vũ Đức Trọng",
  "Hoàng Anh Tuấn",
];

const colors = [
  "#ff5722",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
];

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const drawWheel = (ctx: CanvasRenderingContext2D) => {
    const size = 400;
    const radius = size / 2;
    const arc = (2 * Math.PI) / students.length;

    ctx.clearRect(0, 0, size, size);

    students.forEach((name, i) => {
      const start = i * arc + angle;
      const end = start + arc;

      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 10, start, end);
      ctx.fill();

      // text
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(start + arc / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(name, radius - 20, 5);
      ctx.restore();
    });

    // center
    ctx.beginPath();
    ctx.arc(radius, radius, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#eee";
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawWheel(ctx);
  }, [angle]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);

    let velocity = Math.random() * 0.3 + 0.3;

    const animate = () => {
      setAngle((prev) => {
        const newAngle = prev + velocity;
        velocity *= 0.97;

        if (velocity < 0.002) {
          setSpinning(false);
          return newAngle;
        }

        requestAnimationFrame(animate);
        return newAngle;
      });
    };

    animate();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* HEADER */}
      <div className="bg-blue-600 text-white text-center py-2 rounded-md mb-4 text-sm">
        PHÁT TRIỂN BỞI THẦY LƯƠNG ĐÌNH HÙNG ZALO 0986 282 414 © 2026
      </div>

      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🏆 VÒNG QUAY MAY MẮN
        </h1>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={spin}
            className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow"
          >
            ▶ QUAY NGAY!
          </button>

          <button className="bg-white px-3 py-2 rounded shadow">
            ⬜ LOẠI BỎ NGƯỜI THẮNG
          </button>

          <button className="bg-white px-3 py-2 rounded shadow">
            ⬆ NHẬP EXCEL
          </button>

          <button className="bg-white px-3 py-2 rounded shadow">
            💾 LƯU TRÌNH DUYỆT
          </button>

          <button className="bg-white px-3 py-2 rounded shadow">
            ⬇ XUẤT EXCEL
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WHEEL */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-center items-center relative">
          <canvas ref={canvasRef} width={400} height={400} />

          {/* Pointer */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[20px] border-t-transparent border-b-transparent border-l-black"></div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">DANH SÁCH HỌC SINH & ĐIỂM SỐ</h2>
            <span className="text-green-500 text-sm">● ĐANG HOẠT ĐỘNG</span>
          </div>

          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2 text-left">HỌ VÀ TÊN</th>
                <th className="border p-2">TX1</th>
                <th className="border p-2">TX2</th>
                <th className="border p-2">TX3</th>
                <th className="border p-2">TX4</th>
                <th className="border p-2">TX5</th>
              </tr>
            </thead>
            <tbody>
              {students.map((name, i) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2">{name}</td>
                  <td className="border p-2 text-center">
                    {i === 2 ? "7" : "-"}
                  </td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
