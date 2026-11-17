// Firebase SDKとSortableJS(ドラッグ並び替え用)のインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, serverTimestamp, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.1/modular/sortable.esm.js';

// ==========================================
// Firebase設定
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyA3lQx9TI9CFN0Ww4sSGl56FAwYo-1YVQk",
    authDomain: "rsvp-d9e66.firebaseapp.com",
    projectId: "rsvp-d9e66",
    storageBucket: "rsvp-d9e66.firebasestorage.app",
    messagingSenderId: "483012227307",
    appId: "1:483012227307:web:1d8c35346a5cdd50da4eae",
    measurementId: "G-4PK6C23RPR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

// スマホでの自動ズームを防ぐため、メタタグを追加
if (!document.querySelector("meta[name=viewport]")) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
}

// 横スクロールバーを非表示にするためのCSSを注入
const style = document.createElement('style');
style.innerHTML = `
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
document.head.appendChild(style);

document.body.className = "bg-[#EFECE6] min-h-screen text-[#333333] font-sans antialiased selection:bg-[#7B2C3A] selection:text-white relative overflow-x-hidden text-sm md:text-base";
const appDiv = document.getElementById('app');
appDiv.className = "bg-[#FCFBF7] p-3 md:p-6 shadow-xl border border-stone-200 border-t-[6px] border-t-[#7B2C3A] rounded-sm w-full max-w-4xl mx-auto mt-2 md:mt-6 mb-10";

// ==========================================
// 共通のカスタムモーダル機能
// ==========================================
const modalHTML = `
    <div id="customModal" class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900 bg-opacity-60 hidden backdrop-blur-sm transition-opacity px-4">
        <div class="bg-white rounded-sm shadow-2xl p-5 w-full max-w-sm">
            <h3 id="modalTitle" class="font-bold text-base md:text-lg mb-3 text-[#7B2C3A] border-b border-stone-200 pb-2"></h3>
            <p id="modalMessage" class="text-sm text-stone-700 mb-4 leading-relaxed"></p>
            <input type="text" id="modalInput" class="hidden w-full border border-stone-300 p-2 rounded-sm mb-4 focus:border-[#7B2C3A] focus:outline-none text-center tracking-widest text-lg bg-stone-50" inputmode="numeric" pattern="[0-9]*" maxlength="4">
            <div class="flex justify-end gap-2">
                <button id="modalCancelBtn" class="px-4 py-2 bg-stone-200 text-stone-700 rounded-sm text-xs md:text-sm font-bold hover:bg-stone-300 transition">キャンセル</button>
                <button id="modalOkBtn" class="px-4 py-2 bg-[#7B2C3A] text-white rounded-sm text-xs md:text-sm font-bold hover:bg-[#5A1F29] transition shadow-md">OK</button>
            </div>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

function showModal(type, title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const titleEl = document.getElementById('modalTitle');
        const messageEl = document.getElementById('modalMessage');
        const inputEl = document.getElementById('modalInput');
        const cancelBtn = document.getElementById('modalCancelBtn');
        const okBtn = document.getElementById('modalOkBtn');

        titleEl.textContent = title;
        messageEl.innerHTML = message;
        
        if (type === 'prompt') {
            inputEl.classList.remove('hidden');
            inputEl.value = '';
            setTimeout(() => inputEl.focus(), 100);
            inputEl.oninput = (e) => e.target.value = e.target.value.replace(/[^0-9]/g, '');
            cancelBtn.classList.remove('hidden');
        } else if (type === 'alert') {
            inputEl.classList.add('hidden');
            cancelBtn.classList.add('hidden');
        } else {
            inputEl.classList.add('hidden');
            cancelBtn.classList.remove('hidden');
        }

        modal.classList.remove('hidden');

        const cleanup = () => {
            modal.classList.add('hidden');
            cancelBtn.onclick = null;
            okBtn.onclick = null;
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };

        okBtn.onclick = () => {
            const val = type === 'prompt' ? inputEl.value : true;
            cleanup();
            resolve(val);
        };
    });
}

// ==========================================
// 各種SVGアイコン
// ==========================================
const svgChevron = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
const svgEdit = `<svg class="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`;
const svgSearch = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`;
const svgPlus = `<svg class="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>`;
const svgTrash = `<svg class="w-4 h-4 md:w-5 md:h-5 text-stone-400 hover:text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
const svgDrag = `<svg class="w-4 h-4 md:w-5 md:h-5 text-stone-400 cursor-grab touch-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>`;

const svgMaru = `<svg viewBox="0 0 24 24" class="w-4 h-4 inline-block text-emerald-600" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="8"></circle></svg>`;
const svgSankaku = `<svg viewBox="0 0 24 24" class="w-4 h-4 inline-block text-amber-500" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 4L3 19h18L12 4z" stroke-linejoin="round"></path></svg>`;
const svgBatsu = `<svg viewBox="0 0 24 24" class="w-4 h-4 inline-block text-rose-600" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 7l10 10M17 7L7 17" stroke-linecap="round"></path></svg>`;
const svgDash = `<svg viewBox="0 0 24 24" class="w-4 h-4 inline-block text-stone-400" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14" stroke-linecap="round"></path></svg>`;

function generateTimeOptions(defaultTime, minTime = null) {
    let options = `<option value="">未選択</option>`;
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            let time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            if (minTime && time <= minTime) continue;
            let selected = time === defaultTime ? 'selected' : '';
            options += `<option value="${time}" ${selected}>${time}</option>`;
        }
    }
    return options;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '未定';
    const [y, m, d] = dateStr.split('-');
    return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

