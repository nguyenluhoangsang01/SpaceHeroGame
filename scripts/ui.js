let currentSelectedOptions = [];
let cooldownTimer = false;
let currentActiveObject = null;

// ================= HỆ THỐNG DỮ LIỆU HỌC SINH TỰ ĐỘNG =================
window.STUDENT_DATA = {};
window.currentPlayer = null;
window.isScoreSaved = false;

// 🌟 ĐÃ CẬP NHẬT LINK API MỚI NHẤT CỦA BẠN:
const MASTER_API_URL =
  "https://script.google.com/macros/s/AKfycbxWgRpcx4bYeK_CfdBi6u1p0PSLyj4b980pU1b-mi3bHw1uZ5UjTrI-3AFn71Gl8K7S4Q/exec?key=thdd@123";

// 1. Hàm tự động tải dữ liệu học sinh
window.fetchLiveStudentData = async function () {
  const schoolSelect = document.getElementById("select-school");
  const classSelect = document.getElementById("select-class");
  const studentSelect = document.getElementById("select-student");

  if (!schoolSelect) {
    console.log(
      "❌ LỖI: Không tìm thấy ô chọn trường (id='select-school') trong HTML!",
    );
    return;
  }

  // Ép trình duyệt nhận diện thao tác click
  schoolSelect.onchange = window.populateClasses;
  if (classSelect) classSelect.onchange = window.populateStudents;
  if (studentSelect) studentSelect.onchange = window.selectStudent;

  try {
    const response = await fetch(MASTER_API_URL + "&action=getStudents");
    const result = await response.json();

    if (result.status === "success") {
      window.STUDENT_DATA = result.data;
      schoolSelect.innerHTML = '<option value="">-- Chọn Trường --</option>';

      let validSchoolCount = 0;
      Object.keys(window.STUDENT_DATA).forEach((school) => {
        if (Object.keys(window.STUDENT_DATA[school]).length > 0) {
          schoolSelect.innerHTML += `<option value="${school}">${school}</option>`;
          validSchoolCount++;
        }
      });

      if (validSchoolCount === 0) {
        schoolSelect.innerHTML =
          '<option value="">-- Danh sách trống! --</option>';
      }
    } else {
      schoolSelect.innerHTML =
        '<option value="">-- Lỗi tải dữ liệu --</option>';
      console.log("❌ Lỗi từ Backend:", result.msg);
    }
  } catch (err) {
    schoolSelect.innerHTML = '<option value="">-- Lỗi mạng / CORS --</option>';
    console.error("❌ Lỗi hệ thống:", err);
  }
};

// 2. Logic Chọn Trường -> Hiện Lớp
window.populateClasses = function () {
  const school = document.getElementById("select-school").value;
  const classSelect = document.getElementById("select-class");
  const studentSelect = document.getElementById("select-student");
  const btnHistory = document.getElementById("btn-view-history");

  classSelect.innerHTML = '<option value="">-- Chọn Lớp --</option>';
  studentSelect.innerHTML = '<option value="">-- Chọn Họ & Tên --</option>';
  classSelect.disabled = true;
  studentSelect.disabled = true;
  window.currentPlayer = null;

  // 🌟 SỬA LỖI Ở ĐÂY: Ẩn nút lịch sử và ép các thẻ OT xám mờ lại ngay lập tức
  if (btnHistory) btnHistory.style.display = "none";
  document
    .querySelectorAll(".level-card:not(.locked)")
    .forEach((card) => card.classList.add("waiting-info"));

  if (school && window.STUDENT_DATA[school]) {
    const sortedClasses = Object.keys(window.STUDENT_DATA[school]).sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true }),
    );
    sortedClasses.forEach((cls) => {
      classSelect.innerHTML += `<option value="${cls}">Lớp ${cls}</option>`;
    });
    classSelect.disabled = false;
  }
};

// 3. Logic Chọn Lớp -> Hiện Học Sinh
window.populateStudents = function () {
  const school = document.getElementById("select-school").value;
  const cls = document.getElementById("select-class").value;
  const studentSelect = document.getElementById("select-student");
  const btnHistory = document.getElementById("btn-view-history");

  studentSelect.innerHTML = '<option value="">-- Chọn Họ & Tên --</option>';
  window.currentPlayer = null;

  // 🌟 SỬA LỖI Ở ĐÂY: Ẩn nút lịch sử và ép các thẻ OT xám mờ lại ngay lập tức
  if (btnHistory) btnHistory.style.display = "none";
  document
    .querySelectorAll(".level-card:not(.locked)")
    .forEach((card) => card.classList.add("waiting-info"));

  if (cls && window.STUDENT_DATA[school][cls]) {
    window.STUDENT_DATA[school][cls].forEach((st) => {
      studentSelect.innerHTML += `<option value="${st.id}">${st.id} - ${st.name}</option>`;
    });
    studentSelect.disabled = false;
  } else {
    studentSelect.disabled = true;
  }
};

// Biến toàn cục để theo dõi xem có đang quét lịch sử không
window.isScanningHistory = false;

