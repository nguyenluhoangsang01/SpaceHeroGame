# 🚀 Space Hero - Educational Quiz Game

![Space Hero Banner](https://placehold.co/1000x300/0b0f19/00d2d3/png?text=SPACE+HERO+-+INTERACTIVE+QUIZ+GAME)

**Space Hero** là một tựa game web tương tác kết hợp giữa thể loại sinh tồn ngoài không gian và hệ thống câu hỏi trắc nghiệm giáo dục. Người chơi sẽ điều khiển phi thuyền, né tránh mưa thiên thạch, thu thập vật phẩm và trả lời các câu hỏi để tiến hóa phi thuyền, đánh bại BOSS.

Dự án được xây dựng bằng **HTML/CSS/JS thuần** kết hợp với Game Engine **Phaser 3**, mang lại trải nghiệm mượt mà, giao diện hiện đại (Cyberpunk/Neon) và hệ thống bảo mật dữ liệu câu hỏi thông minh.

---

## ✨ Tính năng nổi bật (Features)

### 🎮 Gameplay Hấp Dẫn

- **Thu thập và Sinh tồn:** Né tránh thiên thạch, ăn vật phẩm hỗ trợ (❤️ Máu, 🛡️ Khiên, 🧲 Nam châm, 💣 Bom).
- **Hệ thống Tiến hóa (Evolution):** Trả lời đúng liên tiếp hoặc đánh bại Boss để nâng cấp phi thuyền, thay đổi hình dạng và nhận "Nội tại" (Bất tử, Tăng tốc, Hút vật phẩm...).
- **Sự kiện ngẫu nhiên:** Mưa thiên thạch tốc độ cao và Boss xuất hiện bất ngờ theo tiến độ điểm số.

### 🧠 Hệ Thống Câu Hỏi Đa Dạng (Quiz System)

Hỗ trợ 6 định dạng câu hỏi phức tạp, tích hợp giao diện kéo thả (Drag & Drop) trực quan:

1. **Trắc nghiệm một đáp án (Single Choice)**
2. **Trắc nghiệm nhiều đáp án (Multi Choice)**
3. **Nối chữ (Matching)** - Sử dụng SortableJS.
4. **Sắp xếp thứ tự (Ordering)** - Kéo thả các bước theo đúng quy trình.
5. **Ma trận (Matrix)** - Đánh giá Đúng/Sai cho nhiều nhận định cùng lúc.
6. **Điểm mù (Hotspot)** - Click trực tiếp vào các vùng chính xác trên hình ảnh.

### 🎨 Giao diện (UI/UX)

- Thiết kế theo phong cách Flat Design kết hợp Neon Glowing.
- Hệ thống HUD trực quan: Thanh Pin % sinh động, báo hiệu Boss, Nút Pause/Play SVG chuẩn game hiện đại.
- Auto-Pause: Tự động tạm dừng game khi người chơi chuyển Tab trình duyệt để chống giật lag và lỗi spam vật phẩm.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Game Engine:** [Phaser 3](https://phaser.io/) (Xử lý vật lý, render 2D, particles, timers).
- **Thư viện phụ trợ:** [SortableJS](https://sortablejs.github.io/Sortable/) (Xử lý kéo thả UI mượt mà).
- **Backend / Database:** Google Apps Script & Google Sheets (Dùng làm API cung cấp câu hỏi).

---

## ⌨️ Hướng dẫn điều khiển (Controls)

| Phím Tắt / Thao tác               | Chức năng                                              |
| :-------------------------------- | :----------------------------------------------------- |
| `W`, `A`, `S`, `D` hoặc `Mũi tên` | Điều khiển phi thuyền di chuyển                        |
| `P` hoặc Click icon ⏸️            | Tạm dừng / Tiếp tục game                               |
| `H`                               | Bật / Tắt bảng hướng dẫn phím tắt                      |
| `ESC`                             | Đóng các cửa sổ thông báo / Thoát chế độ Toàn màn hình |
| Phím số `1` -> `6`                | Chọn nhanh đáp án khi hộp thoại Câu hỏi hiện lên       |
| `Enter`                           | Chốt đáp án / Đóng cảnh báo lỗi                        |