function createCategoryInputRow(value = '') {
    const row = document.createElement('div');
    row.className = "flex items-center gap-1 md:gap-2 category-row bg-white p-1 rounded-sm border border-transparent hover:border-stone-200 transition w-full min-w-0";
    row.innerHTML = `
        <span class="drag-handle p-1 shrink-0">${svgDrag}</span>
        <input type="text" data-original-value="${escapeHTML(value)}" class="cat-input flex-1 min-w-0 border border-stone-300 rounded-sm p-1.5 md:p-2 text-sm md:text-base focus:outline-none focus:border-[#7B2C3A] bg-stone-50 focus:bg-white transition" value="${escapeHTML(value)}" placeholder="">
        <span class="cat-del ml-1 p-1 shrink-0">${svgTrash}</span>
    `;
    
    row.querySelector('.cat-del').addEventListener('click', () => {
        row.remove();
    });
    return row;
}

if (!eventId) {
    renderCreateEventPage();
} else {
    renderRsvpPage(eventId);
}

// ------------------------------------------
// イベント作成画面
// ------------------------------------------
function renderCreateEventPage() {
    document.title = "新規イベント作成";
    const rName = () => `field_${Math.random().toString(36).substring(2, 8)}`;
    
    appDiv.innerHTML = `
        <h1 class="text-xl md:text-2xl font-bold mb-6 text-center text-[#7B2C3A] tracking-wider">新規イベント作成</h1>
        <form autocomplete="off" onsubmit="return false;" class="space-y-4 text-sm px-1">
            <div>
                <label class="block font-bold mb-1 text-stone-700">イベント名 <span class="text-[#7B2C3A]">*</span></label>
                <input type="text" id="eventName" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white transition">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label class="block font-bold mb-1 text-stone-700">日にち</label>
                    <input type="date" id="eventDate" name="${rName()}" class="appearance-none min-w-0 w-full border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white transition">
                </div>
                <div>
                    <label class="block font-bold mb-1 text-stone-700">開始時間</label>
                    <div class="relative">
                        <select id="eventStartTime" name="${rName()}" class="appearance-none w-full border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white pr-8 transition">
                            ${generateTimeOptions('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">${svgChevron}</div>
                    </div>
                </div>
                <div>
                    <label class="block font-bold mb-1 text-stone-700">終了時間</label>
                    <div class="relative">
                        <select id="eventEndTime" name="${rName()}" class="appearance-none w-full border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white pr-8 transition">
                            ${generateTimeOptions('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">${svgChevron}</div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block font-bold mb-1 text-stone-700">参加費</label>
                <div class="flex items-center gap-2">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" id="eventFee" name="${rName()}" autocomplete="new-password" oninput="let v = this.value.replace(/[^0-9]/g, ''); this.value = v ? Number(v).toLocaleString() : '';" class="w-1/2 md:w-1/4 border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white transition text-right">
                    <span class="text-stone-700 font-bold">円</span>
                </div>
            </div>

            <div class="bg-[#F4F1EA] p-3 border border-stone-200 rounded-sm space-y-3">
                <div>
                    <label class="block font-bold mb-1 text-stone-700">表示する場所の名前 <span class="text-xs font-normal text-stone-500">（自由に編集可能）</span></label>
                    <input type="text" id="eventLocation" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white transition">
                </div>
                <div>
                    <label class="block font-bold mb-1 text-stone-700">住所 <span class="text-xs font-normal text-stone-500">（自動でマップのリンクになります）</span></label>
                    <input type="text" id="eventAddress" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white transition">
                </div>
            </div>

            <div class="bg-white p-3 border border-stone-200 rounded-sm">
                <label class="flex items-center gap-2 cursor-pointer font-bold text-stone-700 select-none">
                    <input type="checkbox" id="useCategoriesToggle" class="accent-[#7B2C3A] w-4 h-4 cursor-pointer"> 名簿にカテゴリー（グループ枠）を追加する
                </label>
                <div id="categorySetupArea" class="hidden mt-3 space-y-2 pl-1 md:pl-4 border-l-2 border-stone-200 w-full overflow-hidden">
                    <div id="categoryInputsContainer" class="space-y-1 w-full md:w-2/3 min-w-0">
                        <!-- ここにJSで枠を追加 -->
                    </div>
                    <button type="button" id="addCategoryInputBtn" class="text-xs text-[#7B2C3A] font-bold border border-[#7B2C3A] px-3 py-1.5 rounded-sm hover:bg-[#7B2C3A] hover:text-white transition mt-1 ml-6 md:ml-8">${svgPlus} 枠を追加</button>
                </div>
            </div>

            <div>
                <label class="block font-bold mb-1 text-stone-700">詳細・備考</label>
                <textarea id="eventDesc" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-2 h-24 text-base focus:outline-none focus:border-[#7B2C3A] bg-white transition"></textarea>
            </div>
            
            <div class="border-t border-stone-200 pt-4 mt-4">
                <label class="block font-bold mb-1 text-[#7B2C3A]">管理用パスワード（数字4桁） <span class="text-[#7B2C3A]">*</span></label>
                <p class="text-xs text-stone-500 mb-2">※イベント内容の編集・削除時に必要になります。</p>
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="eventPin" name="${rName()}" maxlength="4" autocomplete="new-password" oninput="this.value = this.value.replace(/[^0-9]/g, '');" class="w-1/2 md:w-1/3 border border-stone-300 rounded-sm p-2 text-base focus:outline-none focus:border-[#7B2C3A] tracking-widest bg-white transition text-center">
            </div>

            <div class="pt-2 pb-6">
                <button id="createBtn" type="button" class="w-full bg-[#7B2C3A] text-white font-bold py-3 rounded-sm hover:bg-[#5A1F29] transition shadow-md tracking-wider">イベントページを作成する</button>
            </div>
        </form>
    `;

    const startSel = document.getElementById('eventStartTime');
    const endSel = document.getElementById('eventEndTime');
    startSel.addEventListener('change', () => {
        endSel.innerHTML = generateTimeOptions(endSel.value, startSel.value);
    });

    const catContainer = document.getElementById('categoryInputsContainer');
    catContainer.appendChild(createCategoryInputRow());
    catContainer.appendChild(createCategoryInputRow());
    
    new Sortable(catContainer, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'opacity-50'
    });

    document.getElementById('useCategoriesToggle').addEventListener('change', (e) => {
        const area = document.getElementById('categorySetupArea');
        if (e.target.checked) area.classList.remove('hidden');
        else area.classList.add('hidden');
    });

    document.getElementById('addCategoryInputBtn').addEventListener('click', () => {
        const row = createCategoryInputRow();
        catContainer.appendChild(row);
        row.querySelector('input').focus();
    });

    document.getElementById('createBtn').addEventListener('click', async () => {
        const name = document.getElementById('eventName').value;
        const pin = document.getElementById('eventPin').value;
        
        if (!name) return await showModal('alert', 'エラー', 'イベント名を入力してください。');
        if (pin.length !== 4) return await showModal('alert', 'エラー', 'パスワードは数字4桁で入力してください。');

        document.getElementById('createBtn').textContent = "作成中...";
        document.getElementById('createBtn').disabled = true;

        const feeValue = document.getElementById('eventFee').value.replace(/[^0-9]/g, '');
        const formattedFee = feeValue ? `${Number(feeValue).toLocaleString()}円` : '';

        let categories = [];
        if (document.getElementById('useCategoriesToggle').checked) {
            const inputs = document.querySelectorAll('#categoryInputsContainer .cat-input');
            inputs.forEach(inp => {
                const val = inp.value.trim();
                if (val && !categories.includes(val)) categories.push(val);
            });
        }

        try {
            const docRef = await addDoc(collection(db, "events"), {
                name: name,
                date: document.getElementById('eventDate').value,
                startTime: document.getElementById('eventStartTime').value,
                endTime: document.getElementById('eventEndTime').value,
                fee: formattedFee,
                location: document.getElementById('eventLocation').value,
                address: document.getElementById('eventAddress').value,
                description: document.getElementById('eventDesc').value,
                categories: categories,
                pin: pin,
                createdAt: serverTimestamp()
            });
            window.location.assign(window.location.pathname + '?id=' + docRef.id);
        } catch (e) {
            await showModal('alert', 'エラー', '通信エラーが発生しました。設定を確認してください。');
            document.getElementById('createBtn').textContent = "イベントページを作成する";
            document.getElementById('createBtn').disabled = false;
        }
    });
}

