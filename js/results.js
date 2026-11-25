// 3페이지(결과·시각화) 그래프 — window.CHART(chartData.js) + Chart.js(js/vendor)
(function () {
  "use strict";
  var C = window.CHART;
  if (!window.Chart || !C) {
    Array.prototype.forEach.call(document.querySelectorAll(".차트틀"), function (el) {
      el.innerHTML = "<p class='작게'>그래프 파일을 불러오지 못했습니다 (js/vendor/chart.umd.min.js, js/chartData.js 확인).</p>";
    });
    return;
  }

  // 색은 포카핏 디자인 시스템 (css/style.css의 :root 와 같은 값). 주 #5B4FD6 · 보조 글자 #62627A · 강조 #F2B544 · 오류 #C93C3C
  var 색 = { ai: "#5B4FD6", 사람: "#62627A", 강조: "#F2B544", 오류: "#C93C3C", 경계: "#C4C2DB", train: "#B9B3EE", 글: "#1F1F2E" };
  var 등급색 = ["#D9D5F7", "#7468DD", "#5B4FD6"];
  var $ = function (id) { return document.getElementById(id); };
  var 표시 = function (이름) { return 이름 === "사람 기준" ? "베이스라인모델(휴리스틱)" : 이름 === "AI" ? "ours" : 이름; };      // chartData의 키는 '사람 기준'·'AI', 화면에는 새 이름
  var 숫자 = function (n) { return Math.round(n).toLocaleString("ko-KR"); };
  var 만 = function (v) { return v >= 10000 ? +(v / 10000).toFixed(1) + "만" : 숫자(v); };

  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = 색.사람;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.tooltip.padding = 10;

  // ---------- 숫자 문구: chartData에서 채움 (노트북을 다시 돌려 chartData.js만 바꿔도 맞게) ----------
  function 글(id, s) { var e = $(id); if (e) e.textContent = s; }
  var 합 = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  글("핵심초동AI", C.초동.정답률.AI.toFixed(1)); 글("핵심초동사람", C.초동.정답률["사람 기준"].toFixed(1)); 글("핵심초동문제", C.초동.문제수);
  글("핵심시기AI", C.시기.정답률.AI.toFixed(1)); 글("핵심시기사람", C.시기.정답률["사람 기준"].toFixed(1)); 글("핵심시기문제", C.시기.문제수);
  (function () {
    var 튜 = "로지스틱(튜닝 전)";
    if (C.초동.정답률[튜] == null || C.시기.정답률[튜] == null) { var e = $("튜닝글"); if (e) e.remove(); return; }
    var 차 = function (문제) { var d = C[문제].정답률.AI - C[문제].정답률[튜]; return (d >= 0 ? "+" : "") + d.toFixed(1) + "%p"; };
    글("튜닝글", "튜닝·합치기 효과: 기본 설정 로지스틱(튜닝 전)과 비교해 ours는 초동 " + 차("초동") + ", 시기 " + 차("시기") + "입니다.");
  })();
  (function () {
    var m = C.초동.혼동행렬, 두칸 = m[0][2] + m[2][0];
    글("두칸글", "두 칸 차이 오답(10만 미만 ↔ 30만 이상)이 " + 두칸 + "개뿐입니다.");
    var s = C.시기.혼동행렬, 짧 = 합(s[0]), 맞 = s[0][0];
    글("짧은공백글", "'150일 이하'는 " + 짧 + "문제 중 " + 맞 + "개를 맞혔습니다." + (맞 === 0 ? " 스페셜·리패키지를 빼면서 짧은 간격이 줄어, 사실상 151~300일과 300일 초과를 고르는 문제가 됐습니다." : ""));
    var 줄 = C.분포_초동, 앞 = 줄[0], 뒤 = 줄[줄.length - 1], 최고 = 줄.reduce(function (a, r) { return r.연도 === 2024 ? r : a; }, 뒤);
    글("시장글", "초동 30만 이상 비율은 " + 앞.연도 + "년 " + 앞["실제(%) 30만 이상"] + "% → " + 최고.연도 + "년 " + 최고["실제(%) 30만 이상"] + "%로 커졌고, ours 예측 비율도 " +
      앞["AI 예측(%) 30만 이상"] + "% → " + 최고["AI 예측(%) 30만 이상"] + "%로 따라갔습니다.");
  })();

  // 정답지(MODEL.정답지)를 사이트 계산으로 돌린 값으로 '이미 결과가 나온 예측' 문구를 채운다
  Array.prototype.forEach.call(document.querySelectorAll("[data-정답지]"), function (칸) {
    try {
      var 정 = window.MODEL.정답지[+칸.dataset.정답지];
      var r = window.Predict.정답지계산(정);
      var 글 = r.등급이름 + " (" + r.퍼센트 + "%)";
      if (r.날짜) {
        var 범위 = r.날짜.까지 ? r.날짜.부터 + " ~ " + r.날짜.까지 : r.날짜.부터 + " 이후";
        if (칸.tagName === "TD") {
          글 += " → " + 범위;
          // 나머지 두 등급도 같이: 150일 이하 8.5% (~날짜) · 300일 초과 10.8% (날짜 ~)
          var 이름들 = window.MODEL.시기_이름, 퍼 = function (k) { return (r.결과.확률[k] * 100).toFixed(1) + "%"; };
          var 짧 = window.Predict.시기날짜(정.입력.발매일, 0), 길 = window.Predict.시기날짜(정.입력.발매일, 2);
          글 += "<br><span class='작게'>" + 이름들[0] + " " + 퍼(0) + " (~" + 짧.까지 + ") · " + 이름들[2] + " " + 퍼(2) + " (" + 길.부터 + " ~)</span>";
        } else 글 += "<br><span class='작게'>" + 범위 + "</span>";
      }
      칸.innerHTML = 글;
    } catch (e) { 칸.textContent = "(계산 실패)"; }
  });

  // 토글 버튼 묶음: <div class="토글" data-for="..."><button data-값="...">
  function 토글(id, 바뀜) {
    var 묶음 = document.querySelector(".토글[data-for='" + id + "']");
    Array.prototype.forEach.call(묶음.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(묶음.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        바뀜(b.dataset.값);
      });
    });
  }

  // ---------- 1. 사람 기준 vs AI ----------
  var 순서 = Object.keys(C.초동.정답률);                     // chartData에 있는 순서 그대로 (사람 기준, 로지스틱(튜닝 전), AI 등)
  var 막대색 = 순서.map(function (이름) { return 이름 === "AI" ? 색.ai : 이름 === "사람 기준" ? 색.사람 : 색.경계; });
  new Chart($("차트_정답률"), {
    type: "bar",
    data: {
      labels: ["초동 (" + C.초동.문제수 + "문제)", "컴백 시기 (" + C.시기.문제수 + "문제)"],
      datasets: 순서.map(function (이름, i) {
        return { label: 표시(이름), data: [C.초동.정답률[이름], C.시기.정답률[이름]], backgroundColor: 막대색[i], borderRadius: 6, maxBarThickness: 64 };
      })
    },
    options: {
      scales: { y: { min: 40, max: 85, title: { display: true, text: "정답률 (%)" } }, x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.y.toFixed(1) + "%"; } } } }
    },
    plugins: [막대위숫자(function (v) { return v.toFixed(1) + "%"; })]
  });

  // 막대 위에 숫자 쓰기 (가까이서 안 봐도 읽히게)
  function 막대위숫자(형식) {
    return {
      id: "막대위숫자",
      afterDatasetsDraw: function (chart) {
        var ctx = chart.ctx;
        ctx.save();
        ctx.font = "700 12px " + Chart.defaults.font.family;
        ctx.textAlign = "center";
        ctx.fillStyle = 색.글;
        chart.data.datasets.forEach(function (ds, i) {
          var meta = chart.getDatasetMeta(i);
          if (meta.hidden) return;
          meta.data.forEach(function (bar, j) {
            var v = ds.data[j];
            if (v == null) return;
            ctx.fillText(형식(v), bar.x, bar.y - 6);
          });
        });
        ctx.restore();
      }
    };
  }

  // ---------- 2. 연도별 맞힌 개수 ----------
  var 연도차트 = new Chart($("차트_연도별"), { type: "bar", data: { labels: [], datasets: [] },
    options: {
      scales: { y: { beginAtZero: true, title: { display: true, text: "맞힌 문제 수" } }, x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: {
        title: function (items) { return items[0].label + "년 테스트"; },
        label: function (c) {
          var 총 = c.chart.$문제수[c.dataIndex];
          return c.dataset.label + ": " + c.parsed.y + " / " + 총 + "문제 (" + (c.parsed.y / 총 * 100).toFixed(1) + "%)";
        } } } }
    }
  });
  function 연도그리기(문제) {
    var d = C[문제].연도별;
    연도차트.$문제수 = d.문제수;
    연도차트.data.labels = d.연도.map(String);
    연도차트.data.datasets = [
      { label: "베이스라인모델(휴리스틱)", data: d["사람 기준"], backgroundColor: 색.사람, borderRadius: 4 },
      { label: "ours", data: d.AI, backgroundColor: 색.ai, borderRadius: 4 }
    ];
    연도차트.update();
    var 승 = 0, 무 = 0, 패 = 0;
    d.AI.forEach(function (a, i) { var s = d["사람 기준"][i]; if (a > s) 승++; else if (a === s) 무++; else 패++; });
    var 합AI = d.AI.reduce(function (a, b) { return a + b; }), 합사람 = d["사람 기준"].reduce(function (a, b) { return a + b; });
    $("연도요약").textContent = (문제 === "초동" ? "초동" : "컴백 시기") + ": ours 기준 " + 승 + "승 " + 무 + "무 " + 패 + "패, 합계 " +
      합AI + " vs " + 합사람 + " (" + (합AI - 합사람) + "문제 차이)";
  }
  토글("연도별", 연도그리기);
  연도그리기("초동");

  // ---------- 3. 직전 vs 이번 초동 (산점도, 로그축) ----------
  var 점들 = C.직전vs이번;
  function 점(r) { return { x: r.직전초동, y: r.초동, r: r }; }
  var 리팩 = 점들.filter(function (r) { return r.직전앨범유형 === "리패키지"; }).map(점);
  var 그외 = 점들.filter(function (r) { return r.직전앨범유형 !== "리패키지"; }).map(점);
  $("산점수").textContent = 점들.length;
  $("리팩수").textContent = 리팩.length;
  var 경계선 = {
    id: "경계선",
    beforeDatasetsDraw: function (chart) {
      var ctx = chart.ctx, x = chart.scales.x, y = chart.scales.y, a = chart.chartArea;
      ctx.save();
      // 대각선 (직전 = 이번)
      var lo = Math.max(x.min, y.min), hi = Math.min(x.max, y.max);
      ctx.strokeStyle = 색.경계; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x.getPixelForValue(lo), y.getPixelForValue(lo)); ctx.lineTo(x.getPixelForValue(hi), y.getPixelForValue(hi)); ctx.stroke();
      // 10만·30만 점선 (가로·세로)
      ctx.setLineDash([5, 4]); ctx.strokeStyle = 색.사람; ctx.globalAlpha = .55;
      [100000, 300000].forEach(function (v) {
        var px = x.getPixelForValue(v), py = y.getPixelForValue(v);
        ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
      });
      ctx.restore();
    }
  };
  var 로그눈금 = function (v) { return [1000, 10000, 100000, 300000, 1000000, 3000000].indexOf(v) >= 0 ? 만(v) : ""; };
  var 로그격자 = function (c) { return c.tick && 로그눈금(c.tick.value) ? "#ECEAFD" : "transparent"; };   // 이름 붙은 눈금에만 격자
  new Chart($("차트_산점"), {
    type: "scatter",
    data: { datasets: [
      { label: "그 외", data: 그외, backgroundColor: "rgba(91,79,214,.45)", borderColor: "rgba(91,79,214,.8)", borderWidth: 1, pointRadius: 3.5, pointHoverRadius: 7 },
      { label: "직전이 리패키지", data: 리팩, backgroundColor: "rgba(242,181,68,.95)", borderColor: "#1F1F2E", borderWidth: 1, pointRadius: 5, pointHoverRadius: 8 }
    ] },
    options: {
      interaction: { mode: "nearest", intersect: true },
      scales: {
        x: { type: "logarithmic", title: { display: true, text: "직전 앨범 초동 (장, 로그)" }, ticks: { callback: 로그눈금, autoSkip: false, maxRotation: 0 }, grid: { color: 로그격자 } },
        y: { type: "logarithmic", title: { display: true, text: "이번 앨범 초동 (장, 로그)" }, ticks: { callback: 로그눈금, autoSkip: false }, grid: { color: 로그격자 } }
      },
      plugins: { tooltip: { callbacks: {
        title: function (items) { var r = items[0].raw.r; return r.아티스트 + " · " + r.앨범명 + " (" + r.연도 + ")"; },
        label: function (c) { var r = c.raw.r; return "직전 " + 숫자(r.직전초동) + "장 (" + r.직전앨범유형 + ") → 이번 " + 숫자(r.초동) + "장"; }
      } } }
    },
    plugins: [경계선]
  });

  // ---------- 4. 혼동행렬 (HTML 표) ----------
  function 혼동표(문제, id) {
    var d = C[문제], m = d.혼동행렬, 이름 = d.등급이름;
    var 최대 = Math.max.apply(null, m.map(function (r) { return Math.max.apply(null, r); }));
    var html = "<table class='혼동'><thead><tr><th>정답↓ 예측→</th>" + 이름.map(function (n) { return "<th>" + n + "</th>"; }).join("") + "<th>합</th></tr></thead><tbody>";
    var 맞힘 = 0, 전체 = 0;
    m.forEach(function (행, i) {
      var 합 = 행.reduce(function (a, b) { return a + b; }, 0);
      전체 += 합; 맞힘 += 행[i];
      html += "<tr><th>" + 이름[i] + "</th>" + 행.map(function (v, j) {
        var 진하기 = 최대 ? v / 최대 : 0;
        var 배경 = i === j ? "rgba(91,79,214," + (0.12 + 진하기 * 0.8).toFixed(2) + ")" : (v ? "rgba(201,60,60," + (0.08 + 진하기 * 0.6).toFixed(2) + ")" : "#F7F7FB");
        return "<td class='" + (i === j ? "맞음칸" : "") + "' style='background:" + 배경 + ";" + (i === j && 진하기 > .5 ? "color:#fff" : "") + "' title='정답 " + 이름[i] + " → 예측 " + 이름[j] + ": " + v + "개'>" + v + "</td>";
      }).join("") + "<td class='합칸'>" + 합 + "</td></tr>";
    });
    html += "</tbody></table><p class='작게'>대각선(파랑)이 맞힌 것: " + 맞힘 + " / " + 전체 + " (" + (맞힘 / 전체 * 100).toFixed(1) + "%)</p>";
    $(id).innerHTML = html;
  }
  혼동표("초동", "혼동_초동");
  혼동표("시기", "혼동_시기");

  // ---------- 5. 리패키지 ----------
  var 리 = C.리패키지;
  $("리팩표").innerHTML = "<table class='표 숫자표'><thead><tr><th>직전 앨범</th><th>문제 수</th><th>베이스라인모델(휴리스틱)</th><th>ours</th><th>등급 상승</th><th>등급 하락</th></tr></thead><tbody>" +
    리.map(function (r) {
      var 이름 = r["직전 리패키지"] === "직전 리패키지" ? "리패키지" : "그 외";
      return "<tr><th>" + 이름 + "</th><td>" + r.문제수 + "</td><td>" + r["사람 기준(%)"].toFixed(1) + "%</td><td><b>" + r["AI(%)"].toFixed(1) +
        "%</b></td><td>" + r["등급 상승(%)"].toFixed(1) + "%</td><td>" + r["등급 하락(%)"].toFixed(1) + "%</td></tr>";
    }).join("") + "</tbody></table>";
  new Chart($("차트_리팩"), {
    type: "bar",
    data: {
      labels: 리.map(function (r) { return (r["직전 리패키지"] === "직전 리패키지" ? "직전 = 리패키지" : "그 외") + " (" + r.문제수 + "문제)"; }),
      datasets: [
        { label: "베이스라인모델(휴리스틱)", data: 리.map(function (r) { return r["사람 기준(%)"]; }), backgroundColor: 색.사람, borderRadius: 6, maxBarThickness: 56 },
        { label: "ours", data: 리.map(function (r) { return r["AI(%)"]; }), backgroundColor: 색.ai, borderRadius: 6, maxBarThickness: 56 }
      ]
    },
    options: {
      scales: { y: { min: 40, max: 90, title: { display: true, text: "정답률 (%)" } }, x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.y.toFixed(1) + "%"; } } } }
    },
    plugins: [막대위숫자(function (v) { return v.toFixed(1) + "%"; })]
  });

  // ---------- 6. 연도별 등급 비율 (실제 vs AI 예측) ----------
  var 분포상태 = { 문제: "초동", 등급: 2 };
  var 선범례 = { labels: { usePointStyle: true, pointStyle: "line", boxWidth: 28 } };   // 실선·점선이 범례에서도 보이게
  var 분포차트 = new Chart($("차트_분포"), { type: "line", data: { labels: [], datasets: [] },
    options: {
      scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: "그 해 앨범 중 비율 (%)" } } },
      interaction: { mode: "index", intersect: false },
      plugins: { legend: 선범례, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.y + "%"; } } } }
    }
  });
  function 분포그리기() {
    var 문제 = 분포상태.문제, k = 분포상태.등급, 이름 = C[문제].등급이름[k];
    var 줄 = C["분포_" + 문제];
    분포차트.data.labels = 줄.map(function (r) { return String(r.연도); });
    분포차트.data.datasets = [
      { label: "실제 " + 이름, data: 줄.map(function (r) { return r["실제(%) " + 이름]; }), borderColor: 색.사람, backgroundColor: 색.사람, borderWidth: 3, pointRadius: 4, tension: .2 },
      { label: "ours 예측 " + 이름, data: 줄.map(function (r) { return r["AI 예측(%) " + 이름]; }), borderColor: 색.ai, backgroundColor: 색.ai, borderWidth: 3, pointRadius: 4, borderDash: [6, 4], tension: .2 }
    ];
    분포차트.update();
    // 등급 버튼 이름 바꾸기
    Array.prototype.forEach.call(document.querySelectorAll(".토글[data-for='분포등급'] button"), function (b, i) { b.textContent = C[문제].등급이름[i]; });
  }
  토글("분포문제", function (v) {
    분포상태.문제 = v;
    분포상태.등급 = v === "초동" ? 2 : 0;           // 처음 보여줄 칸: 초동 30만 이상(시장 성장), 시기 150일 이하(AI가 안 고름)
    Array.prototype.forEach.call(document.querySelectorAll(".토글[data-for='분포등급'] button"), function (b, i) { b.setAttribute("aria-pressed", i === 분포상태.등급 ? "true" : "false"); });
    분포그리기();
  });
  토글("분포등급", function (v) { 분포상태.등급 = +v; 분포그리기(); });
  분포그리기();

  // ---------- 7. 직전 몇 개까지 볼까 ----------
  var k줄 = C.직전몇개;
  $("k문제수").textContent = k줄[0].문제수;
  new Chart($("차트_k"), {
    type: "line",
    data: {
      labels: k줄.map(function (r) { return r.k === 1 ? "직전 1개" : "최근 " + r.k + "개 평균"; }),
      datasets: [
        { label: "규칙 (평균의 등급 그대로)", data: k줄.map(function (r) { return r["규칙(%)"]; }), borderColor: 색.사람, backgroundColor: 색.사람, borderWidth: 3, pointRadius: 5, tension: .15 },
        { label: "로지스틱", data: k줄.map(function (r) { return r["로지스틱(%)"]; }), borderColor: 색.ai, backgroundColor: 색.ai, borderWidth: 3, pointRadius: 5, borderDash: [6, 4], tension: .15 }
      ]
    },
    options: {
      interaction: { mode: "index", intersect: false },
      scales: { y: { min: 70, max: 90, title: { display: true, text: "val 정답률 (%)" } }, x: { grid: { display: false } } },
      plugins: { legend: 선범례, tooltip: { callbacks: {
        label: function (c) { return c.dataset.label + ": " + c.parsed.y.toFixed(1) + "%"; },
        afterBody: function (items) { return "표준오차 ±" + k줄[items[0].dataIndex]["표준오차(%p)"] + "%p"; }
      } } }
    }
  });

  // ---------- 8. 설문 (PDF 5장 숫자) ----------
  new Chart($("차트_규칙"), {
    type: "bar",
    data: {
      labels: ["직전", "최고치", "최근2·3평균", "전체평균", "추세"],
      datasets: [{ label: "응답과 일치한 문제 수 (10문제 중)", data: [6.6, 6.2, 5.9, 5.3, 3.7],
        backgroundColor: [색.사람, 색.경계, 색.경계, 색.경계, 색.경계], borderRadius: 6 }]
    },
    options: {
      indexAxis: "y",
      scales: { x: { min: 0, max: 10, title: { display: true, text: "일치 수 (10문제 중)" } }, y: { grid: { display: false } } },
      plugins: { legend: { display: false } }
    }
  });
  new Chart($("차트_말과선택"), {
    type: "bar",
    data: {
      labels: ["직전과 추세가 갈린 문제에서 고른 쪽"],
      datasets: [
        { label: "직전 쪽", data: [60], backgroundColor: 색.사람, borderRadius: 6 },
        { label: "추세 쪽", data: [23], backgroundColor: 색.강조, borderRadius: 6 }
      ]
    },
    options: {
      indexAxis: "y",
      scales: { x: { min: 0, max: 100, title: { display: true, text: "'흐름을 봤다'고 답한 31명의 선택 (%)" } }, y: { display: false } },
      plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.x + "%"; } } } }
    }
  });

  // ---------- 9. 재료별 영향력 (순열 중요도, 노트북 11-3) ----------
  function 재료그래프(id, 줄) {
    new Chart($(id), {
      type: "bar",
      data: {
        labels: 줄.map(function (r) { return r.재료; }),
        datasets: [{ label: "정답률 감소 (%p)", data: 줄.map(function (r) { return r["감소(%p)"]; }),
          backgroundColor: 줄.map(function (r) { return r["감소(%p)"] < 0.5 ? 색.경계 : 색.ai; }), borderRadius: 4 }]
      },
      options: {
        indexAxis: "y",
        scales: { x: { title: { display: true, text: "섞었을 때 떨어지는 정답률 (%p)" } }, y: { grid: { display: false } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: {
          label: function (c) { return "정답률 감소 " + c.parsed.x.toFixed(2) + "%p (표준편차 " + 줄[c.dataIndex].표준편차 + ")"; }
        } } }
      },
      plugins: [{
        id: "오차선",
        afterDatasetsDraw: function (chart) {
          var ctx = chart.ctx, x = chart.scales.x;
          ctx.save(); ctx.strokeStyle = 색.글; ctx.lineWidth = 1;
          chart.getDatasetMeta(0).data.forEach(function (bar, i) {
            var v = 줄[i]["감소(%p)"], s = 줄[i].표준편차;
            var x1 = x.getPixelForValue(v - s), x2 = x.getPixelForValue(v + s);
            ctx.beginPath(); ctx.moveTo(x1, bar.y); ctx.lineTo(x2, bar.y); ctx.stroke();
          });
          ctx.restore();
        }
      }]
    });
  }
  if (C.재료영향) { 재료그래프("차트_재료초동", C.재료영향.초동); 재료그래프("차트_재료시기", C.재료영향.시기); }

  // ---------- 10. 사람이 중요하다고 한 것 vs AI가 기댄 것 (노트북 11-4: CHART.사람vsAI) ----------
  // 사람은 두 막대: 답한 대로(사람 답) / 실제 행동(사람 실제). AI는 아래 표의 %p.
  if (C.사람vsAI) {
    var 사 = C.사람vsAI, 줄들 = 사.표;
    $("설문인원").textContent = 사.설문인원;
    var 사람줄 = 줄들.filter(function (r) { return r["사람 답(%)"] != null || r["사람 실제(%)"] != null; });
    new Chart($("차트_사람답"), {
      type: "bar",
      data: {
        labels: 사람줄.map(function (r) { return r["설문 보기"]; }),
        datasets: [
          { label: "답한 대로", data: 사람줄.map(function (r) { return r["사람 답(%)"]; }), backgroundColor: 색.경계, borderRadius: 4 },
          { label: "실제 행동", data: 사람줄.map(function (r) { return r["사람 실제(%)"]; }), backgroundColor: 색.ai, borderRadius: 4 }
        ]
      },
      options: {
        indexAxis: "y",
        scales: { x: { min: 0, title: { display: true, text: "응답 비율 (%)" } }, y: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.x + "%"; } } } }
      },
      plugins: [{
        id: "끝숫자",
        afterDatasetsDraw: function (chart) {
          var ctx = chart.ctx; ctx.save(); ctx.font = "700 12px " + Chart.defaults.font.family; ctx.fillStyle = 색.글; ctx.textBaseline = "middle";
          chart.data.datasets.forEach(function (ds, i) {
            chart.getDatasetMeta(i).data.forEach(function (bar, j) { var v = ds.data[j]; if (v != null) ctx.fillText(v + "%", bar.x + 6, bar.y); });
          });
          ctx.restore();
        }
      }]
    });
    var 칸 = function (v, 단위) { return v == null ? "<span class='작게'>-</span>" : "<div class='가로막대'><i style='width:" + Math.min(100, v / 50 * 100) + "%;background:" + 색.ai + "'></i><b>" + v + 단위 + "</b></div>"; };
    var AI줄 = 줄들.filter(function (r) { return r["AI(%p)"] != null; });
    $("사람ai표").innerHTML = "<table class='표'><thead><tr><th>설문 보기</th><th>짝지은 ours 재료</th><th>사람: 답한 대로</th><th>사람: 실제 행동</th><th>ours 영향</th></tr></thead><tbody>" +
      줄들.map(function (r) {
        return "<tr><th>" + r["설문 보기"] + "</th><td>" + r["AI 재료"] + "</td><td>" + (r["사람 답(%)"] == null ? "-" : r["사람 답(%)"] + "%") + "</td><td>" + (r["사람 실제(%)"] == null ? "-" : r["사람 실제(%)"] + "%") + "</td><td>" + 칸(r["AI(%p)"], "%p") + "</td></tr>";
      }).join("") + "</tbody></table>";
    // 요약 문장은 데이터에서 만든다
    var 최대 = function (arr, 키) { return arr.filter(function (r) { return r[키] != null; }).reduce(function (a, r) { return !a || r[키] > a[키] ? r : a; }, null); };
    var 말1 = 최대(사람줄, "사람 답(%)"), 행1 = 최대(사람줄, "사람 실제(%)"), AI1 = 최대(AI줄, "AI(%p)");
    var 흐름 = 사람줄.filter(function (r) { return r["설문 보기"] === "전체적인 흐름"; })[0];
    var 글목록 = [];
    if (말1 && 행1) 글목록.push("답한 대로는 '" + 말1["설문 보기"] + "'이 " + 말1["사람 답(%)"] + "%로 가장 많았지만, 실제 행동으로 옮기면 '" + 행1["설문 보기"] + "'이 " + 행1["사람 실제(%)"] + "%로 가장 많습니다." +
      (흐름 ? " '흐름'은 " + 흐름["사람 답(%)"] + "% → " + 흐름["사람 실제(%)"] + "%로 줄어듭니다." : ""));
    if (AI1) 글목록.push("ours가 가장 크게 기댄 재료는 '" + AI1["AI 재료"] + "'(" + AI1["AI(%p)"] + "%p)입니다. 말은 '흐름'이어도 행동은 ours와 같은 '직전 판매량'입니다.");
    $("사람ai글").innerHTML = 글목록.map(function (s) { return "<li>" + s + "</li>"; }).join("");
  }

  // ---------- 11. 합치는 방법 비교 표 (노트북 8장: CHART.합치는방법) ----------
  function 합치기표(문제, id) {
    var 줄 = C.합치는방법 && C.합치는방법[문제], 칸 = $(id);
    if (!칸 || !줄 || !줄.length) { if (칸) 칸.innerHTML = "<p class='작게'>아직 이 자료가 없습니다.</p>"; return; }
    var 열 = Object.keys(줄[0]);
    var 최종열 = 열.filter(function (k) { return /최종/.test(k); })[0];
    var 최종이냐 = function (r) { var v = r[최종열]; return !!v && v !== "-" && v !== "아니오" && v !== "X"; };
    var 서식 = function (k, v) {
      if (v == null) return "-";
      if (typeof v === "number" && /(%)|%/.test(k)) return v.toFixed(1) + "%";
      if (typeof v === "boolean") return v ? "✓" : "";
      return String(v).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
    };
    칸.innerHTML = "<table class='표 숫자표'><thead><tr>" + 열.filter(function (k) { return k !== 최종열; }).map(function (k) { return "<th>" + k + "</th>"; }).join("") + "<th>최종 ours</th></tr></thead><tbody>" +
      줄.map(function (r) {
        var 최 = 최종열 && 최종이냐(r);
        return "<tr" + (최 ? " style='background:#ECEAFD'" : "") + ">" + 열.filter(function (k) { return k !== 최종열; }).map(function (k, i) { return (i === 0 ? "<th>" : "<td>") + 서식(k, r[k]) + (i === 0 ? "</th>" : "</td>"); }).join("") +
          "<td>" + (최 ? "<b>✓</b>" : "") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  합치기표("초동", "합치기_초동"); 합치기표("시기", "합치기_시기");

  // ---------- 12. PNG: 파일이 없으면 안내 문구 ----------
  Array.prototype.forEach.call(document.querySelectorAll(".그림칸 img"), function (img) {
    function 없음() { img.closest(".그림칸").classList.add("그림없음"); }
    img.addEventListener("error", 없음);
    if (img.complete && !img.naturalWidth) 없음();
  });
})();
