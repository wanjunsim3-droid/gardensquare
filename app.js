// 엘리프 마곡 가든스퀘어 면적 & 임대료 계산기 비즈니스 로직

document.addEventListener("DOMContentLoaded", () => {
  // --- 상태 변수 ---
  let currentFloor = "B1F";
  let selectedRooms = []; // 다중 선택된 호실 객체 배열
  let currentUnit = "m2"; // 'm2' or 'py'
  let estimates = {
    1: [],
    2: [],
    3: []
  };
  let activeEstimateTab = 1;
  
  // 도면 드래그 & 줌 상태
  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // --- DOM 요소 ---
  const themeToggle = document.getElementById("themeToggle");
  const floorSelector = document.getElementById("floorSelector");
  const floorTitle = document.getElementById("floorTitle");
  const blueprintViewer = document.getElementById("blueprintViewer");
  const blueprintImg = document.getElementById("blueprintImg");
  const roomGrid = document.getElementById("roomGrid");
  
  // 층 전체 요약바 요소
  const floorTotalRooms = document.getElementById("floorTotalRooms");
  const floorTotalExArea = document.getElementById("floorTotalExArea");
  const floorTotalCoArea = document.getElementById("floorTotalCoArea");
  
  const selectedRoomTitle = document.getElementById("selectedRoomTitle");
  const unitM2 = document.getElementById("unitM2");
  const unitPy = document.getElementById("unitPy");
  
  const exArea = document.getElementById("exArea");
  const exAreaUnit = document.getElementById("exAreaUnit");
  const coArea = document.getElementById("coArea");
  const coAreaUnit = document.getElementById("coAreaUnit");
  const ratioVal = document.getElementById("ratioVal");
  const roomType = document.getElementById("roomType");
  
  // 단가 입력 요소
  const unitPriceInput = document.getElementById("unitPrice");
  const priceLabel = document.getElementById("priceLabel");
  const priceSuffix = document.getElementById("priceSuffix");
  
  const leaseUnitPriceInput = document.getElementById("leaseUnitPrice");
  const leasePriceLabel = document.getElementById("leasePriceLabel");
  const leasePriceSuffix = document.getElementById("leasePriceSuffix");
  
  // 시뮬레이션 결과 요소
  const amtContract = document.getElementById("amtContract");
  const amtMiddle = document.getElementById("amtMiddle");
  const amtRemain = document.getElementById("amtRemain");
  const amtTotal = document.getElementById("amtTotal");
  
  const amtMonthlyLease = document.getElementById("amtMonthlyLease");
  const amtDeposit = document.getElementById("amtDeposit");
  
  const btnReset = document.getElementById("btnReset");
  const btnAddToEstimate = document.getElementById("btnAddToEstimate");
  
  const estimateList = document.getElementById("estimateList");
  const estCount = document.getElementById("estCount");
  const estExArea = document.getElementById("estExArea");
  const estCoArea = document.getElementById("estCoArea");
  const estTotalLease = document.getElementById("estTotalLease");
  const estTotalAmt = document.getElementById("estTotalAmt");
  
  const btnExportCSV = document.getElementById("btnExportCSV");
  const btnPrint = document.getElementById("btnPrint");
  
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomResetBtn = document.getElementById("zoomReset");

  // --- 초기 설정 ---
  initTheme();
  renderFloor(currentFloor);
  loadEstimatesFromStorage();
  
  // --- 테마 로직 ---
  function initTheme() {
    const savedTheme = localStorage.getItem("elif-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("elif-theme", newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    const sunIcon = themeToggle.querySelector(".sun-icon");
    const moonIcon = themeToggle.querySelector(".moon-icon");
    if (theme === "dark") {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    } else {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    }
  }

  // --- 도면 뷰어 줌 & 드래그 로직 ---
  function updateTransform() {
    blueprintImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  }

  blueprintViewer.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    if (e.deltaY < 0) {
      zoomLevel = Math.min(zoomLevel + zoomFactor, 4.0);
    } else {
      zoomLevel = Math.max(zoomLevel - zoomFactor, 0.5);
    }
    updateTransform();
  });

  blueprintViewer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    blueprintViewer.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      blueprintViewer.style.cursor = "grab";
    }
  });

  blueprintViewer.addEventListener("mouseleave", () => {
    if (isDragging) {
      isDragging = false;
      blueprintViewer.style.cursor = "grab";
    }
  });

  blueprintViewer.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - panX;
      startY = e.touches[0].clientY - panY;
    }
  });

  blueprintViewer.addEventListener("touchmove", (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    panX = e.touches[0].clientX - startX;
    panY = e.touches[0].clientY - startY;
    updateTransform();
  });

  blueprintViewer.addEventListener("touchend", () => {
    isDragging = false;
  });

  zoomInBtn.addEventListener("click", () => {
    zoomLevel = Math.min(zoomLevel + 0.25, 4.0);
    updateTransform();
  });

  zoomOutBtn.addEventListener("click", () => {
    zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
    updateTransform();
  });

  zoomResetBtn.addEventListener("click", () => {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    updateTransform();
  });

  // --- 층 변경 및 호실 렌더링 ---
  floorSelector.addEventListener("click", (e) => {
    const tab = e.target.closest(".floor-tab");
    if (!tab) return;
    
    document.querySelectorAll(".floor-tab").forEach(btn => btn.classList.remove("active"));
    tab.classList.add("active");
    
    currentFloor = tab.dataset.floor;
    renderFloor(currentFloor);
  });

  function renderFloor(floorName) {
    floorTitle.textContent = `${floorName === 'B1F' ? '지하 1층' : floorName.replace('F', '층')} 평면도`;
    blueprintImg.src = `assets/images/${floorName}.png`;
    blueprintImg.alt = `${floorName} 평면도`;
    
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    updateTransform();

    // 1. G드라이브 data.js의 해당 층 정보 요약바 계산 및 표시
    const rooms = ELIF_DATA[floorName] || [];
    let sumExM2 = 0;
    let sumCoM2 = 0;
    let sumExPy = 0;
    let sumCoPy = 0;
    
    rooms.forEach(r => {
      sumExM2 += r.exclusive_m2;
      sumCoM2 += r.contract_m2;
      sumExPy += r.exclusive_pyung;
      sumCoPy += r.contract_pyung;
    });
    
    floorTotalRooms.textContent = `${rooms.length}개 호실`;
    floorTotalExArea.textContent = `${formatNumber(sumExM2, 2)} ㎡ (${formatNumber(sumExPy, 2)} 평)`;
    floorTotalCoArea.textContent = `${formatNumber(sumCoM2, 2)} ㎡ (${formatNumber(sumCoPy, 2)} 평)`;

    // 2. 호실 그리드 렌더링
    roomGrid.innerHTML = "";
    rooms.forEach(roomObj => {
      const btn = document.createElement("button");
      btn.className = "room-btn";
      btn.textContent = roomObj.room;
      btn.dataset.room = roomObj.room;
      
      btn.addEventListener("click", () => {
        toggleRoomSelection(roomObj, btn);
      });
      
      roomGrid.appendChild(btn);
    });
    
    // 계산기 상태 초기화
    resetCalculatorUI();
  }

  // --- 호실 다중 선택 로직 ---
  function toggleRoomSelection(roomObj, btnElement) {
    const idx = selectedRooms.findIndex(r => r.room === roomObj.room);
    
    if (idx > -1) {
      // 이미 선택되어 있으면 제거
      selectedRooms.splice(idx, 1);
      btnElement.classList.remove("selected");
    } else {
      // 선택되어 있지 않으면 추가
      selectedRooms.push(roomObj);
      btnElement.classList.add("selected");
    }
    
    if (selectedRooms.length === 0) {
      resetCalculatorUI();
    } else {
      updateCalculatorUI();
    }
  }

  function updateCalculatorUI() {
    if (selectedRooms.length === 0) return;
    
    // 호실 타이틀 포맷팅
    if (selectedRooms.length === 1) {
      selectedRoomTitle.textContent = `${currentFloor} ${selectedRooms[0].room}호`;
    } else {
      // 호실 번호 순 정렬하여 표시
      const sortedNames = selectedRooms.map(r => r.room).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
      if (sortedNames.length <= 3) {
        selectedRoomTitle.textContent = `${sortedNames.join(", ")}호 합계`;
      } else {
        selectedRoomTitle.textContent = `${sortedNames[0]}호 외 ${sortedNames.length - 1}개 호실 합계`;
      }
    }
    
    // 용도 구분 중복 제거 나열
    const types = [...new Set(selectedRooms.map(r => r.type))];
    roomType.textContent = types.join(", ");
    
    // 면적 합계 구하기
    let totalExM2 = 0;
    let totalCoM2 = 0;
    let totalExPy = 0;
    let totalCoPy = 0;
    
    selectedRooms.forEach(r => {
      totalExM2 += r.exclusive_m2;
      totalCoM2 += r.contract_m2;
      totalExPy += r.exclusive_pyung;
      totalCoPy += r.contract_pyung;
    });
    
    const exVal = currentUnit === "m2" ? totalExM2 : totalExPy;
    const coVal = currentUnit === "m2" ? totalCoM2 : totalCoPy;
    
    exArea.textContent = formatNumber(exVal, 2);
    coArea.textContent = formatNumber(coVal, 2);
    exAreaUnit.textContent = currentUnit === "m2" ? "㎡" : "평";
    coAreaUnit.textContent = currentUnit === "m2" ? "㎡" : "평";
    
    // 가중평균 전용률
    const avgRatio = (totalExM2 / totalCoM2) * 100;
    ratioVal.textContent = avgRatio.toFixed(2);
    
    // 단가 필드 활성화
    unitPriceInput.disabled = false;
    leaseUnitPriceInput.disabled = false;
    btnAddToEstimate.disabled = false;
    
    calculatePrice();
  }

  // --- 단위 토글 이벤트 ---
  unitM2.addEventListener("click", () => {
    if (currentUnit === "m2") return;
    currentUnit = "m2";
    unitM2.classList.add("active");
    unitPy.classList.remove("active");
    updateCalculatorUI();
  });

  unitPy.addEventListener("click", () => {
    if (currentUnit === "py") return;
    currentUnit = "py";
    unitPy.classList.add("active");
    unitM2.classList.remove("active");
    updateCalculatorUI();
  });

  // --- 단가 세자리 콤마 포맷터 ---
  unitPriceInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    unitPriceInput.value = value ? parseInt(value, 10).toLocaleString() : "";
    calculatePrice();
  });

  leaseUnitPriceInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    leaseUnitPriceInput.value = value ? parseInt(value, 10).toLocaleString() : "";
    calculatePrice();
  });

  // --- 금액 실시간 계산 로직 ---
  function calculatePrice() {
    if (selectedRooms.length === 0) return;
    
    // 분양가 단가 (만원 단위)
    const rawSalePrice = unitPriceInput.value.replace(/,/g, "");
    const salePricePerPyung = rawSalePrice ? parseInt(rawSalePrice, 10) : 0;
    
    // 임대 단가 (원 단위, 기본 50,000원)
    const rawLeasePrice = leaseUnitPriceInput.value.replace(/,/g, "");
    const leasePricePerPyung = rawLeasePrice ? parseInt(rawLeasePrice, 10) : 50000;
    
    let totalSaleWon = 0;
    let totalLeaseWon = 0;
    
    selectedRooms.forEach(r => {
      // 1. 분양가 계산: 평당 분양가 * 해당 호실 계약면적(평) * 10,000원
      const roomSaleWon = salePricePerPyung * r.contract_pyung * 10000;
      totalSaleWon += roomSaleWon;
      
      // 2. 임대 가격 계산: 계약면적당 5만원 = 평당 월세 * 해당 호실 계약면적(평)
      const roomLeaseWon = leasePricePerPyung * r.contract_pyung;
      totalLeaseWon += roomLeaseWon;
    });
    
    // 분양 자금 계획
    const contractWon = totalSaleWon * 0.1;
    const middleWon = totalSaleWon * 0.5;
    const remainWon = totalSaleWon * 0.4;
    
    amtContract.textContent = formatKoreanPrice(contractWon);
    amtMiddle.textContent = formatKoreanPrice(middleWon);
    amtRemain.textContent = formatKoreanPrice(remainWon);
    amtTotal.textContent = formatKoreanPrice(totalSaleWon);
    
    // 임대 시뮬레이션
    const depositWon = totalLeaseWon * 10; // 보증금은 월세의 10배 기준 자동 산출
    amtMonthlyLease.textContent = formatKoreanPrice(totalLeaseWon);
    amtDeposit.textContent = formatKoreanPrice(depositWon);
  }

  // 한국어 금액 포맷터 (예: 5억 4,000만원)
  function formatKoreanPrice(won) {
    if (won === 0) return "0 원";
    
    const eok = Math.floor(won / 100000000);
    const remainder = won % 100000000;
    const man = Math.floor(remainder / 10000);
    
    let result = "";
    if (eok > 0) {
      result += `${eok}억 `;
    }
    if (man > 0) {
      result += `${man.toLocaleString()}만원`;
    } else if (eok > 0) {
      result += "";
    } else {
      result += `${won.toLocaleString()}원`;
    }
    
    return `${result} (${won.toLocaleString()}원)`;
  }

  function formatNumber(num, decimals = 2) {
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function resetCalculatorUI() {
    selectedRooms = [];
    selectedRoomTitle.textContent = "호실을 선택해주세요";
    roomType.textContent = "선택 안 됨";
    
    exArea.textContent = "0.00";
    coArea.textContent = "0.00";
    ratioVal.textContent = "0.0";
    
    unitPriceInput.value = "";
    unitPriceInput.disabled = true;
    
    // 임대료 입력창 초기화 및 비활성화
    leaseUnitPriceInput.value = "50,000";
    leaseUnitPriceInput.disabled = true;
    
    amtContract.textContent = "0 원";
    amtMiddle.textContent = "0 원";
    amtRemain.textContent = "0 원";
    amtTotal.textContent = "0 원";
    
    amtMonthlyLease.textContent = "0 원";
    amtDeposit.textContent = "0 원";
    
    btnAddToEstimate.disabled = true;
  }

  btnReset.addEventListener("click", () => {
    document.querySelectorAll(".room-btn").forEach(b => b.classList.remove("selected"));
    resetCalculatorUI();
  });

  // --- 관심 견적 리스트 로직 ---
  btnAddToEstimate.addEventListener("click", () => {
    if (selectedRooms.length === 0) return;
    
    // 다중 선택된 호실을 각각 개별 견적 아이템으로 쪼개서 추가
    const rawSalePrice = unitPriceInput.value.replace(/,/g, "");
    const salePricePerPyung = rawSalePrice ? parseInt(rawSalePrice, 10) : 0;
    
    const rawLeasePrice = leaseUnitPriceInput.value.replace(/,/g, "");
    const leasePricePerPyung = rawLeasePrice ? parseInt(rawLeasePrice, 10) : 50000;
    
    let addedCount = 0;
    let duplicateRooms = [];
    
    const currentTabEstimates = estimates[activeEstimateTab] || [];
    
    selectedRooms.forEach(roomObj => {
      const key = `${currentFloor}-${roomObj.room}`;
      const isExist = currentTabEstimates.some(item => `${item.floor}-${item.room}` === key);
      
      if (isExist) {
        duplicateRooms.push(roomObj.room);
        return;
      }
      
      const roomSaleWon = salePricePerPyung * roomObj.contract_pyung * 10000;
      const roomLeaseWon = leasePricePerPyung * roomObj.contract_pyung;
      
      const estimateItem = {
        id: `${Date.now()}-${roomObj.room}`,
        floor: currentFloor,
        room: roomObj.room,
        type: roomObj.type,
        exclusive_m2: roomObj.exclusive_m2,
        exclusive_pyung: roomObj.exclusive_pyung,
        contract_m2: roomObj.contract_m2,
        contract_pyung: roomObj.contract_pyung,
        unitPrice: salePricePerPyung,
        totalPrice: roomSaleWon,
        leaseUnitPrice: leasePricePerPyung,
        leasePrice: roomLeaseWon
      };
      
      currentTabEstimates.push(estimateItem);
      addedCount++;
    });
    
    if (duplicateRooms.length > 0) {
      alert(`이미 ${activeEstimateTab}차 견적서에 추가된 호실(${duplicateRooms.join(", ")})은 제외하고 추가되었습니다.`);
    }
    
    if (addedCount > 0) {
      estimates[activeEstimateTab] = currentTabEstimates;
      saveEstimatesToStorage();
      renderEstimates();
      updateComparisonDashboard();
    }
    
    // 추가 후 그리드 선택 해제 및 계산기 초기화
    document.querySelectorAll(".room-btn").forEach(b => b.classList.remove("selected"));
    resetCalculatorUI();
  });
  
  function renderEstimates() {
    estimateList.innerHTML = "";
    
    const currentTabEstimates = estimates[activeEstimateTab] || [];
    
    if (currentTabEstimates.length === 0) {
      estimateList.innerHTML = `
        <div class="empty-estimate">담긴 호실이 없습니다.<br>도면에서 호실을 선택해 견적을 추가해보세요.</div>
      `;
      updateSummary(0, 0, 0, 0, 0, 0, 0);
      return;
    }
    
    let totalExM2 = 0;
    let totalCoM2 = 0;
    let totalExPy = 0;
    let totalCoPy = 0;
    let totalAmt = 0;
    let totalLeaseAmt = 0;
    
    currentTabEstimates.forEach(item => {
      totalExM2 += item.exclusive_m2;
      totalCoM2 += item.contract_m2;
      totalExPy += item.exclusive_pyung;
      totalCoPy += item.contract_pyung;
      totalAmt += item.totalPrice;
      totalLeaseAmt += item.leasePrice;
      
      const div = document.createElement("div");
      div.className = "estimate-item";
      div.innerHTML = `
        <div class="estimate-item-info">
          <span class="estimate-item-title">${item.floor} ${item.room}호 (${item.type})</span>
          <span class="estimate-item-desc">
            전용 ${item.exclusive_m2}㎡ (${item.exclusive_pyung}평) | 
            분양 ${item.contract_m2}㎡ (${item.contract_pyung}평)<br>
            분양가: ${item.unitPrice > 0 ? (item.unitPrice).toLocaleString() + '만원/평' : '단가미지정'} 
            | 월세: ${(item.leaseUnitPrice).toLocaleString()}원/평 (${(item.leasePrice).toLocaleString()}원)
          </span>
        </div>
        <button class="btn-delete" data-id="${item.id}" title="삭제" aria-label="삭제">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      
      div.querySelector(".btn-delete").addEventListener("click", () => {
        removeEstimate(item.id);
      });
      
      estimateList.appendChild(div);
    });
    
    updateSummary(currentTabEstimates.length, totalExM2, totalCoM2, totalExPy, totalCoPy, totalAmt, totalLeaseAmt);
  }
  
  function removeEstimate(id) {
    estimates[activeEstimateTab] = (estimates[activeEstimateTab] || []).filter(item => item.id !== id);
    saveEstimatesToStorage();
    renderEstimates();
    updateComparisonDashboard();
  }
  
  function updateSummary(count, exM2, coM2, exPy, coPy, totalAmtVal, totalLeaseVal) {
    estCount.textContent = `${count} 개`;
    estExArea.textContent = `${formatNumber(exM2, 2)} ㎡ (${formatNumber(exPy, 2)} 평)`;
    estCoArea.textContent = `${formatNumber(coM2, 2)} ㎡ (${formatNumber(coPy, 2)} 평)`;
    estTotalLease.textContent = formatKoreanPrice(totalLeaseVal);
    estTotalAmt.textContent = formatKoreanPrice(totalAmtVal);
  }
  
  function saveEstimatesToStorage() {
    localStorage.setItem("elif-estimates-v2", JSON.stringify(estimates));
  }
  
  function loadEstimatesFromStorage() {
    const dataV2 = localStorage.getItem("elif-estimates-v2");
    if (dataV2) {
      try {
        estimates = JSON.parse(dataV2);
        if (!estimates[1]) estimates[1] = [];
        if (!estimates[2]) estimates[2] = [];
        if (!estimates[3]) estimates[3] = [];
      } catch (e) {
        estimates = { 1: [], 2: [], 3: [] };
      }
    } else {
      const oldData = localStorage.getItem("elif-estimates");
      if (oldData) {
        try {
          const oldList = JSON.parse(oldData);
          estimates = {
            1: Array.isArray(oldList) ? oldList : [],
            2: [],
            3: []
          };
          saveEstimatesToStorage();
          localStorage.removeItem("elif-estimates");
        } catch (e) {
          estimates = { 1: [], 2: [], 3: [] };
        }
      } else {
        estimates = { 1: [], 2: [], 3: [] };
      }
    }
    renderEstimates();
    updateComparisonDashboard();
  }
  
  // --- 엑셀(CSV) 다운로드 ---
  btnExportCSV.addEventListener("click", () => {
    const currentTabEstimates = estimates[activeEstimateTab] || [];
    if (currentTabEstimates.length === 0) {
      alert(`${activeEstimateTab}차 견적에 다운로드할 호실이 없습니다.`);
      return;
    }
    
    let csvContent = "\ufeff"; // BOM
    csvContent += "층,호실,용도구분,전용면적(㎡),전용면적(평),분양면적(㎡),분양면적(평),평당분양가(만원),총분양가(원),평당월세(원),총월세(원)\n";
    
    let totalExM2 = 0;
    let totalCoM2 = 0;
    let totalExPy = 0;
    let totalCoPy = 0;
    let totalAmt = 0;
    let totalLease = 0;
    
    currentTabEstimates.forEach(item => {
      totalExM2 += item.exclusive_m2;
      totalCoM2 += item.contract_m2;
      totalExPy += item.exclusive_pyung;
      totalCoPy += item.contract_pyung;
      totalAmt += item.totalPrice;
      totalLease += item.leasePrice;
      
      csvContent += `${item.floor},${item.room},${item.type},${item.exclusive_m2},${item.exclusive_pyung},${item.contract_m2},${item.contract_pyung},${item.unitPrice},${item.totalPrice},${item.leaseUnitPrice},${item.leasePrice}\n`;
    });
    
    csvContent += `합계,${currentTabEstimates.length}개 호실,,${totalExM2.toFixed(2)},${totalExPy.toFixed(2)},${totalCoM2.toFixed(2)},${totalCoPy.toFixed(2)},,${totalAmt},,${totalLease}\n`;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `엘리프_마곡_가든스퀘어_${activeEstimateTab}차_견적서_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  btnPrint.addEventListener("click", () => {
    const currentTabEstimates = estimates[activeEstimateTab] || [];
    if (currentTabEstimates.length === 0) {
      alert("인쇄할 견적 호실이 없습니다.");
      return;
    }
    window.print();
  });
  
  // --- 견적 탭 전환 이벤트 ---
  const estimateTabs = document.getElementById("estimateTabs");
  estimateTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".estimate-tab");
    if (!tab) return;
    
    document.querySelectorAll(".estimate-tab").forEach(btn => btn.classList.remove("active"));
    tab.classList.add("active");
    
    activeEstimateTab = parseInt(tab.dataset.tab, 10);
    renderEstimates();
  });
  
  // --- 비교 대시보드 데이터 갱신 ---
  function updateComparisonDashboard() {
    for (let tabNum = 1; tabNum <= 3; tabNum++) {
      const tabEstimates = estimates[tabNum] || [];
      
      const countEl = document.getElementById(`compareCount${tabNum}`);
      const exAreaEl = document.getElementById(`compareExArea${tabNum}`);
      const coAreaEl = document.getElementById(`compareCoArea${tabNum}`);
      const ratioEl = document.getElementById(`compareRatio${tabNum}`);
      const leaseEl = document.getElementById(`compareLease${tabNum}`);
      const amtEl = document.getElementById(`compareAmt${tabNum}`);
      
      if (!countEl) continue;
      
      if (tabEstimates.length === 0) {
        countEl.textContent = "-";
        exAreaEl.textContent = "-";
        coAreaEl.textContent = "-";
        ratioEl.textContent = "-";
        leaseEl.textContent = "-";
        amtEl.textContent = "-";
        continue;
      }
      
      let sumExM2 = 0;
      let sumCoM2 = 0;
      let sumExPy = 0;
      let sumCoPy = 0;
      let sumTotalPrice = 0;
      let sumLeasePrice = 0;
      
      tabEstimates.forEach(item => {
        sumExM2 += item.exclusive_m2;
        sumCoM2 += item.contract_m2;
        sumExPy += item.exclusive_pyung;
        sumCoPy += item.contract_pyung;
        sumTotalPrice += item.totalPrice;
        sumLeasePrice += item.leasePrice;
      });
      
      countEl.textContent = `${tabEstimates.length}개 호실`;
      exAreaEl.textContent = `${sumExM2.toFixed(2)}㎡ (${sumExPy.toFixed(2)}평)`;
      coAreaEl.textContent = `${sumCoM2.toFixed(2)}㎡ (${sumCoPy.toFixed(2)}평)`;
      
      const avgRatio = (sumExM2 / sumCoM2) * 100;
      ratioEl.textContent = `${avgRatio.toFixed(2)}%`;
      
      leaseEl.textContent = formatKoreanPriceCompact(sumLeasePrice);
      amtEl.textContent = formatKoreanPriceCompact(sumTotalPrice);
    }
  }
  
  function formatKoreanPriceCompact(won) {
    if (won === 0) return "0원";
    
    const eok = Math.floor(won / 100000000);
    const remainder = won % 100000000;
    const man = Math.floor(remainder / 10000);
    
    let result = "";
    if (eok > 0) {
      result += `${eok}억 `;
    }
    if (man > 0) {
      result += `${man.toLocaleString()}만`;
    }
    
    return eok > 0 || man > 0 ? `${result}원` : `${won.toLocaleString()}원`;
  }
});
