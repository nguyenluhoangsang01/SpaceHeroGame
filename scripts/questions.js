const API_URL =
  "https://script.google.com/macros/s/AKfycbzh8rZNHH3eMEJZmGdA7dBjJ3HF8z_rhhs9LKC64p5FAvFLp7kujYoEKfu3fsK1pEpC/exec?key=thdd@123";

let quizSets = {};

async function loadSecretQuestions() {
  try {
    let response = await fetch(API_URL);
    let dataText = await response.text();

    if (dataText.includes("TỪ CHỐI")) {
      console.error("Lỗi chìa khóa bảo mật!");
      return false;
    }

    let decodedStr = decodeURIComponent(escape(atob(dataText)));
    quizSets = JSON.parse(decodedStr);

    return true;
  } catch (error) {
    console.error("Lỗi bảo mật hoặc mất kết nối:", error);
    return false;
  }
}
