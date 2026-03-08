const API_URL =
  "https://script.google.com/macros/s/AKfycbxrGHPEldEGjU-HOA68n-PHQJUWH_G48ojsajwrdalRmfzU7ffTUZ83WjSiBiQghADF/exec?key=thdd@123";

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
