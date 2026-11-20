// 화면 동작 — 공통 머리글 메뉴 + 1페이지(AI와 다음 앨범 맞춰보기, 존댓말)
(function () {
  "use strict";

  // ---------- 공통: 폰 접는 메뉴 ----------
  var 메뉴버튼 = document.querySelector(".메뉴버튼"), 메뉴 = document.querySelector(".메뉴");
  if (메뉴버튼 && 메뉴) 메뉴버튼.addEventListener("click", function () {
    var 열림 = 메뉴.classList.toggle("열림");
    메뉴버튼.setAttribute("aria-expanded", 열림 ? "true" : "false");
  });

  if (!document.getElementById("예측페이지")) return;

  // 팀 목록: albums.js의 TEAMS (정식이름·소속사·묶음·별칭 + 예측용 회사·성별·그룹여부)
  var M = window.MODEL, P = window.Predict, A = window.TEAMS || window.ARTISTS || [], AL = window.ALBUMS || {};
  var $ = function (id) { return document.getElementById(id); };
  var 숫자 = function (n) { return Math.round(n).toLocaleString("ko-KR"); };
  var 퍼 = function (p) { return (p * 100).toFixed(1) + "%"; };
  function 글(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function 배지(a) { return a.데이터 ? "<span class='배지 데이터'>학습 데이터</span>" : "<span class='배지 밖'>학습 데이터 밖</span>"; }
  var 움직임줄임 = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 검색용: 소문자, 띄어쓰기·기호 빼기 ("Girls' Generation" → "girlsgeneration", "NCT 127" → "nct127")
  var 줄이기 = function (s) { return String(s || "").toLowerCase().replace(/[\s'’"!.\-&(),·]/g, ""); };
  function 소속사(a) { return a.소속사 || (a.회사 === "그 외" ? "그 밖의 소속사" : a.회사); }
  function 보일이름(a) { return a.정식이름 || a.이름; }
  // 팀마다 검색 열쇠: 한글 이름 + 정식 이름 + 별칭들
  A.forEach(function (a) {
    a.열쇠 = [a.이름, a.정식이름].concat(String(a.별칭 || "").split(/\s+/)).map(줄이기).filter(Boolean);
  });
  function 맞나(a, q) { return !q || a.열쇠.some(function (k) { return k.indexOf(q) >= 0; }); }
  function 딱맞나(a, q) { return a.열쇠.indexOf(q) >= 0; }

  // ================= 1. 아티스트: 소속사별 펼침 =================
  var 회사들 = [];       // 팀정보.csv에 나온 순서대로
  A.forEach(function (a) { if (회사들.indexOf(소속사(a)) < 0) 회사들.push(소속사(a)); });
  var 지금팀 = null, 열린회사 = {}, 대기 = null;

  $("회사목록").innerHTML = 회사들.map(function (c, n) {
    var 팀들 = A.filter(function (a) { return 소속사(a) === c; });
    var 모두밖 = 팀들.every(function (a) { return !a.데이터; });
    return "<div class='회사칸' data-n='" + n + "'>" +
      "<button type='button' class='회사버튼' aria-expanded='false'>" +
        "<span class='회사이름'>" + 글(c) + (모두밖 ? " <small>학습 데이터 밖</small>" : "") + "</span>" +
        "<span class='회사수'>" + 팀들.length + "팀</span><span class='회사화살표' aria-hidden='true'>▾</span></button>" +
      "<div class='회사몸'><div class='회사안'></div></div></div>";
  }).join("");

  function 팀칩(a) {
    var 한글 = (a.이름 !== 보일이름(a) ? "<small>" + 글(a.이름) + "</small>" : "") + (a.활동종료 ? "<small class='종료'>활동 종료</small>" : "");
    return "<button type='button' class='팀칩" + (a === 지금팀 ? " 고름" : "") + (a.데이터 ? "" : " 밖팀") + "' data-i='" + A.indexOf(a) + "'>" +
      글(보일이름(a)) + 한글 + "</button>";
  }

  // 소속사 안에서 나누는 줄: 팀정보.csv의 '묶음'(예: SM은 계열, 하이브는 레이블). 비어 있으면 그룹/솔로
  function 줄들(팀들) {
    var 이름들 = [], 모음 = {};
    팀들.forEach(function (a) {
      var k = a.묶음 || (a.그룹여부 ? "그룹" : "솔로");
      if (!모음[k]) { 모음[k] = []; 이름들.push(k); }
      모음[k].push(a);
    });
    return 이름들.map(function (k) {
      return "<div class='묶음'><span class='묶음이름'>" + 글(k) + "</span><div class='칩들'>" + 모음[k].map(팀칩).join("") + "</div></div>";
    }).join("");
  }

  // 검색어가 있으면: 맞는 팀이 있는 소속사만 보이고 자동으로 펼침. 없으면: 누른 소속사만 펼침
  function 목록그리기() {
    var q = 줄이기($("검색").value.trim()), 맞은수 = 0;
    회사들.forEach(function (c, n) {
      var 칸 = document.querySelector(".회사칸[data-n='" + n + "']");
      var 팀들 = A.filter(function (a) { return 소속사(a) === c && 맞나(a, q); });
      맞은수 += 팀들.length;
      칸.querySelector(".회사안").innerHTML = 줄들(팀들);
      칸.classList.toggle("숨김", !!q && !팀들.length);
      펼치기(칸, q ? 팀들.length > 0 : !!열린회사[c]);
    });
    $("검색안내").textContent = q && !맞은수 ? "찾는 팀이 없습니다. 아래 '숫자로 직접 넣어 보기'를 이용해 주세요."
      : "이름을 입력하거나, 아래에서 소속사를 눌러 팀을 찾아보세요.";
    return q;
  }
  function 펼치기(칸, 열기) {
    칸.classList.toggle("열림", 열기);
    칸.querySelector(".회사버튼").setAttribute("aria-expanded", 열기 ? "true" : "false");
  }

  $("회사목록").addEventListener("click", function (e) {
    var 버튼 = e.target.closest(".회사버튼");
    if (버튼) {
      var 칸 = 버튼.parentNode, 값 = 회사들[+칸.dataset.n];
      var 열기 = !칸.classList.contains("열림");
      열린회사[값] = 열기;
      펼치기(칸, 열기);
      return;
    }
    var 칩 = e.target.closest(".팀칩");
    if (칩) 팀고름(A[+칩.dataset.i]);
  });

  // 타이핑하면 목록이 좁혀지고, 한 팀으로 정해지면(정확히 같은 이름이거나 하나만 남으면) 바로 앨범이 나옴
  $("검색").addEventListener("input", function () {
    var q = 목록그리기();
    clearTimeout(대기);
    if (!q) return;
    var 맞은 = A.filter(function (a) { return 맞나(a, q); });
    var 정확 = 맞은.filter(function (a) { return 딱맞나(a, q); })[0];
    var 고를팀 = 정확 || (맞은.length === 1 ? 맞은[0] : null);
    if (고를팀 && 고를팀 !== 지금팀) 대기 = setTimeout(function () { 팀고름(고를팀); }, 250);
  });
  $("검색").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var 첫 = $("회사목록").querySelector(".회사칸:not(.숨김) .팀칩");
    if (첫) { e.preventDefault(); 팀고름(A[+첫.dataset.i]); }
  });

  // ================= 2. 앨범 =================
  function 팀고름(a) {
    지금팀 = a;
    열린회사[소속사(a)] = true;          // 고른 팀의 소속사는 펼친 채로 둠
    목록그리기();
    var 목록 = AL[a.이름] || [];
    $("앨범제목").innerHTML = 글(보일이름(a)) + (보일이름(a) !== a.이름 ? " <small class='한글이름'>" + 글(a.이름) + "</small>" : "") + "의 앨범 " + 배지(a);
    // '기타 소속사'·하이브는 안쪽 줄(묶음)이 실제 소속사·레이블 이름이라 그걸 보여줌
    var 보일소속 = 소속사(a) === "기타 소속사" && a.묶음 ? a.묶음 : /하이브/.test(소속사(a)) && a.묶음 ? 소속사(a) + " · " + a.묶음 : 소속사(a);
    $("앨범설명").textContent = 보일소속 + " · " + (a.성별 === "남" ? "남자" : "여자") + " " + (a.그룹여부 ? "그룹" : "솔로") +
      " · 앨범 " + 목록.length + "개. 하나를 누르면 그 앨범이 막 나온 날을 기준으로 예측합니다.";
    // 최신이 위로. 활동을 마친 그룹의 마지막 앨범은 '다음 앨범'이 없으니 예측하지 않음
    var 끝난팀 = !!a.활동종료, 마지막 = 목록.length - 1;
    $("앨범목록").innerHTML = 목록.map(function (x, i) { return { x: x, i: i }; }).reverse().map(function (o) {
      var x = o.x, 끝 = 끝난팀 && o.i === 마지막, 못씀 = x.초동 == null || 끝;
      return "<li><button type='button' class='앨범줄' data-i='" + o.i + "'" + (못씀 ? " disabled" : "") + ">" +
        "<span class='앨범날짜'>" + x.날짜 + "</span>" +
        "<span class='앨범이름'>" + 글(x.앨범) + "</span>" +
        "<span class='앨범유형 유형" + 글(x.유형) + "'>" + 글(x.유형) + "</span>" +
        (끝 ? "<span class='작게'>마지막 앨범 · 예측 불가</span>" : x.초동 == null ? "<span class='작게'>초동 기록 없음</span>" : (x.출처 ? "<span class='새앨범'>학습 안 한 앨범</span>" : "")) +
        "</button></li>";
    }).join("");
    var 메모 = [];
    if (끝난팀) 메모.push(a.활동종료 + "년에 활동을 마친 그룹이라 앞으로의 앨범은 예측할 수 없습니다. 지난 앨범을 눌러 그다음 앨범을 맞혔는지는 확인할 수 있습니다.");
    var 확인중 = (window.ALBUMS_PENDING || {})[a.이름] || [];
    if (확인중.length) 메모.push("이후 앨범 " + 확인중.map(function (p) { return p.앨범 + " (" + p.날짜 + ")"; }).join(", ") + "은(는) 유형·초동을 확인하고 있어 아직 목록에 없습니다.");
    if (a.회사 === "그 외") 메모.push("학습 데이터(SM·JYP·스타쉽)에 없는 소속사라서, 예측할 때 소속사 칸을 모두 0으로 넣습니다.");
    if (!목록.some(function (x) { return x.초동 != null; })) 메모.push("이 팀은 한터 초동 기록을 찾지 못해서 아직 예측할 수 있는 앨범이 없습니다.");
    $("앨범메모").textContent = 메모.join(" ");
    보이기(2);
    $("단계2").scrollIntoView({ block: "start" });
  }

  $("앨범목록").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-i]");
    if (!b || b.disabled) return;
    Array.prototype.forEach.call($("앨범목록").querySelectorAll(".앨범줄"), function (x) { x.classList.toggle("고름", x === b); });
    앨범고름(+b.dataset.i);
  });

  // ================= 3. 로딩 → 예측 =================
  var 지금결과 = null, 로딩중 = null;
  function 앨범고름(i) {
    var r = P.앨범맞춰보기(지금팀, i);
    지금결과 = r;
    보이기(3);
    $("예측결과").classList.add("숨김");
    $("로딩").classList.remove("숨김");
    $("단계3").scrollIntoView({ block: "start" });
    var 문구 = ["'" + r.앨범.앨범 + "'의 초동을 꺼내고 있습니다…", "후보 모델들이 각자 다음 초동 확률을 계산하고 있습니다…", "메타 로지스틱이 어느 모델을 얼마나 믿을지 정해 섞고 있습니다…"];
    var 칸 = 0;
    $("로딩글").textContent = 문구[0];
    clearInterval(로딩중);
    로딩중 = setInterval(function () {
      칸++;
      if (칸 < 문구.length) { $("로딩글").textContent = 문구[칸]; return; }
      clearInterval(로딩중);
      예측보여주기(r);
    }, 움직임줄임 ? 150 : 650);
  }

  // 초동 설명: 어떤 값을 모델에 넣었는지 (노트북 '초동값'의 재료)
  function 초동재료글(x, r) {
    var 재 = r.초동재료 || {}, 글 = "이 앨범의 초동 " + 숫자(x.초동) + "장을 직전 초동으로 넣었습니다.";
    if ("최근2평균" in 재 || "log최근2평균" in 재) 글 += " 그 앞 앨범 초동과의 평균도 함께 봅니다.";
    if ("공백일" in 재 || "연도" in 재) 글 += " 다음 앨범의 발매일(" + (r.실제.초동 ? r.실제.초동.날짜 : "") + ")과 앨범 유형도 함께 봅니다.";
    return 글;
  }
  // '150일 이하'가 예측으로 나오는지: model.js에 적힌 학습 데이터 예측 분포로 말한다
  function 안나옴글() {
    var 분포 = M.시기.학습_예측분포, 총 = M.학습앨범수 && M.학습앨범수.시기;
    return (분포 && 분포[0] === 0 && 총)
      ? "'150일 이하'는 이 모델에서 예측으로 나오지 않습니다 (학습 데이터 " + 총 + "개 중 0번)."
      : "";
  }

  function 막대들(확률, 이름들, 예측) {
    return 확률.map(function (p, k) {
      return "<div class='막대줄" + (k === 예측 ? " 예측" : "") + "'><span>" + 이름들[k] + "</span>" +
        "<div class='막대틀' role='img' aria-label='" + 이름들[k] + " " + 퍼(p) + "'><div class='막대' style='width:" + (p * 100).toFixed(1) + "%'></div></div>" +
        "<span class='퍼센트'>" + 퍼(p) + "</span></div>";
    }).join("");
  }

  function 예측보여주기(r) {
    var x = r.앨범;
    $("로딩").classList.add("숨김");
    $("예측결과").classList.remove("숨김");
    $("기준줄").innerHTML = "<b>" + 글(보일이름(지금팀)) + " · " + 글(x.앨범) + "</b> (" + x.날짜 + ", " + 글(x.유형) + ")이(가) 막 나온 날로 돌아가서, <b>그다음 앨범</b>을 예측했습니다.";
    // 초동
    if (r.초동) {
      $("초동등급").className = "등급";
      $("초동등급").innerHTML = M.초동_이름[r.초동.등급] + "<small>" + 퍼(r.초동.확률[r.초동.등급]) + "</small>";
      $("초동막대").innerHTML = 막대들(r.초동.확률, M.초동_이름, r.초동.등급);
      $("초동설명").textContent = 초동재료글(x, r);
    } else {
      $("초동등급").className = "등급 없음";
      $("초동등급").textContent = "예측하지 않음";
      $("초동막대").innerHTML = "";
      $("초동설명").textContent = r.초동이유 || "이 앨범은 초동 기록이 없어서 예측하지 않습니다.";
    }
    // 시기
    if (r.시기) {
      $("시기등급").className = "등급";
      $("시기등급").innerHTML = M.시기_이름[r.시기.등급] + "<small>" + 퍼(r.시기.확률[r.시기.등급]) + "</small>";
      $("시기날짜").textContent = r.시기날짜.까지 ? r.시기날짜.부터 + " ~ " + r.시기날짜.까지 + " 사이" : r.시기날짜.부터 + " 이후";
      $("시기막대").innerHTML = 막대들(r.시기.확률, M.시기_이름, r.시기.등급);
      var 차 = Math.abs(r.시기.확률[1] - r.시기.확률[2]);
      $("시기설명").textContent = (r.시기재료.데뷔작 ? "데뷔작이라 공백일을 0으로 넣었습니다. " : "그 앞 본앨범과 " + r.공백일 + "일 간격, " + (r.앨범.본순번 || 1) + "번째 본앨범입니다. ") +
        (차 < 0.1 ? "151~300일과 300일 초과의 차이가 " + (차 * 100).toFixed(1) + "%p뿐이라 접전입니다. " : "") +
        안나옴글();
    } else {
      $("시기등급").className = "등급 없음";
      $("시기등급").textContent = "예측하지 않음";
      $("시기날짜").textContent = "";
      $("시기막대").innerHTML = "";
      $("시기설명").textContent = r.시기이유;
    }
    $("실제버튼").classList.remove("숨김");
    $("단계4").classList.add("숨김");
  }

  // ================= 4. 실제 값 =================
  $("실제버튼").addEventListener("click", function () {
    var r = 지금결과; if (!r) return;
    var 실 = r.실제;
    function 채점(이름, 예측등급, 정답등급, 이름들) {
      var ok = 예측등급 === 정답등급;
      return "<div class='채점 " + (ok ? "맞음" : "틀림") + "'><span>" + 이름 + "</span><b>" + 이름들[예측등급] + "</b><em>" + (ok ? "맞음" : "틀림") + "</em></div>";
    }
    var 초html = "<div class='예측칸'><div class='예측이름'>다음 앨범 초동</div>";
    if (실.초동) {
      var c = 실.초동;
      초html += "<div class='실제값'>" + 숫자(c.초동) + "장</div><p class='실제앨범'>" + 글(c.앨범) + " (" + c.날짜 + ", " + 글(c.유형) + ") → <b>" + M.초동_이름[실.초동등급] + "</b></p>" +
        (r.초동 ? 채점("AI", r.초동.등급, 실.초동등급, M.초동_이름) : "") + (r.초동사람 != null ? 채점("사람 모델", r.초동사람, 실.초동등급, M.초동_이름) : "");
    } else {
      초html += "<div class='실제값 없음'>아직 모릅니다</div><p class='실제앨범'>초동이 확인된 다음 앨범이 아직 목록에 없습니다 (2026-11-18 기준).</p>" + 확인중글(실.확인중, true);
    }
    초html += "</div>";
    var 시html = "<div class='예측칸'><div class='예측이름'>다음 컴백</div>";
    if (실.시기) {
      var s = 실.시기;
      시html += "<div class='실제값'>" + 실.일수 + "일 뒤</div><p class='실제앨범'>" + 글(s.앨범) + " (" + s.날짜 + ", " + 글(s.유형) + ") → <b>" + M.시기_이름[실.시기등급] + "</b></p>" +
        (r.시기 ? 채점("AI", r.시기.등급, 실.시기등급, M.시기_이름) + 채점("사람 모델", r.시기사람, 실.시기등급, M.시기_이름) : "<p class='작게'>시기는 예측하지 않은 앨범입니다.</p>");
    } else {
      시html += "<div class='실제값 없음'>아직 모릅니다</div><p class='실제앨범'>다음 본앨범이 아직 목록에 없습니다 (2026-11-18 기준).</p>" + 확인중글(실.확인중, false);
    }
    시html += "</div>";
    $("실제두칸").innerHTML = 초html + 시html;
    var 다음 = 실.초동 || 실.시기;
    $("실제메모").textContent = !다음 ? "" :
      (!r.앨범.출처 && !다음.출처)
        ? "참고: 이 앨범과 다음 앨범은 모델이 배운 기간(2015~2025)의 데이터라서, 모델이 정답을 본 적이 있는 '복습 문제'입니다."
        : "이 정답은 모델이 학습할 때 본 적 없는 앨범이라 '진짜 시험'입니다.";
    보이기(4);
    $("단계4").scrollIntoView({ block: "start" });
  });

  function 확인중글(목록, 초동이냐) {
    if (!목록 || !목록.length) return "";
    var p = 목록[0];
    return "<p class='작게 메모'>다만 " + 글(p.앨범) + " (" + p.날짜 + ")이(가) 나온 것은 알고 있습니다. " +
      (초동이냐 && p.초동 != null ? "알려진 초동은 " + 숫자(p.초동) + "장이지만, " : "") + "유형·초동을 확인하고 있어 채점하지 않습니다.</p>";
  }

  function 보이기(n) {
    for (var k = 2; k <= 4; k++) $("단계" + k).classList.toggle("숨김", k > n);
  }

  // ================= 목록에 없는 팀: 직접 입력 =================
  var 폼 = $("직접모드");
  폼.addEventListener("input", 직접계산);
  폼.addEventListener("change", 직접계산);
  $("데뷔작").addEventListener("change", function () { $("앞발매일").disabled = this.checked; });

  function 직접계산() {
    var f = 폼.elements, 오류 = [];
    var 데뷔 = $("데뷔작").checked;
    var 초동 = +f.초동.value, 발매일 = f.발매일.value, 앞 = 데뷔 ? "" : f.앞발매일.value, 순번 = +f.앨범순번.value;
    var 앞초동 = +f.앞초동.value || null, 다음일 = f.다음발매일.value || null;
    if (!(초동 >= 1)) 오류.push("최근 앨범 초동을 넣어 주세요");
    if (!발매일) 오류.push("최근 앨범 발매일을 넣어 주세요");
    if (!데뷔 && !앞) 오류.push("그 앞 앨범 발매일을 넣거나 '데뷔작'을 체크해 주세요");
    if (앞 && 발매일 && P.일수차(발매일, 앞) <= 0) 오류.push("그 앞 앨범 발매일이 더 앞이어야 합니다");
    if (!(순번 >= 1) || 순번 !== Math.floor(순번)) 오류.push("앨범순번은 1 이상의 정수로 넣어 주세요");
    $("직접오류").textContent = 오류.join(" · ");
    if (오류.length) { $("직접결과").innerHTML = ""; return; }
    P.초동확인();
    var 초 = null, 초부족 = "";
    try {
      초 = P.초동확률(P.초동재료({ 직전초동: 초동, 직직전초동: 앞초동, 직전발매일: 발매일, 발매일: 다음일, 유형: f.다음유형.value }));
    } catch (e) {
      if (!e.부족) throw e;
      초부족 = "초동 모델은 다음 앨범의 " + e.부족.join("·") + " 정보가 필요합니다. '다음 앨범 발매 예정일' 칸에 날짜를 넣어 주세요.";
    }
    var 재 = P.시기재료({ 초동: 초동, 발매일: 발매일, 직전발매일: 앞 || null, 앨범순번: 순번,
      유형: f.유형.value, 회사: f.회사.value, 성별: f.성별.value, 그룹여부: +f.그룹.value });
    var 시 = P.시기확률(재), 날 = P.시기날짜(발매일, 시.등급);
    // 사람 모델: 초동 = 설문 가중 모델(직전초동·직직전초동·직전 앨범 유형), 시기 = 직전 공백 그대로
    var 사초 = P.사람초동({ 직전초동: 초동, 직직전초동: 앞초동, 직전유형: f.최근리패.checked ? "리패키지" : f.유형.value });
    var 사시 = P.사람시기(재.공백일, 재.데뷔작);
    $("직접결과").innerHTML =
      "<div class='예측칸'><div class='예측이름'>다음 앨범 초동</div>" +
      (초 ? "<div class='등급'>" + M.초동_이름[초.등급] + "<small>" + 퍼(초.확률[초.등급]) + "</small></div><div class='막대들'>" + 막대들(초.확률, M.초동_이름, 초.등급) + "</div>"
          : "<div class='등급 없음'>예측하지 않음</div><p class='작게'>" + 초부족 + "</p>") +
      "<p class='사람답'>사람 모델이라면 <b>" + M.초동_이름[사초] + "</b></p></div>" +
      "<div class='예측칸'><div class='예측이름'>다음 컴백</div><div class='등급'>" + M.시기_이름[시.등급] + "<small>" + 퍼(시.확률[시.등급]) + "</small></div>" +
      "<p class='날짜범위'>" + (날.까지 ? 날.부터 + " ~ " + 날.까지 + " 사이" : 날.부터 + " 이후") + "</p>" +
      "<div class='막대들'>" + 막대들(시.확률, M.시기_이름, 시.등급) + "</div>" +
      "<p class='사람답'>사람 모델이라면 <b>" + M.시기_이름[사시] + "</b></p></div>";
  }
  직접계산();

  // ---------- 시작 ----------
  목록그리기();
})();