// 4. Logic chốt Học sinh & Tự động quét xem có lịch sử chưa
window.selectStudent = async function () {
  const school = document.getElementById("select-school").value;
  const cls = document.getElementById("select-class").value;
  const stSelect = document.getElementById("select-student");
  const stId = stSelect.value;
  const btnHistory = document.getElementById("btn-view-history");

  if (btnHistory) btnHistory.style.display = "none";

  if (stId) {
    const student = window.STUDENT_DATA[school][cls].find((s) => s.id == stId);
    window.currentPlayer = {
      school: school,
      lop: cls,
      id: student.id,
      fullname: student.name,
    };

    // Bật cờ báo hiệu đang quét
    window.isScanningHistory = true;

    // 🛑 BƯỚC KHÓA GIAO DIỆN: Khóa thanh chọn và Khóa tất cả các thẻ OT thành màu xám
    stSelect.disabled = true;
    stSelect.style.cursor = "not-allowed";
    const originalText = stSelect.options[stSelect.selectedIndex].text;
    stSelect.options[stSelect.selectedIndex].text = "⏳ Đang quét lịch sử...";

    // Đánh dấu các thẻ OT là waiting-info để làm mờ
    document
      .querySelectorAll(".level-card:not(.locked)")
      .forEach((card) => card.classList.add("waiting-info"));

    const checkUrl = `${MASTER_API_URL}&action=checkHasScore&school=${encodeURIComponent(school)}&lop=${encodeURIComponent(cls)}&id=${encodeURIComponent(stId)}`;

    try {
      const response = await fetch(checkUrl);
      const result = await response.json();

      if (result.status === "success" && result.hasScore) {
        if (btnHistory) btnHistory.style.display = "block";
      }
    } catch (err) {
      console.log("Lỗi quét lịch sử:", err);
    } finally {
      // ✅ BƯỚC MỞ KHÓA GIAO DIỆN: Quét xong rồi (Dù lỗi hay không cũng phải mở ra cho học sinh thi)
      window.isScanningHistory = false;
      stSelect.options[stSelect.selectedIndex].text = originalText;
      stSelect.disabled = false;
      stSelect.style.cursor = "pointer";

      // Vén bức màn: Bỏ màu xám mờ, kích hoạt hiệu ứng phát sáng cho các thẻ OT
      document
        .querySelectorAll(".level-card:not(.locked)")
        .forEach((card) => card.classList.remove("waiting-info"));
    }
  } else {
    // Nếu học sinh đổi ý, click quay lại "-- Chọn Học Sinh --"
    window.currentPlayer = null;
    window.isScanningHistory = false;

    // Giấu nút lịch sử và Bắt buộc Khóa mờ lại các thẻ OT
    if (btnHistory) btnHistory.style.display = "none";
    document
      .querySelectorAll(".level-card:not(.locked)")
      .forEach((card) => card.classList.add("waiting-info"));
  }
};

// Tính năng Xem Lịch sử (Đã tích hợp thuật toán Sắp xếp Kép)
window.showHistory = async function () {
  if (!window.currentPlayer) return;

  const modal = document.getElementById("history-modal");
  const content = document.getElementById("history-content");
  const btnHistory = document.getElementById("btn-view-history");

  // 🛑 CHẶN BẤM NHIỀU LẦN: Khóa nút ngay khi vừa bấm
  if (btnHistory) {
    btnHistory.disabled = true;
    btnHistory.innerHTML = "⏳ ĐANG TẢI...";
    btnHistory.style.opacity = "0.5";
    btnHistory.style.cursor = "not-allowed";
  }

  if (!modal || !content) {
    alert("❌ THIẾU GIAO DIỆN: Trình duyệt không tìm thấy 'history-modal'.");
    if (btnHistory) {
      btnHistory.disabled = false;
      btnHistory.innerHTML = "📜 LỊCH SỬ ĐIỂM";
      btnHistory.style.opacity = "1";
      btnHistory.style.cursor = "pointer";
    }
    return;
  }

  modal.style.display = "flex";

  content.innerHTML = `
    <div style="text-align:center; padding: 20px;">
      <div class="cyber-spinner"></div>
      <p style="color: #00d2d3; margin-top: 15px; font-weight: bold;">ĐANG KẾT NỐI VỚI VỆ TINH DỮ LIỆU...</p>
    </div>`;

  const url = `${MASTER_API_URL}&action=getHistory&school=${encodeURIComponent(window.currentPlayer.school)}&lop=${encodeURIComponent(window.currentPlayer.lop)}&id=${encodeURIComponent(window.currentPlayer.id)}`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.status === "success") {
      let data = result.data; // Lấy mảng dữ liệu

      if (data.length === 0) {
        content.innerHTML = `<p style='text-align:center; font-size: 1.2rem; color: #aaa;'>Phi công <b class="player-name">${window.currentPlayer.fullname}</b> chưa có dữ liệu làm bài nào.</p>`;
      } else {
        // 🌟 THUẬT TOÁN SẮP XẾP KÉP (OT -> THỜI GIAN)
        data.sort((a, b) => {
          // Ưu tiên 1: Sắp xếp theo OT (Hỗ trợ đọc số: OT 2 sẽ đứng trước OT 10)
          let otA = String(a.ot).trim();
          let otB = String(b.ot).trim();
          let otCompare = otA.localeCompare(otB, undefined, { numeric: true });

          if (otCompare !== 0) return otCompare; // Nếu khác OT thì xếp theo OT

          // Ưu tiên 2: Nếu cùng một OT -> Xếp theo Thời gian (Lần làm mới nhất ngoi lên trên)
          // (Cần hàm dịch định dạng "HH:mm:ss - DD/MM/YYYY" sang thời gian máy tính hiểu)
          const parseCustomDate = (timeStr) => {
            try {
              let parts = timeStr.split(" - ");
              let t = parts[0].split(":"); // [giờ, phút, giây]
              let d = parts[1].split("/"); // [ngày, tháng, năm]
              // Lưu ý: Tháng trong JS tính từ 0 (0-11) nên phải trừ 1
              return new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]).getTime();
            } catch (e) {
              return 0;
            }
          };

          return parseCustomDate(b.time) - parseCustomDate(a.time);
        });
        // 🌟 (KẾT THÚC SẮP XẾP) --------------------------------

        let tableHTML = `<table class="history-table">
          <tr><th>Thời gian nộp</th><th>OT</th><th>Điểm</th></tr>`;

        data.forEach((row) => {
          let scoreColor = "#00eaaf";
          if (parseInt(row.score) < 20) scoreColor = "#ff4757";
          else if (parseInt(row.score) < 35) scoreColor = "#f1c40f";

          tableHTML += `<tr>
            <td style="color: #dcdde1;">${row.time}</td>
            <td style="color: #a29bfe; font-weight: bold;">${row.ot}</td>
            <td><b style="color:${scoreColor}; font-size: 1.3rem;">${row.score}</b></td>
          </tr>`;
        });
        tableHTML += `</table>`;
        content.innerHTML = tableHTML;
      }
    } else {
      content.innerHTML = `<p style="color:#ff4757; text-align:center;">Lỗi hệ thống: ${result.msg}</p>`;
    }
  } catch (err) {
    content.innerHTML = `<p style="color:#ff4757; text-align:center;">📡 Không thể kết nối tới kho dữ liệu!</p>`;
  } finally {
    // ✅ MỞ KHÓA NÚT: Khi đã load xong
    if (btnHistory) {
      btnHistory.disabled = false;
      btnHistory.innerHTML = "📜 LỊCH SỬ ĐIỂM";
      btnHistory.style.opacity = "1";
      btnHistory.style.cursor = "pointer";
    }
  }
};

