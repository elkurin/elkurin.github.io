document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".skybound-rebellion-intro .intro-story p"); // 物語のテキスト部分

  if (sections.length == 0) {
    console.log("no targets");
    return;
  } else {
    console.log(`target ${sections.length}`)
  }

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log(entry.target.innerText);
          entry.target.classList.add("in-view"); // 「in-view」クラスを追加
          observer.unobserve(entry.target); // 一度表示されたら監視を停止
        }
      });
    },
    { threshold: 0.2 } // 0.2は表示される閾値、スクロールで少しだけ要素が見えるときに発火
  );

  sections.forEach(section => {
    observer.observe(section); // 監視を開始
  });
});