// ------------------------------------------
// 出欠入力・一覧画面
// ------------------------------------------
async function renderRsvpPage(id) {
    appDiv.innerHTML = `<div class="text-center text-stone-500 py-10">読み込み中...</div>`;
    
    let rsvpDataList = [];
    let isAdmin = false;

    try {
        const eventSnap = await getDoc(doc(db, "events", id));
        if (!eventSnap.exists()) {
            appDiv.innerHTML = `<div class="text-center text-[#7B2C3A] font-bold py-10">イベントが見つかりません。</div>
                                <div class="text-center"><a href="?" class="text-stone-500 hover:underline">トップへ戻る</a></div>`;
            return;
        }

        const eventData = eventSnap.data();
        document.title = eventData.name ? `${eventData.name}` : '出欠確認システム';
        
        if (eventData.date) {
            const eDate = new Date(eventData.date);
            const now = new Date();
            const diffTime = now.getTime() - eDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);
            
            if (diffDays > 60) {
                const rsvpSnaps = await getDocs(collection(db, "events", id, "rsvps"));
                rsvpSnaps.forEach(async (d) => {
                    await deleteDoc(doc(db, "events", id, "rsvps", d.id));
                });
                await deleteDoc(doc(db, "events", id));
                await showModal('alert', '自動削除', '予定日から60日以上経過したため、イベントデータは自動削除されました。');
                window.location.href = "?";
                return;
            }
        }

        const eventUrl = window.location.href;
        const dateStr = formatDateDisplay(eventData.date);
        
        let timeStr = '';
        if (eventData.startTime || eventData.endTime) {
            timeStr = `${eventData.startTime || '未定'} 〜 ${eventData.endTime || '未定'}`;
        }
        
        let locationHTML = '未定';
        if (eventData.location) locationHTML = escapeHTML(eventData.location);

        let addressHTML = '';
        if (eventData.address) {
            const addressMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.address)}`;
            addressHTML = `<a href="${addressMapUrl}" target="_blank" class="text-blue-600 underline hover:text-blue-800 transition">${escapeHTML(eventData.address)}</a>`;
        }

        const eventCategories = eventData.categories || [];
        const hasCategories = eventCategories.length > 0;
        const rName = () => `field_${Math.random().toString(36).substring(2, 8)}`;

        appDiv.innerHTML = `
            <div id="eventDisplayArea" class="mb-6 relative">
                <div class="flex justify-end mb-1">
                    <div class="flex items-center gap-1.5">
                        <button id="copyBtn" class="bg-stone-200 px-2 py-1 text-[10px] md:text-xs font-bold hover:bg-stone-300 transition text-stone-700 rounded-sm border border-stone-300 whitespace-nowrap shadow-sm">URLをコピー</button>
                        <button id="editEventBtn" class="text-[10px] md:text-xs text-stone-500 hover:text-[#7B2C3A] flex items-center transition bg-transparent px-1 py-1 whitespace-nowrap">${svgEdit} 編集</button>
                    </div>
                </div>
                
                <h1 class="text-xl md:text-2xl font-bold text-stone-800 mb-4 pb-2 border-b-2 border-[#7B2C3A] break-words w-full">${escapeHTML(eventData.name)}</h1>
                
                <div class="space-y-2 mb-4 text-sm text-stone-700 leading-relaxed px-1">
                    <div class="flex flex-col md:flex-row md:items-center">
                        <span class="font-bold w-20 text-stone-500 shrink-0">日程</span>
                        <span>${escapeHTML(dateStr)} ${escapeHTML(timeStr)}</span>
                    </div>
                    <div class="flex flex-col md:flex-row md:items-start">
                        <span class="font-bold w-20 text-stone-500 shrink-0">場所</span>
                        <span>${locationHTML}</span>
                    </div>
                    ${eventData.address ? `
                    <div class="flex flex-col md:flex-row md:items-start">
                        <span class="font-bold w-20 text-stone-500 shrink-0">住所</span>
                        <span>${addressHTML}</span>
                    </div>
                    ` : ''}
                    ${eventData.fee ? `
                    <div class="flex flex-col md:flex-row md:items-center">
                        <span class="font-bold w-20 text-stone-500 shrink-0">参加費</span>
                        <span>${escapeHTML(eventData.fee)}</span>
                    </div>
                    ` : ''}
                </div>

                ${eventData.description ? 
                    `<div class="bg-[#F4F1EA] p-4 text-sm text-stone-700 leading-loose whitespace-pre-wrap rounded-sm border border-stone-200">${escapeHTML(eventData.description)}</div>` : ''}
            </div>

            <!-- 編集フォーム -->
            <form id="eventEditArea" autocomplete="off" onsubmit="return false;" class="mb-8 hidden bg-[#F4F1EA] p-3 md:p-5 border border-stone-200 rounded-sm w-full overflow-hidden">
                <h2 class="text-base md:text-lg font-bold mb-4 text-[#7B2C3A] flex items-center">${svgEdit} イベント情報の編集</h2>
                <div class="space-y-4 text-sm w-full min-w-0">
                    <div class="w-full min-w-0">
                        <label class="text-xs font-bold text-stone-500">イベント名</label>
                        <input type="text" id="editName" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" value="${escapeHTML(eventData.name)}">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full min-w-0">
                        <div>
                            <label class="text-xs font-bold text-stone-500">日にち</label>
                            <input type="date" id="editDate" name="${rName()}" class="appearance-none min-w-0 w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" value="${eventData.date || ''}">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-500">開始時間</label>
                            <select id="editStartTime" name="${rName()}" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white">${generateTimeOptions(eventData.startTime)}</select>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-500">終了時間</label>
                            <select id="editEndTime" name="${rName()}" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white">${generateTimeOptions(eventData.endTime, eventData.startTime)}</select>
                        </div>
                    </div>
                    <div class="w-full min-w-0">
                        <label class="text-xs font-bold text-stone-500">参加費</label>
                        <div class="flex items-center gap-2">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" id="editFee" name="${rName()}" autocomplete="new-password" oninput="let v = this.value.replace(/[^0-9]/g, ''); this.value = v ? Number(v).toLocaleString() : '';" class="w-1/3 md:w-1/4 border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white text-right" value="${escapeHTML(eventData.fee ? eventData.fee.replace('円','').replace(/,/g, '') : '')}">
                            <span class="text-stone-700 font-bold">円</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 gap-2 p-3 bg-white border border-stone-200 w-full min-w-0">
                        <div>
                            <label class="text-xs font-bold text-stone-500">表示する場所の名前</label>
                            <input type="text" id="editLocation" name="${rName()}" autocomplete="new-password" class="w-full border-b border-stone-300 py-1 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" value="${escapeHTML(eventData.location || '')}">
                        </div>
                        <div class="mt-2">
                            <label class="text-xs font-bold text-stone-500">住所</label>
                            <input type="text" id="editAddress" name="${rName()}" autocomplete="new-password" class="w-full border-b border-stone-300 py-1 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" value="${escapeHTML(eventData.address || '')}">
                        </div>
                    </div>
                    
                    <div class="bg-white p-3 border border-stone-200 rounded-sm w-full min-w-0 overflow-hidden">
                        <label class="flex items-center gap-2 cursor-pointer font-bold text-stone-700 select-none">
                            <input type="checkbox" id="editUseCategoriesToggle" class="accent-[#7B2C3A] w-4 h-4 cursor-pointer" ${hasCategories ? 'checked' : ''}> 名簿にカテゴリー枠を追加する
                        </label>
                        <div id="editCategorySetupArea" class="${hasCategories ? '' : 'hidden'} mt-3 space-y-2 pl-1 md:pl-4 border-l-2 border-stone-200 w-full">
                            <div id="editCategoryInputsContainer" class="space-y-1 w-full md:w-2/3 min-w-0">
                                <!-- JSで描画 -->
                            </div>
                            <button type="button" id="editAddCategoryInputBtn" class="text-xs text-[#7B2C3A] font-bold border border-[#7B2C3A] px-3 py-1.5 rounded-sm hover:bg-[#7B2C3A] hover:text-white transition mt-1 ml-6 md:ml-8">${svgPlus} 枠を追加</button>
                        </div>
                    </div>

                    <div class="w-full min-w-0">
                        <label class="text-xs font-bold text-stone-500">詳細・備考</label>
                        <textarea id="editDesc" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 p-2 h-24 text-base focus:outline-none focus:border-[#7B2C3A] bg-white">${escapeHTML(eventData.description || '')}</textarea>
                    </div>
                    <div class="flex gap-2 pt-2 w-full min-w-0">
                        <button id="saveEditBtn" type="button" class="flex-1 bg-[#7B2C3A] text-white font-bold py-2.5 rounded-sm hover:bg-[#5A1F29] transition">保存する</button>
                        <button id="cancelEditBtn" type="button" class="bg-stone-300 px-4 py-2.5 rounded-sm font-bold text-stone-700 hover:bg-stone-400 transition">キャンセル</button>
                    </div>
                </div>
            </form>

            <div class="mb-5 text-center">
                <button id="toggleRegBtn" class="bg-[#7B2C3A] text-white text-sm font-bold px-8 py-3 rounded-sm shadow-md hover:bg-[#5A1F29] transition tracking-widest">＋ 新規名簿登録</button>
            </div>
            
            <form id="registrationForm" autocomplete="off" onsubmit="return false;" class="mb-8 bg-[#F4F1EA] p-4 border border-stone-200 rounded-sm hidden transition-all duration-300">
                <div class="space-y-3 text-sm max-w-xl mx-auto">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <input type="text" id="regLastName" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" placeholder="姓">
                        </div>
                        <div>
                            <input type="text" id="regFirstName" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" placeholder="名">
                        </div>
                    </div>
                    
                    <div class="bg-white p-2 border border-stone-200 flex justify-center gap-4">
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regGender" value="男" checked class="accent-[#7B2C3A]"> 男</label>
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regGender" value="女" class="accent-[#7B2C3A]"> 女</label>
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regGender" value="その他" class="accent-[#7B2C3A]"> その他</label>
                    </div>

                    ${hasCategories ? `
                    <div class="mt-3 pt-3 border-t border-stone-200">
                        <label class="block text-xs font-bold text-stone-500 mb-1">カテゴリーを選択</label>
                        <select id="regCategory" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white rounded-sm">
                            ${eventCategories.map((c, i) => `<option value="${escapeHTML(c)}" ${i === 0 ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
                        </select>
                    </div>
                    ` : ''}

                    <div class="bg-white p-2 border border-stone-200 flex justify-center gap-3 text-sm">
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regStatus" value="-" checked class="accent-[#7B2C3A]"> ${svgDash}</label>
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regStatus" value="〇" class="accent-[#7B2C3A]"> ${svgMaru}</label>
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regStatus" value="△" class="accent-[#7B2C3A]"> ${svgSankaku}</label>
                        <label class="flex items-center gap-1 cursor-pointer text-stone-700 font-bold"><input type="radio" name="regStatus" value="×" class="accent-[#7B2C3A]"> ${svgBatsu}</label>
                    </div>
                    
                    <div>
                        <input type="text" id="regGuestComment" name="${rName()}" autocomplete="new-password" class="w-full border border-stone-300 p-2 text-base focus:outline-none focus:border-[#7B2C3A] bg-white" placeholder="コメント・備考">
                    </div>
                    <button id="submitBtn" type="button" class="w-full bg-[#7B2C3A] text-white font-bold py-2.5 rounded-sm hover:bg-[#5A1F29] transition shadow-sm">リストに追加する</button>
                </div>
            </form>

            <div class="mb-3 border-b-2 border-stone-300 pb-2">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-3">
                    <h2 class="text-base md:text-lg font-bold text-stone-800 tracking-wider pl-1">名簿</h2>
                    <div id="summaryArea" class="text-xs md:text-sm font-bold text-stone-600 flex flex-wrap gap-3 pl-1"></div>
                </div>
                
                <div class="mt-3 pt-2 border-t border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="flex flex-col gap-1 pl-1">
                        <div class="flex items-center gap-3 text-xs md:text-sm text-stone-600 font-bold">
                            <span class="text-[10px] md:text-xs text-stone-400 font-normal">表示:</span>
                            <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" id="filterMale" checked class="accent-[#7B2C3A]"> 男</label>
                            <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" id="filterFemale" checked class="accent-[#7B2C3A]"> 女</label>
                            <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" id="filterOther" checked class="accent-[#7B2C3A]"> その他</label>
                        </div>
                        ${hasCategories ? `
                        <div class="flex items-center flex-wrap gap-3 mt-1 font-bold text-xs md:text-sm text-stone-600">
                            <span class="text-[10px] md:text-xs text-stone-400 font-normal">枠:</span>
                            ${eventCategories.map(c => `
                                <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="cat-filter accent-[#7B2C3A]" value="${escapeHTML(c)}" checked> ${escapeHTML(c)}</label>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="w-full md:w-56 relative mt-1 md:mt-0">
                        <input type="text" id="searchName" name="${rName()}" class="w-full border border-stone-300 rounded-sm p-1.5 md:p-2 text-sm focus:outline-none focus:border-[#7B2C3A] bg-white transition pr-8" placeholder="名前で検索">
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                            ${svgSearch}
                        </div>
                    </div>
                </div>
            </div>
            
            <p id="editNotice" class="text-[10px] text-stone-400 mb-1 pl-1 leading-snug">※自分の行の「出欠」や「コメント」はクリックして編集できます。<br>枠からはみ出るコメントは横にスクロールして読めます。</p>
            
            <form id="rsvpListForm" autocomplete="off" onsubmit="return false;" class="bg-white rounded-sm shadow-sm border border-stone-200">
                <div id="rsvpListContainer"></div>
            </form>
            
            <div class="mt-10 pt-6 border-t border-stone-200 flex flex-col items-center gap-4">
                <a href="${window.location.pathname}" target="_blank" rel="noopener noreferrer" class="text-xs text-stone-500 hover:text-[#7B2C3A] font-bold transition">別のイベントを新しく作る</a>
                <button id="deleteEventBtn" class="text-[10px] text-stone-400 hover:text-red-500 transition">このイベントを完全に削除する</button>
            </div>
        `;

        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(eventUrl);
            const btn = document.getElementById('copyBtn');
            btn.textContent = "コピー済";
            btn.classList.add("bg-[#7B2C3A]", "text-white", "border-[#7B2C3A]");
            btn.classList.remove("bg-stone-200", "text-stone-700", "border-stone-300");
            setTimeout(() => {
                btn.textContent = "URLをコピー";
                btn.classList.remove("bg-[#7B2C3A]", "text-white", "border-[#7B2C3A]");
                btn.classList.add("bg-stone-200", "text-stone-700", "border-stone-300");
            }, 2000);
        });
        
        document.getElementById('toggleRegBtn').addEventListener('click', () => {
            const form = document.getElementById('registrationForm');
            const btn = document.getElementById('toggleRegBtn');
            form.classList.toggle('hidden');
            if(form.classList.contains('hidden')) {
                btn.textContent = "＋ 新規名簿登録";
            } else {
                btn.textContent = "－ 閉じる";
            }
        });

        const editCatContainer = document.getElementById('editCategoryInputsContainer');
        if (editCatContainer) {
            if (hasCategories) {
                eventCategories.forEach(c => editCatContainer.appendChild(createCategoryInputRow(c)));
            } else {
                editCatContainer.appendChild(createCategoryInputRow());
                editCatContainer.appendChild(createCategoryInputRow());
            }

            new Sortable(editCatContainer, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'opacity-50'
            });

            document.getElementById('editUseCategoriesToggle').addEventListener('change', (e) => {
                const area = document.getElementById('editCategorySetupArea');
                if (e.target.checked) area.classList.remove('hidden');
                else area.classList.add('hidden');
            });
            document.getElementById('editAddCategoryInputBtn').addEventListener('click', () => {
                const row = createCategoryInputRow();
                editCatContainer.appendChild(row);
                row.querySelector('input').focus();
            });
        }

        const editStart = document.getElementById('editStartTime');
        const editEnd = document.getElementById('editEndTime');
        editStart.addEventListener('change', () => {
            editEnd.innerHTML = generateTimeOptions(editEnd.value, editStart.value);
        });

        document.getElementById('editEventBtn').addEventListener('click', async () => {
            const inputPin = await showModal('prompt', 'イベントの編集', '管理用パスワード(4桁)を入力してください。');
            if (inputPin === null) return;
            if (inputPin !== eventData.pin) return await showModal('alert', 'エラー', 'パスワードが違います。');
            
            isAdmin = true;
            document.getElementById('editNotice').textContent = "【管理者モード】名前や性別、カテゴリー枠も直接クリックして編集できます。";
            renderListDOM();
            
            document.getElementById('eventDisplayArea').classList.add('hidden');
            document.getElementById('eventEditArea').classList.remove('hidden');
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.getElementById('eventEditArea').classList.add('hidden');
            document.getElementById('eventDisplayArea').classList.remove('hidden');
        });

        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const newName = document.getElementById('editName').value;
            if (!newName) return await showModal('alert', 'エラー', 'イベント名を入力してください。');
            
            const feeValue = document.getElementById('editFee').value.replace(/[^0-9]/g, '');
            const formattedFee = feeValue ? `${Number(feeValue).toLocaleString()}円` : '';

            let newCategories = [];
            let categoryUpdates = []; 

            const toggle = document.getElementById('editUseCategoriesToggle');
            if (toggle && toggle.checked) {
                const inputs = document.querySelectorAll('#editCategoryInputsContainer .cat-input');
                inputs.forEach(inp => {
                    const val = inp.value.trim();
                    const originalVal = inp.getAttribute('data-original-value');
                    if (val && !newCategories.includes(val)) {
                        newCategories.push(val);
                        if (originalVal && originalVal !== val) {
                            categoryUpdates.push({ old: originalVal, new: val });
                        }
                    }
                });
            }

            document.getElementById('saveEditBtn').textContent = "保存中...";
            try {
                await updateDoc(doc(db, "events", id), {
                    name: newName,
                    date: document.getElementById('editDate').value,
                    startTime: document.getElementById('editStartTime').value,
                    endTime: document.getElementById('editEndTime').value,
                    fee: formattedFee,
                    location: document.getElementById('editLocation').value,
                    address: document.getElementById('editAddress').value,
                    description: document.getElementById('editDesc').value,
                    categories: newCategories
                });

                if (categoryUpdates.length > 0) {
                    const rsvpSnaps = await getDocs(collection(db, "events", id, "rsvps"));
                    const updatePromises = [];
                    rsvpSnaps.forEach((d) => {
                        const rsvpData = d.data();
                        const updateMatch = categoryUpdates.find(u => u.old === rsvpData.category);
                        if (updateMatch) {
                            updatePromises.push(updateDoc(doc(db, "events", id, "rsvps", d.id), { category: updateMatch.new }));
                        }
                    });
                    await Promise.all(updatePromises);
                }

                window.location.assign(window.location.href);
            } catch(e) {
                await showModal('alert', 'エラー', 'エラーが発生しました');
                document.getElementById('saveEditBtn').textContent = "保存する";
            }
        });

        document.getElementById('deleteEventBtn').addEventListener('click', async () => {
            const inputPin = await showModal('prompt', 'イベント削除', '管理用パスワード(4桁)を入力してください。');
            if (inputPin === null) return;
            if (inputPin !== eventData.pin) return await showModal('alert', 'エラー', 'パスワードが違います。');
            
            const confirmDel = await showModal('confirm', '警告', '本当に出欠データも含めて完全に削除しますか？<br>（この操作は取り消せません）');
            if (confirmDel) {
                try {
                    const rsvpSnaps = await getDocs(collection(db, "events", id, "rsvps"));
                    const deletePromises = [];
                    rsvpSnaps.forEach((d) => {
                        deletePromises.push(deleteDoc(doc(db, "events", id, "rsvps", d.id)));
                    });
                    await Promise.all(deletePromises);

                    await deleteDoc(doc(db, "events", id));
                    
                    await showModal('alert', '完了', 'イベントと名簿データを完全に削除しました。トップ画面に戻ります。');
                    window.location.assign(window.location.pathname);
                } catch(e) {
                    await showModal('alert', 'エラー', '削除に失敗しました。');
                }
            }
        });

        document.getElementById('submitBtn').addEventListener('click', async () => {
            const lastName = document.getElementById('regLastName').value.trim();
            const firstName = document.getElementById('regFirstName').value.trim();
            const status = document.querySelector('input[name="regStatus"]:checked').value;
            const gender = document.querySelector('input[name="regGender"]:checked')?.value || 'その他';
            const comment = document.getElementById('regGuestComment').value;
            
            const catEl = document.getElementById('regCategory');
            const category = catEl ? catEl.value : '';

            if (!lastName && !firstName) return await showModal('alert', 'エラー', '姓名のどちらかは入力してください。');

            document.getElementById('submitBtn').textContent = "追加中...";
            document.getElementById('submitBtn').disabled = true;

            await addDoc(collection(db, "events", id, "rsvps"), {
                lastName: lastName,
                firstName: firstName,
                gender: gender,
                category: category,
                status: status,
                comment: comment,
                createdAt: serverTimestamp()
            });

            document.getElementById('regLastName').value = '';
            document.getElementById('regFirstName').value = '';
            document.getElementById('regGuestComment').value = '';
            document.querySelector('input[name="regStatus"][value="-"]').checked = true;
            document.querySelector('input[name="regGender"][value="男"]').checked = true;
            if (catEl) catEl.selectedIndex = 0;
            
            document.getElementById('submitBtn').textContent = "リストに追加する";
            document.getElementById('submitBtn').disabled = false;
            
            document.getElementById('registrationForm').classList.add('hidden');
            document.getElementById('toggleRegBtn').textContent = "＋ 新規名簿登録";
        });

        document.getElementById('rsvpListForm').addEventListener('change', async (e) => {
            const rsvpId = e.target.getAttribute('data-id');
            if (!rsvpId) return;

            if (e.target.classList.contains('status-dropdown')) {
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), { status: e.target.value });
            } else if (e.target.classList.contains('comment-input')) {
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), { comment: e.target.value });
            } else if (e.target.classList.contains('last-name-input')) {
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), { lastName: e.target.value });
            } else if (e.target.classList.contains('first-name-input')) {
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), { firstName: e.target.value });
            } else if (e.target.classList.contains('gender-dropdown')) {
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), { gender: e.target.value });
            } else if (e.target.classList.contains('cat-dropdown')) {
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), { category: e.target.value });
            }
        });

        const filters = ['filterMale', 'filterFemale', 'filterOther'];
        filters.forEach(f => document.getElementById(f).addEventListener('change', renderListDOM));
        document.getElementById('searchName').addEventListener('input', renderListDOM);

        onSnapshot(collection(db, "events", id, "rsvps"), (snapshot) => {
            rsvpDataList = [];
            snapshot.forEach((docSnap) => {
                rsvpDataList.push({ id: docSnap.id, ...docSnap.data() });
            });
            renderListDOM();
        });

        function renderListDOM() {
            const listContainer = document.getElementById('rsvpListContainer');
            const summaryArea = document.getElementById('summaryArea');
            
            const showMale = document.getElementById('filterMale').checked;
            const showFemale = document.getElementById('filterFemale').checked;
            const showOther = document.getElementById('filterOther').checked;
            
            let activeCats = [];
            if (hasCategories) {
                const catFilters = Array.from(document.querySelectorAll('.cat-filter'));
                activeCats = catFilters.filter(cb => cb.checked).map(cb => cb.value);
            }

            const searchNameStr = document.getElementById('searchName').value.trim().toLowerCase();

            rsvpDataList.sort((a, b) => {
                let catIndexA = eventCategories.indexOf(a.category);
                let catIndexB = eventCategories.indexOf(b.category);
                if (catIndexA === -1) catIndexA = 999;
                if (catIndexB === -1) catIndexB = 999;
                return catIndexA - catIndexB;
            });

            let counts = { '-': 0, '〇': 0, '△': 0, '×': 0 };
            let visibleTotal = 0;
            let currentCategoryRendered = null; 

            // ★ 列幅を統一。PC・スマホ問わず同じ変数を使って幅を固定。
            // カテゴリ:64px/80px、名前:120px/160px、出欠:32px/40px、コメント:残り全幅
            const catWidth = "w-[64px] md:w-[80px]";
            const nameWidth = hasCategories ? "w-[120px] md:w-[160px]" : "w-[150px] md:w-[220px]";
            const statusWidth = "w-[32px] md:w-[40px]"; // 出欠列を極限までコンパクトに
            const commentWidth = "flex-1 min-w-0";

            const headerHtml = `
                <div class="flex items-center w-full py-1.5 bg-[#F4F1EA] border-b border-stone-300 text-[10px] md:text-xs font-bold text-stone-500 text-center">
                    ${hasCategories ? `<div class="${catWidth} shrink-0 px-1">カテゴリ</div>` : ''}
                    <div class="${nameWidth} shrink-0 px-1">お名前</div>
                    <div class="${statusWidth} shrink-0 px-1">出欠</div>
                    <div class="${commentWidth} px-1">コメント</div>
                </div>
            `;
            
            const bodyDiv = document.createElement('div');
            bodyDiv.className = "flex flex-col";

            rsvpDataList.forEach((data) => {
                const gender = data.gender || 'その他';
                if (gender === '男' && !showMale) return;
                if (gender === '女' && !showFemale) return;
                if (gender === 'その他' && !showOther) return;

                if (hasCategories) {
                    let effectiveCat = data.category || '';
                    if (effectiveCat !== '' && !eventCategories.includes(effectiveCat)) effectiveCat = '';
                    if (effectiveCat && activeCats.length > 0 && !activeCats.includes(effectiveCat)) return;
                }

                const fullNameForSearch = `${data.lastName || ''} ${data.firstName || ''}`.trim().toLowerCase();
                if (searchNameStr && !fullNameForSearch.includes(searchNameStr)) return;

                visibleTotal++;
                
                let currentStatus = data.status;
                if(currentStatus.includes('〇')) currentStatus = '〇';
                else if(currentStatus.includes('△')) currentStatus = '△';
                else if(currentStatus.includes('×')) currentStatus = '×';
                else currentStatus = '-';

                if(counts[currentStatus] !== undefined) counts[currentStatus]++;

                const row = document.createElement('div');
                let isNewCategory = false;
                if (hasCategories && data.category !== currentCategoryRendered) {
                    isNewCategory = true;
                    currentCategoryRendered = data.category;
                }

                const borderClass = (hasCategories && isNewCategory && visibleTotal > 1) ? 'border-t-[3px] border-stone-300' : 'border-t border-stone-100';
                row.className = `flex items-center w-full py-1.5 bg-transparent hover:bg-stone-50 transition flex-nowrap ${borderClass}`;

                // --- カテゴリ列 ---
                let catCellHtml = '';
                if (hasCategories) {
                    if (isAdmin) {
                        const adminCatOpts = eventCategories.map(c => `<option value="${escapeHTML(c)}" ${data.category === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
                        catCellHtml = `
                            <div class="${catWidth} shrink-0 px-1 min-w-0">
                                <select name="${rName()}" class="cat-dropdown w-full bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none text-[9px] md:text-xs text-stone-600 truncate cursor-pointer px-0.5" data-id="${data.id}">
                                    ${adminCatOpts}
                                </select>
                            </div>
                        `;
                    } else {
                        catCellHtml = `
                            <div class="${catWidth} shrink-0 px-1 text-[10px] md:text-xs text-stone-500 font-bold truncate">
                                ${isNewCategory ? escapeHTML(data.category) : ''}
                            </div>
                        `;
                    }
                }

                // --- 名前と性別列 ---
                let nameHtml = '';
                if (isAdmin) {
                    nameHtml = `
                        <div class="${nameWidth} shrink-0 px-1 min-w-0 flex items-center gap-0.5 md:gap-1">
                            <input type="text" name="${rName()}" class="last-name-input w-2/5 min-w-0 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none text-stone-800 font-bold truncate text-[10px] md:text-sm px-0.5" data-id="${data.id}" value="${escapeHTML(data.lastName || '')}" placeholder="姓">
                            <input type="text" name="${rName()}" class="first-name-input w-2/5 min-w-0 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none text-stone-800 font-bold truncate text-[10px] md:text-sm px-0.5" data-id="${data.id}" value="${escapeHTML(data.firstName || '')}" placeholder="名">
                            <select name="${rName()}" class="gender-dropdown w-1/5 min-w-[32px] md:min-w-[40px] shrink-0 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none text-[9px] md:text-xs text-stone-400 cursor-pointer px-0.5" data-id="${data.id}">
                                <option value="男" ${gender === '男' ? 'selected' : ''}>(男)</option>
                                <option value="女" ${gender === '女' ? 'selected' : ''}>(女)</option>
                                <option value="その他" ${gender === 'その他' ? 'selected' : ''}>(他)</option>
                            </select>
                        </div>
                    `;
                } else {
                    const fullName = `${escapeHTML(data.lastName || '')} ${escapeHTML(data.firstName || '')}`.trim();
                    nameHtml = `
                        <div class="${nameWidth} shrink-0 px-1 min-w-0 flex justify-between items-center gap-1">
                            <div class="font-bold text-stone-800 truncate text-xs md:text-sm leading-tight">${fullName}</div>
                            <div class="text-[9px] md:text-[10px] text-stone-400 shrink-0 ml-auto">(${escapeHTML(gender)})</div>
                        </div>
                    `;
                }

                // --- 出欠列 ---
                const statusHtml = `
                    <div class="${statusWidth} shrink-0 px-1 flex justify-center items-center">
                        <select name="${rName()}" class="status-dropdown appearance-none w-full bg-transparent hover:bg-stone-100 focus:outline-none text-sm md:text-base font-bold text-stone-800 cursor-pointer text-center rounded-sm py-1" data-id="${data.id}">
                            <option value="-" ${currentStatus === '-' ? 'selected' : ''}>-</option>
                            <option value="〇" ${currentStatus === '〇' ? 'selected' : ''}>〇</option>
                            <option value="△" ${currentStatus === '△' ? 'selected' : ''}>△</option>
                            <option value="×" ${currentStatus === '×' ? 'selected' : ''}>×</option>
                        </select>
                    </div>
                `;
                
                // --- コメント列 ---
                const commentHtml = `
                    <div class="${commentWidth} px-1 overflow-x-auto hide-scrollbar flex items-center">
                        <input type="text" name="${rName()}" class="comment-input w-full min-w-[120px] md:min-w-[200px] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#7B2C3A] focus:bg-white focus:outline-none text-stone-600 text-[11px] md:text-sm py-1 transition" data-id="${data.id}" value="${escapeHTML(data.comment || '')}" placeholder="コメントを追加">
                    </div>
                `;

                row.innerHTML = catCellHtml + nameHtml + statusHtml + commentHtml;
                bodyDiv.appendChild(row);
            });
            
            listContainer.innerHTML = headerHtml;
            listContainer.appendChild(bodyDiv);

            summaryArea.innerHTML = `
                <span class="text-emerald-600">〇 参加 ${counts['〇']}人</span> 
                <span class="text-amber-500">△ 未定 ${counts['△']}人</span> 
                <span class="text-rose-600">× 欠席 ${counts['×']}人</span>
                <span class="text-stone-400 font-normal ml-2">（表示中 ${visibleTotal}人）</span>
            `;
            
            if (hasCategories) {
                document.querySelectorAll('.cat-filter').forEach(cb => {
                    cb.removeEventListener('change', renderListDOM);
                    cb.addEventListener('change', renderListDOM);
                });
            }
        }

    } catch (e) {
        appDiv.innerHTML = `<div class="text-center text-rose-500 py-10">読み込みエラーが発生しました。</div>`;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