// 5. Logic gửi điểm tự động
window.submitAutoScore = function () {
  if (!window.currentPlayer)
    return showCustomAlert(
      "Không tìm thấy thông tin học sinh.\nVui lòng kiểm tra lại!",
      "❌ LỖI DỮ LIỆU",
    );

  if (window.isScoreSaved)
    return showCustomAlert("Bạn đã lưu điểm rồi!", "⚠️ THÔNG BÁO");

  const btnLose = document.getElementById("btn-save-lose");
  const btnWin = document.getElementById("btn-save-win");
  if (btnLose) btnLose.innerText = "ĐANG LƯU...";
  if (btnWin) btnWin.innerText = "ĐANG LƯU...";

  const otCode = window.currentLevel || "1";
  const finalScore = typeof score !== "undefined" ? score : 0;

  const url = `${MASTER_API_URL}&action=saveScore&school=${encodeURIComponent(window.currentPlayer.school)}&lop=${encodeURIComponent(window.currentPlayer.lop)}&id=${encodeURIComponent(window.currentPlayer.id)}&fullname=${encodeURIComponent(window.currentPlayer.fullname)}&ot=${encodeURIComponent(otCode)}&score=${encodeURIComponent(finalScore)}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        const totalQ =
          typeof GAME_CONFIG !== "undefined"
            ? GAME_CONFIG.game.totalQuestions
            : "?";

        // Gọi bảng thông báo màu Xanh lá (true)
        showCustomAlert(
          `<span class="player-name">${window.currentPlayer.fullname}</span>: ${finalScore}/${totalQ} điểm. Xin chúc mừng!`,
          "📡 HỆ THỐNG ĐÃ GHI NHẬN",
          true,
        );
        window.isScoreSaved = true;
        if (btnLose) btnLose.style.display = "none";
        if (btnWin) btnWin.style.display = "none";
      } else {
        // Lỗi từ máy chủ
        showCustomAlert("Lỗi từ hệ thống: " + data.msg, "❌ TỪ CHỐI");
        if (btnLose) btnLose.innerText = "LƯU ĐIỂM";
        if (btnWin) btnWin.innerText = "LƯU ĐIỂM";
      }
    })
    .catch((err) => {
      console.error("Lỗi Fetch:", err);
      // Lỗi rớt mạng
      showCustomAlert(
        "Không thể kết nối tới Google Sheets.\nVui lòng kiểm tra đường truyền!",
        "📡 MẤT KẾT NỐI",
      );
      if (btnLose) btnLose.innerText = "LƯU ĐIỂM";
      if (btnWin) btnWin.innerText = "LƯU ĐIỂM";
    });
};

window.triggerReload = function () {
  document.getElementById("global-loader").style.display = "flex";
  setTimeout(() => {
    location.reload();
  }, 300);
};

// ================= GIAO DIỆN IN-GAME =================
function setupModal(item, isBoss) {
  if (cooldownTimer || currentActiveObject === item) return;
  currentActiveObject = item;
  isQuizOpen = true;
  game.scene.scenes[0].physics.pause();
  spawnTimerEvent.paused = true;

  const data = item.getData("quizData");
  const modal = document.getElementById("quiz-modal");
  const confirmBtn = document.getElementById("confirm-btn");

  confirmBtn.disabled = false;
  confirmBtn.style.pointerEvents = "auto";
  currentSelectedOptions = [];

  document.getElementById("question-title").innerText = isBoss
    ? "⚔️ BOSS ⚔️"
    : "CÂU HỎI THƯỜNG";
  modal.className = isBoss ? "boss-mode" : "";
  modal.style.maxWidth =
    data.type === "single" || data.type === "multi" ? "800px" : "1440px";
  document.getElementById("question-text").innerText = data.q;

  const imgEl = document.getElementById("question-image");
  const hotspotContainer = document.getElementById("hotspot-container");
  const hotspotImg = document.getElementById("hotspot-image");
  const vidEl = document.getElementById("question-video");
  const mediaLoader = document.getElementById("media-loader");

  imgEl.style.display = "none";
  hotspotContainer.style.display = "none";
  vidEl.style.display = "none";
  vidEl.pause();
  vidEl.removeAttribute("src");
  imgEl.removeAttribute("src");
  hotspotImg.removeAttribute("src");
  if (mediaLoader) mediaLoader.style.display = "none";

  if (data.type === "hotspot" && data.image) {
    if (mediaLoader) {
      mediaLoader.style.display = "flex";
      mediaLoader.innerHTML =
        "<div class='cyber-scan-line'></div>ĐANG GIẢI MÃ ẢNH VỆ TINH...";
    }
    hotspotImg.onload = () => {
      if (mediaLoader) mediaLoader.style.display = "none";
      hotspotContainer.style.display = "inline-block";
    };
    hotspotImg.src = data.image;
    if (hotspotImg.complete) hotspotImg.onload();
  } else if (data.image) {
    if (mediaLoader) {
      mediaLoader.style.display = "flex";
      mediaLoader.innerHTML =
        "<div class='cyber-scan-line'></div>ĐANG TRÍCH XUẤT TÀI LIỆU...";
    }
    imgEl.onload = () => {
      if (mediaLoader) mediaLoader.style.display = "none";
      imgEl.style.display = "block";
    };
    imgEl.src = data.image;
    if (imgEl.complete) imgEl.onload();
  } else if (data.video) {
    if (mediaLoader) {
      mediaLoader.style.display = "flex";
      mediaLoader.innerHTML =
        "<div class='cyber-scan-line'></div>ĐANG KẾT NỐI TÍN HIỆU VIDEO...";
    }
    vidEl.oncanplay = () => {
      if (mediaLoader) mediaLoader.style.display = "none";
      vidEl.style.display = "block";
    };
    vidEl.src = data.video;
    vidEl.load();
  }

  const container = document.getElementById("options-container");
  container.innerHTML = "";

  if (data.type === "matrix") {
    // 🌟 1. Trộn ngẫu nhiên các Hàng (Câu hỏi)
    let shuffledRows = [...data.rows].sort(() => Math.random() - 0.5);

    // 🌟 2. Trộn ngẫu nhiên các Cột (Tiêu đề Đúng/Sai, Có/Không...)
    let shuffledHeaders = [...data.headers].sort(() => Math.random() - 0.5);

    // 3. Render giao diện dựa trên mảng Cột đã trộn
    let html = `<table class="matrix-table"><tr><th></th>${shuffledHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    shuffledRows.forEach((row, rIdx) => {
      html += `<tr><td>${row.text}</td>${shuffledHeaders.map((h) => `<td><input type="radio" class="matrix-radio" name="matrix-row-${rIdx}" value="${h}"></td>`).join("")}</tr>`;
    });

    container.innerHTML = html + `</table>`;
    confirmBtn.style.display = "block";

    confirmBtn.onclick = () => {
      if (
        document.querySelectorAll(".matrix-radio:checked").length <
        shuffledRows.length
      )
        return showCustomAlert(
          "⚠️ Vui lòng đánh giá đầy đủ cho TẤT CẢ các hàng trong bảng!",
        );

      let isCorrect = shuffledRows.every(
        (r, i) =>
          document.querySelector(`input[name="matrix-row-${i}"]:checked`)
            ?.value === r.answer,
      );

      if (!isCorrect) {
        lockAnswerUI();
        const trs = document.querySelectorAll(".matrix-table tr");
        shuffledRows.forEach((row, rIdx) => {
          const tr = trs[rIdx + 1];
          const radios = tr.querySelectorAll("input[type='radio']");
          radios.forEach((radio) => {
            const cell = radio.closest("td");
            if (radio.checked && radio.value !== row.answer)
              cell.classList.add("is-wrong");
            if (radio.value === row.answer) cell.classList.add("correct-blink");
          });
        });
        setTimeout(() => {
          closeModal(false);
          finalizeResult(false, item, isBoss);
        }, 2000);
      } else {
        processResult(true, item, isBoss);
      }
    };
  } else if (data.type === "matching") {
    container.innerHTML = `<p class="help-note" style="font-style: italic; margin-bottom: 15px;">(Kéo thả các ô ở cột bên phải lên/xuống để ghép đúng với nội dung tương ứng ở cột bên trái)</p>`;
    let board = document.createElement("div");
    board.className = "matching-board";
    let colLeft = document.createElement("div");
    colLeft.className = "matching-col-left";
    let colRight = document.createElement("div");
    colRight.className = "matching-col-right";
    colRight.id = "matching-right-list";

    // 🌟 1. TRỘN NGẪU NHIÊN CỘT TRÁI (Lấy nguyên cặp xáo trộn)
    let shuffledPairs = [...data.pairs].sort(() => Math.random() - 0.5);

    // 🌟 2. TRỘN NGẪU NHIÊN CỘT PHẢI (Lấy đáp án từ mảng đã xáo trộn ra và trộn tiếp lần 2)
    let rightOpts = shuffledPairs
      .map((p) => p.right)
      .sort(() => Math.random() - 0.5);

    // 3. Render dữ liệu dựa trên mảng đã xáo trộn (shuffledPairs)
    shuffledPairs.forEach((p, i) => {
      let leftBox = document.createElement("div");
      leftBox.className = "match-static-box";
      leftBox.innerHTML = p.left; // Render cột trái ngẫu nhiên
      colLeft.appendChild(leftBox);

      let rightBox = document.createElement("div");
      rightBox.className = "match-drag-box";
      rightBox.setAttribute("data-value", rightOpts[i]);
      rightBox.innerHTML = rightOpts[i];
      colRight.appendChild(rightBox);
    });

    board.appendChild(colLeft);
    board.appendChild(colRight);
    container.appendChild(board);
    new Sortable(colRight, {
      animation: 150,
      ghostClass: "sortable-ghost-match",
    });
    confirmBtn.style.display = "block";

    confirmBtn.onclick = () => {
      let currentRightItems = Array.from(
        document.querySelectorAll("#matching-right-list .match-drag-box"),
      );

      // 🌟 4. HỆ THỐNG CHẤM ĐIỂM (Chấm chéo dựa trên mảng cột trái đã xáo trộn)
      let isCorrect = shuffledPairs.every(
        (p, i) => currentRightItems[i].getAttribute("data-value") === p.right,
      );

      if (!isCorrect) {
        lockAnswerUI();
        currentRightItems.forEach((box, i) => {
          // Báo đỏ/xanh dựa trên mảng cột trái đã xáo trộn
          if (box.getAttribute("data-value") === shuffledPairs[i].right)
            box.classList.add("correct-blink");
          else box.classList.add("is-wrong");
        });
        setTimeout(() => {
          closeModal(false);
          finalizeResult(false, item, isBoss);
        }, 2000);
      } else processResult(true, item, isBoss);
    };
  } else if (data.type === "ordering") {
    container.innerHTML = `<p class="help-note" style="font-style: italic;">(Giữ và kéo thả các mục dưới đây để sắp xếp theo đúng thứ tự từ trên xuống dưới)</p>`;
    let list = document.createElement("ul");
    list.className = "sortable-list";
    list.id = "ordering-list";
    [...data.steps]
      .sort(() => Math.random() - 0.5)
      .forEach((step) => {
        let li = document.createElement("li");
        li.className = "sortable-item";
        li.setAttribute("data-value", step);
        li.innerHTML = `<span class="drag-handle">☰</span> <span>${step}</span>`;
        list.appendChild(li);
      });
    container.appendChild(list);
    new Sortable(list, { animation: 150, ghostClass: "sortable-ghost" });
    confirmBtn.style.display = "block";

    confirmBtn.onclick = () => {
      let currentItems = Array.from(
        document.querySelectorAll("#ordering-list .sortable-item"),
      );
      let isCorrect = currentItems.every(
        (li, i) => li.getAttribute("data-value") === data.steps[i],
      );

      if (!isCorrect) {
        lockAnswerUI();
        currentItems.forEach((li, index) => {
          if (li.getAttribute("data-value") === data.steps[index])
            li.classList.add("correct-blink");
          else li.classList.add("is-wrong");
        });
        setTimeout(() => {
          closeModal(false);
          finalizeResult(false, item, isBoss);
        }, 2000);
      } else processResult(true, item, isBoss);
    };
  } else if (data.type === "hotspot") {
    modal.style.maxWidth = "1100px";
    const correctCount = data.hotspots.filter((h) => h.isCorrect).length;
    const instructionText =
      correctCount > 1
        ? `(Hãy click trực tiếp để chọn ${correctCount} vùng chính xác trên bức ảnh bên trên)`
        : `(Hãy click trực tiếp vào vùng chính xác trên bức ảnh bên trên)`;

    container.innerHTML = `<p class="help-note" style="font-style: italic; margin-top: -10px;">${instructionText}</p>`;
    document.querySelectorAll(".hotspot-area").forEach((e) => e.remove());
    let selectedHotspots = [];

    data.hotspots.forEach((spot, index) => {
      let area = document.createElement("div");
      area.className = "hotspot-area";
      area.id = `hotspot-${index}`;
      area.style.left = spot.x + "%";
      area.style.top = spot.y + "%";
      area.style.width = spot.w + "%";
      area.style.height = spot.h + "%";

      area.onclick = () => {
        let idx = selectedHotspots.indexOf(index);
        if (idx > -1) {
          selectedHotspots.splice(idx, 1);
          area.classList.remove("selected");
        } else {
          if (correctCount === 1) {
            document
              .querySelectorAll(".hotspot-area")
              .forEach((e) => e.classList.remove("selected"));
            selectedHotspots = [index];
            area.classList.add("selected");
          } else if (selectedHotspots.length < correctCount) {
            selectedHotspots.push(index);
            area.classList.add("selected");
          }
        }
      };
      hotspotContainer.appendChild(area);
    });

    confirmBtn.style.display = "block";
    confirmBtn.onclick = () => {
      if (selectedHotspots.length === 0)
        return showCustomAlert(
          "⚠️ Vui lòng click chọn vùng trên ảnh trước khi chốt đáp án!",
        );
      if (selectedHotspots.length < correctCount)
        return showCustomAlert(
          `⚠️ Câu hỏi yêu cầu chọn chính xác ${correctCount} vùng. Bạn mới chọn ${selectedHotspots.length} vùng!`,
        );

      let isCorrect = selectedHotspots.every(
        (idx) => data.hotspots[idx].isCorrect,
      );

      if (!isCorrect) {
        lockAnswerUI();
        selectedHotspots.forEach((idx) => {
          if (!data.hotspots[idx].isCorrect)
            document.getElementById(`hotspot-${idx}`).classList.add("is-wrong");
        });
        data.hotspots.forEach((s, idx) => {
          if (s.isCorrect)
            document
              .getElementById(`hotspot-${idx}`)
              .classList.add("correct-blink");
        });
        setTimeout(() => {
          closeModal(false);
          finalizeResult(false, item, isBoss);
        }, 2000);
      } else processResult(true, item, isBoss);
    };
  } else {
    let opts = [...data.options];
    let fixedOpt = opts.find((o) => o.toLowerCase().includes("tất cả các"));
    opts = opts.filter((o) => o !== fixedOpt).sort(() => Math.random() - 0.5);
    if (fixedOpt) opts.push(fixedOpt);

    opts.forEach((opt, index) => {
      let btn = document.createElement("button");
      btn.className = `option-btn ${data.type === "single" ? "single-choice" : "multi-choice"}`;
      btn.setAttribute("data-option", opt);
      btn.id = `option-btn-${index + 1}`;
      let shortcutUI = `<span class="key-cap" style="margin-right: 15px; background: #555;">${index + 1}</span>`;

      if (data.type === "multi") {
        btn.innerHTML = `${shortcutUI}<span class="checkbox"></span> ${opt}`;
        btn.onclick = () => {
          let idx = currentSelectedOptions.indexOf(opt);
          if (idx > -1) {
            currentSelectedOptions.splice(idx, 1);
            btn.classList.remove("selected");
          } else if (currentSelectedOptions.length < data.limit) {
            currentSelectedOptions.push(opt);
            btn.classList.add("selected");
          }
        };
      } else {
        btn.innerText = opt;
        btn.onclick = () =>
          processResult(opt === data.answer[0], item, isBoss, {
            questionData: data,
            selected: [opt],
          });
      }
      container.appendChild(btn);
    });

    confirmBtn.style.display = data.type === "multi" ? "block" : "none";
    if (data.type === "multi") {
      confirmBtn.onclick = () => {
        let count = currentSelectedOptions.length;
        if (data.limit && count !== data.limit)
          return showCustomAlert(
            `⚠️ Câu hỏi yêu cầu chọn chính xác ${data.limit} đáp án. Bạn đang chọn ${count} đáp án!`,
          );
        if (!data.limit && count === 0)
          return showCustomAlert(
            "⚠️ Vui lòng chọn ít nhất 1 đáp án trước khi chốt!",
          );

        processResult(
          currentSelectedOptions.length === data.answer.length &&
            currentSelectedOptions.every((v) => data.answer.includes(v)),
          item,
          isBoss,
          { questionData: data, selected: [...currentSelectedOptions] },
        );
      };
    }
  }

  modal.style.display = "block";
  document.getElementById("overlay").style.display = "block";

  setTimeout(() => {
    if (data.type === "matrix") {
      let textCells = document.querySelectorAll(".matrix-table td:first-child");
      let maxH = 0;
      textCells.forEach((td) => {
        if (td.offsetHeight > maxH) maxH = td.offsetHeight;
      });
      document
        .querySelectorAll(".matrix-table td")
        .forEach((td) => (td.style.height = maxH + "px"));
    } else if (data.type === "matching") {
      let boxes = document.querySelectorAll(
        ".match-static-box, .match-drag-box",
      );
      let maxH = 0;
      boxes.forEach((box) => {
        if (box.offsetHeight > maxH) maxH = box.offsetHeight;
      });
      boxes.forEach((box) => {
        box.style.minHeight = maxH + "px";
        box.style.height = maxH + "px";
      });
    }
  }, 100);
}

