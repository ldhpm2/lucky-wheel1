"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

type Student = {
  name: string;
  scores: string[];
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [students, setStudents] = useState<Student[]>([
    { name: "Lê Tuấn Anh", scores: ["-", "-", "-", "-", "-"] },
    { name: "Nguyễn Bá Đức Anh", scores: ["-", "-", "-", "-", "-"] },
    { name: "Nguyễn Gia Tuấn Anh", scores: ["7", "-", "-", "-", "-"] },
    { name: "Tạ Thị Vân Anh", scores: ["-", "-", "-", "-", "-"] },
    { name: "Trịnh Phương Anh", scores: ["-", "-", "-", "-", "-"] },
    { name: "Vũ Đức Trọng", scores: ["-", "-", "-", "-", "-"] },
    { name: "Hoàng Anh Tuấn", scores: ["-", "-", "-", "-", "-"] },
  ]);

  const [winner, setWinner] = useState<number | null>(null);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const colors = ["#ff5722", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4"];

  // 🎡 DRAW WHEEL
  const drawWheel = (ctx: CanvasRenderingContext2D) => {
    const size = 400;
    const radius = size / 2;
    const arc = (2 * Math.PI) / students.length;

    ctx.clearRect(0, 0, size, size);

    students.forEach((s, i) => {
      const start = i * arc + angle;
      const end = start + arc;

      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 10, start, end);
      ctx.fill();

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(start + arc / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(s.name, radius - 20, 5);
      ctx.restore();
    });
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && students.length > 0) drawWheel(ctx);
  }, [angle, students]);

  // 🎯 SPIN
  const spin = () => {
    if (spinning || students.length === 0) return;

    setSpinning(true);
    let velocity = Math.random() * 0.3 + 0.3;

    const animate = () => {
      setAngle((prev) => {
        const newAngle = prev + velocity;
        velocity *= 0.97;

        if (velocity < 0.002) {
          const arc = (2 * Math.PI) / students.length;
          const index =
            students.length -
            Math.floor(((newAngle % (2 * Math.PI)) / arc)) -
            1;

          setWinner(index);
          setSpinning(false);
          return newAngle;
        }

        requestAnimationFrame(animate);
        return newAngle;
      });
    };

    animate();
  };

  // ❌ REMOVE WINNER
  const removeWinner = () => {
    if (winner === null) return;
    const newList = students.filter((_, i) => i !== winner);
    setStudents(newList);
    setWinner(null);
  };

  // 💾 SAVE LOCAL
  const saveData = () => {
    localStorage.setItem("students", JSON.stringify(students));
    alert("Đã lưu!");
  };

  // 📂 LOAD LOCAL
  useEffect(() => {
    const data = localStorage.getItem("students");
    if (data) setStudents(JSON.parse(data));
  }, []);

  // 📥 IMPORT EXCEL
  const importExcel = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const newStudents = json.map((row: any) => ({
        name: row["HỌ VÀ TÊN"] || row["name"],
        scores: ["-", "-", "-", "-", "-"],
      }));

      setStudents(newStudents);
    };

    reader.readAsBinaryString(file);
  };

  // 📤 EXPORT EXCEL
  const exportExcel = () => {
    const data = students.map((s, i) => ({
      STT: i + 1,
      "HỌ VÀ TÊN": s.name,
      TX1: s.scores[0],
      TX2: s.scores[1],
      TX3: s.scores[2],
      TX4: s.scores[3],
      TX5: s.scores[4],
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    XLSX.writeFile(wb, "students.xlsx");
  };

  return (
    <div className="p-4">
      {/* BUTTONS */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button onClick={spin} className="bg-blue-500 text-white px-4 py-2 rounded">
        ▶ QUAY NGAY!</button>
            <div class="toggle-container">
                <input type="checkbox" id="removeWinnerCheck">
                <label for="removeWinnerCheck">LOẠI BỎ NGƯỜI THẮNG</label>
            </div>
            <input type="file" id="excelInput" style="display: none;" accept=".xlsx, .xls" onchange="importExcel(event)">
            <button onclick="document.getElementById('excelInput').click()">↑ NHẬP EXCEL</button>
            <button onclick="saveData()">💾 LƯU TRÌNH DUYỆT</button>
            <button onclick="exportExcel()">↓ XUẤT EXCEL</button>
        </div>
    </div>

    <div class="main-container">
        <div class="wheel-section">
            <div class="wheel-container">
                <div class="pointer"></div>
                <div class="center-circle"></div>
                
                <div id="winnerOverlay" class="winner-overlay">
                    <div class="trophy-icon">🎉</div>
                    <h2>CHÚC MỪNG CHIẾN THẮNG</h2>
                    <div class="winner-name" id="winnerNameDisplay">Tên Học Sinh</div>
                    <button class="btn-continue" onclick="handleScoreInput()">TIẾP TỤC & NHẬP ĐIỂM</button>
                </div>

                <canvas id="wheelCanvas" width="1000" height="1000"></canvas>
            </div>
        </div>

        <div class="table-section">
            <div class="table-header">
                <h3>DANH SÁCH HỌC SINH & ĐIỂM SỐ</h3>
                <span style="color: #4caf50; font-size: 12px;">● ĐANG HOẠT ĐỘNG</span>
            </div>
            <div class="table-wrapper">
                <table id="scoreTable">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>HỌ VÀ TÊN</th>
                            <th>TX1</th>
                            <th>TX2</th>
                            <th>TX3</th>
                            <th>TX4</th>
                            <th>TX5</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
        </div>
    </div>

  );
}
