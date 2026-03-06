let currentSelectedOptions = [];

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

  if (data.type === "hotspot") {
    imgEl.style.display = "none";
    hotspotImg.src = data.image;
    hotspotContainer.style.display = "inline-block";
  } else {
    hotspotContainer.style.display = "none";
    imgEl.src = data.image || "";
    imgEl.style.display = data.image ? "block" : "none";
  }

  const vidEl = document.getElementById("question-video");
  if (data.video) {
    vidEl.src = data.video;
    vidEl.style.display = "block";
  } else {
    vidEl.pause();
    vidEl.removeAttribute("src");
    vidEl.load();
    vidEl.style.display = "none";
  }

  const container = document.getElementById("options-container");
  container.innerHTML = "";

  if (data.type === "matrix") {
    let shuffledRows = [...data.rows].sort(() => Math.random() - 0.5);
    let html = `<table class="matrix-table"><tr><th></th>${data.headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    shuffledRows.forEach((row, rIdx) => {
      html += `<tr><td>${row.text}</td>${data.headers.map((h) => `<td><input type="radio" class="matrix-radio" name="matrix-row-${rIdx}" value="${h}"></td>`).join("")}</tr>`;
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
    let rightOpts = data.pairs
      .map((p) => p.right)
      .sort(() => Math.random() - 0.5);

    data.pairs.forEach((p, i) => {
      let leftBox = document.createElement("div");
      leftBox.className = "match-static-box";
      leftBox.innerHTML = p.left;
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
      let isCorrect = data.pairs.every(
        (p, i) => currentRightItems[i].getAttribute("data-value") === p.right,
      );

      if (!isCorrect) {
        lockAnswerUI();
        currentRightItems.forEach((box, i) => {
          if (box.getAttribute("data-value") === data.pairs[i].right)
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

function showCustomAlert(msg) {
  document.getElementById("custom-alert-msg").innerText = msg;
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
  const introStep1 = document.getElementById("intro-step-1");
  const introStep2 = document.getElementById("intro-step-2");

  const transitionToMenu = (event) => {
    if (event.key === "Enter") {
      if (introStep1 && introStep1.style.display !== "none") {
        introStep1.style.display = "none";
        introStep2.style.display = "block";

        document.getElementById("help-btn").style.display = "flex";
      }
      window.removeEventListener("keydown", transitionToMenu);
    }
  };

  window.addEventListener("keydown", transitionToMenu);

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
        card.className = "level-card";

        card.innerHTML = `
          <div class="card-icon">${icon}</div>
          <div class="card-title">OT ${key}</div>
          <div class="card-info">${set.questions.length} câu hỏi</div>
        `;

        card.onclick = () => {
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
          startGame(key);
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
      ].includes(e.key)
    )
      return;
  }
  if (e.key === "Escape") {
    e.preventDefault();

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
});

window.addEventListener("resize", () => {
  if (typeof game !== "undefined" && game.scale) {
    setTimeout(() => {
      let w = window.innerWidth;
      let h = window.innerHeight;

      game.scale.resize(w, h);

      if (typeof bgSpace !== "undefined" && bgSpace) bgSpace.setSize(w, h);
      if (typeof bgStars !== "undefined" && bgStars) bgStars.setSize(w, h);
    }, 500);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (isGameRunning && !isGamePaused && !isQuizOpen && !isHelpOpen) {
      togglePause();
    }
  }
});