function lockAnswerUI() {
  document
    .querySelectorAll(
      "#options-container .option-btn, .hotspot-area, .matrix-radio",
    )
    .forEach((btn) => {
      btn.disabled = true;
      btn.style.pointerEvents = "none";
    });

  const matchingList = document.getElementById("matching-right-list");
  if (matchingList) matchingList.style.pointerEvents = "none";

  const orderingList = document.getElementById("ordering-list");
  if (orderingList) orderingList.style.pointerEvents = "none";

  const confirmBtn = document.getElementById("confirm-btn");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.style.pointerEvents = "none";
  }
}

function applyVisualLearning(questionData, selected = []) {
  const correct = questionData?.answer || [];
  const selectedSet = new Set(selected);
  document.querySelectorAll("#options-container .option-btn").forEach((btn) => {
    const opt = btn.getAttribute("data-option");
    if (!opt) return;
    if (correct.includes(opt)) btn.classList.add("correct-blink");
    if (selectedSet.has(opt) && !correct.includes(opt))
      btn.classList.add("is-wrong");
  });
}

function closeModal(resume = true) {
  document.getElementById("quiz-modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  isQuizOpen = false;
  currentActiveObject = null;
  let vid = document.getElementById("question-video");
  if (vid) vid.pause();
  cooldownTimer = true;
  setTimeout(() => (cooldownTimer = false), 1500);
  if (resume && isGameRunning) {
    game.scene.scenes[0].physics.resume();
    spawnTimerEvent.paused = false;
  }
}

function showFeedback(text, isCorrect, isTransparent = false) {
  let fb = document.getElementById("feedback-modal");
  fb.innerHTML = text;
  fb.className = isCorrect ? "feedback-correct" : "feedback-wrong";

  if (isTransparent) {
    fb.classList.add("feedback-transparent");
  } else {
    fb.classList.remove("feedback-transparent");
  }

  fb.style.display = "block";
  setTimeout(() => (fb.style.display = "none"), 1500);
}

// Hàm hiển thị hộp thoại xịn sò (Biết tự đổi màu theo trạng thái)
function showCustomAlert(msg, title = "⚠️ LƯU Ý", isSuccess = false) {
  document.getElementById("custom-alert-msg").innerHTML = msg;

  const titleEl = document.querySelector("#custom-alert .alert-title");
  const boxEl = document.querySelector("#custom-alert .alert-box");
  const btnEl = document.querySelector("#custom-alert .btn-alert");

  if (titleEl) titleEl.innerText = title;

  // Đổi màu Xanh Ngọc nếu thành công, màu Cam rực nếu có lỗi/cảnh báo
  const mainColor = isSuccess ? "#00eaaf" : "#f39c12";

  if (titleEl) titleEl.style.color = mainColor;
  if (boxEl) {
    boxEl.style.borderColor = mainColor;
    boxEl.style.boxShadow = `0 0 40px ${isSuccess ? "rgba(0, 234, 175, 0.4)" : "rgba(243, 156, 18, 0.4)"}`;
  }
  if (btnEl) btnEl.style.background = mainColor;

  document.getElementById("custom-alert").style.display = "flex";
}

function openZoom() {
  let src = document.getElementById("question-image").src;
  if (src) {
    document.getElementById("zoomed-image").src = src;
    document.getElementById("image-zoom-overlay").style.display = "flex";
  }
}
function closeZoom() {
  document.getElementById("image-zoom-overlay").style.display = "none";
}

function openHelpModal() {
  if (isQuizOpen) return;
  isHelpOpen = true;

  if (isGameRunning) {
    if (game.scene.scenes[0] && game.scene.scenes[0].physics) {
      game.scene.scenes[0].physics.pause();
    }
    if (spawnTimerEvent) spawnTimerEvent.paused = true;
    if (rewardTimerEvent) rewardTimerEvent.paused = true;
  }

  document.getElementById("help-modal").style.display = "flex";
}

function closeHelpModal() {
  isHelpOpen = false;
  document.getElementById("help-modal").style.display = "none";

  if (isGameRunning && !isGamePaused) {
    if (game.scene.scenes[0] && game.scene.scenes[0].physics) {
      game.scene.scenes[0].physics.resume();
    }
    if (spawnTimerEvent && !meteorShowerActive) spawnTimerEvent.paused = false;
    if (rewardTimerEvent) rewardTimerEvent.paused = false;
  }
}

function togglePause() {
  isGamePaused = !isGamePaused;
  if (isGamePaused) {
    game.scene.scenes[0].physics.pause();
    if (spawnTimerEvent) spawnTimerEvent.paused = true;
    if (rewardTimerEvent) rewardTimerEvent.paused = true;
    document.getElementById("pause-screen").style.display = "flex";
  } else {
    game.scene.scenes[0].physics.resume();
    if (spawnTimerEvent && !meteorShowerActive) spawnTimerEvent.paused = false;
    if (rewardTimerEvent) rewardTimerEvent.paused = false;
    document.getElementById("pause-screen").style.display = "none";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  if (typeof window.fetchLiveStudentData === "function") {
    window.fetchLiveStudentData();
  } else {
    console.log("❌ LỖI NGHIÊM TRỌNG: Hàm fetchLiveStudentData chưa tồn tại!");
  }

  // 🌟 Đã xóa các lệnh gọi intro-step-1 thừa thãi

  // 1. Bật hiển thị sẵn các nút chức năng (Toàn màn hình & Hỗ trợ)
  const fsBtn = document.getElementById("fullscreen-btn");
  const helpBtn = document.getElementById("help-btn");
  if (fsBtn) fsBtn.style.display = "flex";
  if (helpBtn) helpBtn.style.display = "flex";

  // 2. Tự động mở bảng Hướng Dẫn ngay khi vừa vào trang
  setTimeout(() => {
    if (typeof openHelpModal === "function") {
      openHelpModal();
    }
  }, 200);

  const container = document.getElementById("level-selection-container");
  if (!container) return;

  container.innerHTML = `
    <div class="cyber-loader-wrapper">
      <div class="cyber-loader-text">Đang tải dữ liệu câu hỏi...</div>
      <div class="cyber-loader-track">
        <div class="cyber-loader-fill"></div>
      </div>
    </div>
  `;

  const isLoaded = await loadSecretQuestions();

  container.innerHTML = "";

  if (isLoaded && Object.keys(quizSets).length > 0) {
    const icons = ["🪐", "🚀", "🛸", "🌌", "🛰️", "☄️"];
    let indexCount = 0;

    Object.keys(quizSets).forEach((key) => {
      const set = quizSets[key];
      const card = document.createElement("div");

      const icon = icons[indexCount % icons.length];
      indexCount++;

      if (set && set.questions && set.questions.length > 0) {
        card.className = "level-card waiting-info";

        card.innerHTML = `
          <div class="card-icon">${icon}</div>
          <div class="card-title">OT ${key}</div>
          <div class="card-info">${set.questions.length} câu hỏi</div>
        `;

        card.onclick = () => {
          // 🛑 BƯỚC CHẶN TUYỆT ĐỐI:
          // Nếu đang quét lịch sử HOẶC chưa chọn tên -> Khóa hoàn toàn nút bấm (Không hiện thông báo gì cả)
          if (window.isScanningHistory || !window.currentPlayer) {
            return;
          }

          document.getElementById("global-loader").style.display = "flex";

          // Cập nhật tên lên HUD
          const nameDisplay = document.getElementById("player-name-display");
          if (nameDisplay) {
            nameDisplay.innerHTML = `<span style="color:#00eaaf; margin-right:8px;">🧑‍🚀</span> ${window.currentPlayer.fullname}`;
          }

          if (!document.fullscreenElement) {
            document.documentElement
              .requestFullscreen()
              .then(() => {
                if ("keyboard" in navigator && navigator.keyboard.lock) {
                  navigator.keyboard
                    .lock(["Escape"])
                    .catch((e) => console.log("Lỗi khóa phím:", e));
                }
              })
              .catch((err) => console.log("Không thể phóng to:", err));
          }
          setTimeout(() => {
            document.getElementById("global-loader").style.display = "none";
            startGame(key);
          }, 400);
        };
      } else {
        // Giao diện khi thẻ bị khóa (chưa có câu hỏi)
        card.className = "level-card locked";
        card.innerHTML = `
          <div class="card-icon">🔒</div>
          <div class="card-title">PHẦN ${key}</div>
          <div class="card-info">Chưa mở</div>
        `;
      }
      container.appendChild(card);
    });
  } else {
    container.innerHTML =
      "<p style='color: #ff4757; font-weight: bold;'>⚠️ KHÔNG THỂ LẤY ĐƯỢC DỮ LIỆU. VUI LÒNG KIỂM TRA KẾT NỐI!</p>";
  }

  // Lắng nghe sự kiện click nút Fullscreen
  if (fsBtn) {
    fsBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        // Nếu chưa full -> Bật Fullscreen
        document.documentElement.requestFullscreen().catch((err) => {
          console.log(`Lỗi phóng to: ${err.message}`);
        });
        fsBtn.innerHTML = "⤡"; // Đổi icon thành Thu nhỏ
        fsBtn.style.borderColor = "#ff4757"; // Đổi sang màu đỏ cho ngầu
        fsBtn.style.color = "#ff4757";
      } else {
        // Nếu đang full -> Thoát Fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        fsBtn.innerHTML = "⤢"; // Trả lại icon Phóng to
        fsBtn.style.borderColor = "#00eaaf"; // Trả lại màu xanh ngọc
        fsBtn.style.color = "#00eaaf";
      }
    });
  }
});

window.addEventListener("keydown", (e) => {
  if (!isGameRunning) {
    const startScreen = document.getElementById("start-screen");
    if (
      startScreen.style.display !== "none" &&
      ![
        "F5",
        "F12",
        "Meta",
        "Alt",
        "Control",
        "Shift",
        "Escape",
        "h",
        "H",
        "f",
        "F",
      ].includes(e.key)
    )
      return;
  }
  if (e.key === "Escape") {
    e.preventDefault();

    const historyModal = document.getElementById("history-modal");
    if (historyModal && historyModal.style.display === "flex") {
      historyModal.style.display = "none";
      return;
    }

    const customAlert = document.getElementById("custom-alert");

    if (customAlert && customAlert.style.display === "flex") {
      customAlert.style.display = "none";
      return;
    }

    if (isQuizOpen) {
      closeModal();
      return;
    }

    if (isHelpOpen) {
      closeHelpModal();
      return;
    }

    if (document.fullscreenElement) {
      if ("keyboard" in navigator && navigator.keyboard.unlock) {
        navigator.keyboard.unlock();
      }
      document.exitFullscreen();
    }
  }
  if (e.key.toLowerCase() === "p" && isGameRunning && !isQuizOpen)
    togglePause();
  if (isQuizOpen) {
    const customAlert = document.getElementById("custom-alert");
    if (customAlert && customAlert.style.display === "flex") {
      if (e.key === "Enter") customAlert.style.display = "none";
      return;
    }
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      const btn = document.getElementById(`option-btn-${num}`);
      if (btn && !btn.disabled) btn.click();
    }
    if (e.key === "Enter") {
      const confirmBtn = document.getElementById("confirm-btn");
      if (
        confirmBtn &&
        confirmBtn.style.display !== "none" &&
        !confirmBtn.disabled
      )
        confirmBtn.click();
    }
  }
  if (e.key.toLowerCase() === "h" && !isQuizOpen) {
    isHelpOpen ? closeHelpModal() : openHelpModal();
  }
  if (e.key.toLowerCase() === "f" && e.target.tagName !== "INPUT") {
    e.preventDefault();
    const fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) fsBtn.click();
  }
});

window.addEventListener("resize", () => {
  if (typeof game !== "undefined" && game.scale) {
    setTimeout(() => {
      let w = window.innerWidth;
      let h = window.innerHeight;

      game.scale.resize(w, h);

      // Cập nhật lại cả Size lẫn Scale khi thu phóng web
      if (typeof bgSpace !== "undefined" && bgSpace) {
        bgSpace.setSize(w, h);
        bgSpace.tileScaleY = h / bgSpace.texture.getSourceImage().height;
        bgSpace.tileScaleX = bgSpace.tileScaleY;
      }
      if (typeof bgStars !== "undefined" && bgStars) {
        bgStars.setSize(w, h);
        bgStars.tileScaleY = h / bgStars.texture.getSourceImage().height;
        bgStars.tileScaleX = bgStars.tileScaleY;
      }
    }, 1000);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (isGameRunning && !isGamePaused && !isQuizOpen && !isHelpOpen) {
      togglePause();
    }
  }
});
