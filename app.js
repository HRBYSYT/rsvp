// Firebase SDKのインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, serverTimestamp, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

document.body.className = "bg-[#EFECE6] min-h-screen text-[#333333] font-sans antialiased selection:bg-[#7B2C3A] selection:text-white";
const appDiv = document.getElementById('app');
appDiv.className = "bg-[#FCFBF7] p-6 md:p-10 shadow-xl border border-stone-200 border-t-[6px] border-t-[#7B2C3A] rounded-sm max-w-3xl mx-auto mt-8 mb-20";

// ==========================================
// 各種SVGアイコン
// ==========================================
const svgChevron = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
const svgEdit = `<svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`;

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

if (!eventId) {
    renderCreateEventPage();
} else {
    renderRsvpPage(eventId);
}

// ------------------------------------------
// イベント作成画面
// ------------------------------------------
function renderCreateEventPage() {
    appDiv.innerHTML = `
        <h1 class="text-2xl font-bold mb-8 text-center text-[#7B2C3A] tracking-wider">新規イベント作成</h1>
        <div class="space-y-6 text-sm">
            <div>
                <label class="block font-bold mb-2 text-stone-700">イベント名 <span class="text-[#7B2C3A]">*</span></label>
                <input type="text" id="eventName" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] bg-white transition" placeholder="例：カラリスト忘年会 2026">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block font-bold mb-2 text-stone-700">日にち</label>
                    <input type="date" id="eventDate" class="w-full border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] bg-white transition">
                </div>
                <div>
                    <label class="block font-bold mb-2 text-stone-700">開始時間</label>
                    <div class="relative">
                        <select id="eventStartTime" class="appearance-none w-full border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] bg-white pr-8 transition">
                            ${generateTimeOptions('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">${svgChevron}</div>
                    </div>
                </div>
                <div>
                    <label class="block font-bold mb-2 text-stone-700">終了時間</label>
                    <div class="relative">
                        <select id="eventEndTime" class="appearance-none w-full border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] bg-white pr-8 transition">
                            ${generateTimeOptions('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">${svgChevron}</div>
                    </div>
                </div>
            </div>

            <div class="bg-[#F4F1EA] p-4 border border-stone-200 rounded-sm">
                <div class="mb-4">
                    <label class="block font-bold mb-2 text-stone-700">マップ検索用キーワード</label>
                    <div class="relative">
                        <input type="text" id="eventLocationQuery" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] bg-white transition" placeholder="場所を検索（例：高輪プリンスホテル）">
                        <div id="locSuggestions" class="absolute z-10 w-full bg-white border border-stone-200 shadow-xl max-h-48 overflow-y-auto hidden mt-1"></div>
                    </div>
                    <p class="text-xs text-stone-500 mt-2">※検索して選ぶと、裏側でGoogleマップのピンとして登録されます。</p>
                </div>
                <div>
                    <label class="block font-bold mb-2 text-stone-700">画面に表示するテキスト <span class="text-xs font-normal text-stone-500">（自由に編集可能）</span></label>
                    <input type="text" id="eventLocation" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] bg-white transition" placeholder="例：高輪プリンスホテル 飛天の間">
                </div>
            </div>

            <div>
                <label class="block font-bold mb-2 text-stone-700">詳細・備考</label>
                <textarea id="eventDesc" autocomplete="new-password" class="w-full border border-stone-300 rounded-sm p-3 h-32 focus:outline-none focus:border-[#7B2C3A] bg-white transition" placeholder="会費や待ち合わせ場所などの詳細"></textarea>
            </div>
            
            <div class="border-t border-stone-200 pt-6 mt-6">
                <label class="block font-bold mb-2 text-[#7B2C3A]">管理用パスワード（数字4桁） <span class="text-[#7B2C3A]">*</span></label>
                <p class="text-xs text-stone-500 mb-2">※イベント内容の編集・削除時に必要になります。</p>
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="eventPin" maxlength="4" autocomplete="new-password" oninput="this.value = this.value.replace(/[^0-9]/g, '');" class="w-full md:w-1/3 border border-stone-300 rounded-sm p-3 focus:outline-none focus:border-[#7B2C3A] tracking-widest text-lg bg-white transition" placeholder="1234">
            </div>

            <div class="pt-4">
                <button id="createBtn" class="w-full bg-[#7B2C3A] text-white font-bold py-4 rounded-sm hover:bg-[#5A1F29] transition shadow-md tracking-wider">イベントページを作成する</button>
            </div>
        </div>
    `;

    const startSel = document.getElementById('eventStartTime');
    const endSel = document.getElementById('eventEndTime');
    startSel.addEventListener('change', () => {
        endSel.innerHTML = generateTimeOptions(endSel.value, startSel.value);
    });

    const locQuery = document.getElementById('eventLocationQuery');
    const locDisp = document.getElementById('eventLocation');
    const locSug = document.getElementById('locSuggestions');
    let locTimeout;

    locQuery.addEventListener('input', (e) => {
        clearTimeout(locTimeout);
        const q = e.target.value.trim();
        if (q.length < 2) {
            locSug.classList.add('hidden');
            return;
        }
        locTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=jp`);
                const data = await res.json();
                if (data.length > 0) {
                    locSug.innerHTML = data.map(item => {
                        const name = item.name || item.display_name.split(',')[0];
                        return `<div class="p-3 hover:bg-[#F9F8F6] cursor-pointer border-b border-stone-100 text-sm text-stone-700 transition" data-name="${name}">
                                    <div class="font-bold">${name}</div>
                                    <div class="text-xs text-stone-400 truncate mt-1">${item.display_name}</div>
                                </div>`;
                    }).join('');
                    locSug.classList.remove('hidden');
                    
                    locSug.querySelectorAll('div[data-name]').forEach(div => {
                        div.addEventListener('click', (ev) => {
                            const selectedName = ev.currentTarget.getAttribute('data-name');
                            locQuery.value = selectedName;
                            locDisp.value = selectedName;
                            locSug.classList.add('hidden');
                        });
                    });
                }
            } catch(err) {}
        }, 500);
    });

    document.addEventListener('click', (e) => {
        if (!locQuery.contains(e.target) && !locSug.contains(e.target)) locSug.classList.add('hidden');
    });

    document.getElementById('createBtn').addEventListener('click', async () => {
        const name = document.getElementById('eventName').value;
        const pin = document.getElementById('eventPin').value;
        if (!name) return alert("イベント名を入力してください");
        if (pin.length !== 4) return alert("パスワードは数字4桁で入力してください");

        document.getElementById('createBtn').textContent = "作成中...";
        document.getElementById('createBtn').disabled = true;

        try {
            const docRef = await addDoc(collection(db, "events"), {
                name: name,
                date: document.getElementById('eventDate').value,
                startTime: document.getElementById('eventStartTime').value,
                endTime: document.getElementById('eventEndTime').value,
                locationQuery: locQuery.value,
                location: locDisp.value,
                description: document.getElementById('eventDesc').value,
                pin: pin,
                createdAt: serverTimestamp()
            });
            window.location.href = `?id=${docRef.id}`;
        } catch (e) {
            alert("エラーが発生しました。");
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

    try {
        const eventSnap = await getDoc(doc(db, "events", id));
        if (!eventSnap.exists()) {
            appDiv.innerHTML = `<div class="text-center text-[#7B2C3A] font-bold py-10">イベントが見つかりません。</div>
                                <div class="text-center"><a href="?" class="text-stone-500 hover:underline">トップへ戻る</a></div>`;
            return;
        }

        const eventData = eventSnap.data();
        
        // ------------------------------------------
        // 60日経過の自動削除チェック
        // ------------------------------------------
        if (eventData.date) {
            const eDate = new Date(eventData.date);
            const now = new Date();
            const diffTime = now.getTime() - eDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);
            
            if (diffDays > 60) {
                // サブコレクション（名簿）を先に削除してクリーンアップ
                const rsvpSnaps = await getDocs(collection(db, "events", id, "rsvps"));
                rsvpSnaps.forEach(async (d) => {
                    await deleteDoc(doc(db, "events", id, "rsvps", d.id));
                });
                // イベント本体を削除
                await deleteDoc(doc(db, "events", id));
                alert("予定日から60日以上経過したため、イベントデータは自動削除されました。");
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
        
        const targetQuery = eventData.locationQuery || eventData.location;
        let locationHTML = '未定';
        if (eventData.location) {
            if (targetQuery) {
                // マップURLがある場合は青色で下線を引く
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetQuery)}`;
                locationHTML = `<a href="${mapUrl}" target="_blank" class="text-blue-600 underline hover:text-blue-800 transition">${escapeHTML(eventData.location)}</a>`;
            } else {
                locationHTML = escapeHTML(eventData.location);
            }
        }

        appDiv.innerHTML = `
            <div id="eventDisplayArea" class="mb-10 relative">
                <button id="editEventBtn" class="absolute top-0 right-0 text-xs text-stone-500 hover:text-[#7B2C3A] flex items-center transition bg-transparent px-2 py-1">${svgEdit} 編集</button>
                <h1 class="text-2xl md:text-3xl font-bold text-stone-800 mb-8 pb-4 border-b-2 border-[#7B2C3A] pr-16">${escapeHTML(eventData.name)}</h1>
                
                <div class="space-y-3 mb-6 text-sm text-stone-700 leading-relaxed px-2">
                    <div class="flex flex-col md:flex-row md:items-center">
                        <span class="font-bold w-20 text-stone-500 shrink-0">日程</span>
                        <span>${escapeHTML(dateStr)} ${escapeHTML(timeStr)}</span>
                    </div>
                    <div class="flex flex-col md:flex-row md:items-start">
                        <span class="font-bold w-20 text-stone-500 shrink-0">場所</span>
                        <span>${locationHTML}</span>
                    </div>
                </div>

                ${eventData.description ? 
                    `<div class="bg-[#F4F1EA] p-6 text-sm text-stone-700 leading-loose whitespace-pre-wrap rounded-sm border border-stone-200">${escapeHTML(eventData.description)}</div>` : ''}

                <div class="mt-6 flex items-center gap-2 max-w-lg">
                    <input type="text" readonly value="${eventUrl}" class="flex-1 border border-stone-300 p-2 text-xs bg-white text-stone-500 outline-none">
                    <button id="copyBtn" class="bg-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-300 transition text-stone-700 whitespace-nowrap">URLをコピー</button>
                </div>
            </div>

            <!-- 編集フォーム -->
            <div id="eventEditArea" class="mb-10 hidden bg-[#F4F1EA] p-6 border border-stone-200 rounded-sm">
                <h2 class="text-lg font-bold mb-4 text-[#7B2C3A] flex items-center">${svgEdit} イベント情報の編集</h2>
                <div class="space-y-4 text-sm">
                    <input type="text" id="editName" autocomplete="new-password" class="w-full border border-stone-300 p-2 focus:outline-none focus:border-[#7B2C3A] bg-white" value="${escapeHTML(eventData.name)}">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input type="date" id="editDate" class="border border-stone-300 p-2 focus:outline-none focus:border-[#7B2C3A] bg-white" value="${eventData.date || ''}">
                        <select id="editStartTime" class="border border-stone-300 p-2 focus:outline-none focus:border-[#7B2C3A] bg-white">${generateTimeOptions(eventData.startTime)}</select>
                        <select id="editEndTime" class="border border-stone-300 p-2 focus:outline-none focus:border-[#7B2C3A] bg-white">${generateTimeOptions(eventData.endTime, eventData.startTime)}</select>
                    </div>
                    <div class="grid grid-cols-1 gap-2 p-3 bg-white border border-stone-200">
                        <div>
                            <label class="text-xs font-bold text-stone-500">マップ検索用キーワード</label>
                            <input type="text" id="editLocationQuery" autocomplete="new-password" class="w-full border-b border-stone-300 py-1 focus:outline-none focus:border-[#7B2C3A]" value="${escapeHTML(eventData.locationQuery || '')}">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-500 mt-2">画面表示用のテキスト</label>
                            <input type="text" id="editLocation" autocomplete="new-password" class="w-full border-b border-stone-300 py-1 focus:outline-none focus:border-[#7B2C3A]" value="${escapeHTML(eventData.location || '')}">
                        </div>
                    </div>
                    <textarea id="editDesc" autocomplete="new-password" class="w-full border border-stone-300 p-2 h-24 focus:outline-none focus:border-[#7B2C3A] bg-white">${escapeHTML(eventData.description || '')}</textarea>
                    <div class="flex gap-3 pt-2">
                        <button id="saveEditBtn" class="flex-1 bg-[#7B2C3A] text-white font-bold py-3 rounded-sm hover:bg-[#5A1F29] transition">保存する</button>
                        <button id="cancelEditBtn" class="bg-stone-300 px-6 py-3 rounded-sm font-bold text-stone-700 hover:bg-stone-400 transition">キャンセル</button>
                    </div>
                </div>
            </div>

            <!-- 新規名簿登録アコーディオン（開閉ボタン） -->
            <div class="mb-4 text-center">
                <button id="toggleRegBtn" class="bg-[#7B2C3A] text-white text-sm font-bold px-8 py-3 rounded-sm shadow-md hover:bg-[#5A1F29] transition tracking-widest">＋ 新規名簿登録</button>
            </div>
            
            <!-- 出欠入力フォーム本体（初期状態は hidden で隠す） -->
            <div id="registrationForm" class="mb-12 bg-[#F4F1EA] p-6 border border-stone-200 rounded-sm hidden transition-all duration-300">
                <div class="space-y-4 text-sm max-w-xl mx-auto">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <input type="text" id="lastName" autocomplete="new-password" class="w-full border border-stone-300 p-3 focus:outline-none focus:border-[#7B2C3A] bg-white" placeholder="姓（例：山田）">
                        </div>
                        <div>
                            <input type="text" id="firstName" autocomplete="new-password" class="w-full border border-stone-300 p-3 focus:outline-none focus:border-[#7B2C3A] bg-white" placeholder="名（例：太郎）">
                        </div>
                    </div>
                    
                    <div class="bg-white p-3 border border-stone-200 flex justify-center gap-6">
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="gender" value="男" checked class="accent-[#7B2C3A]"> 男</label>
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="gender" value="女" class="accent-[#7B2C3A]"> 女</label>
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="gender" value="その他" class="accent-[#7B2C3A]"> その他</label>
                    </div>

                    <div class="bg-white p-3 border border-stone-200 flex justify-center gap-6">
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="status" value="-" checked class="accent-[#7B2C3A]"> ${svgDash}</label>
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="status" value="〇" class="accent-[#7B2C3A]"> ${svgMaru}</label>
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="status" value="△" class="accent-[#7B2C3A]"> ${svgSankaku}</label>
                        <label class="flex items-center gap-2 cursor-pointer text-stone-700 font-bold"><input type="radio" name="status" value="×" class="accent-[#7B2C3A]"> ${svgBatsu}</label>
                    </div>
                    
                    <div>
                        <input type="text" id="guestComment" autocomplete="new-password" class="w-full border border-stone-300 p-3 focus:outline-none focus:border-[#7B2C3A] bg-white" placeholder="備考（任意）">
                    </div>
                    <button id="submitBtn" class="w-full bg-[#7B2C3A] text-white font-bold py-3 rounded-sm hover:bg-[#5A1F29] transition shadow-sm">リストに追加する</button>
                </div>
            </div>

            <!-- 出欠リストとフィルター -->
            <div class="mb-4 border-b-2 border-stone-300 pb-2">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <h2 class="text-lg font-bold text-stone-800 tracking-wider">名簿</h2>
                    <div id="summaryArea" class="text-sm font-bold text-stone-600 flex flex-wrap gap-4"></div>
                </div>
                
                <div class="mt-4 pt-3 border-t border-stone-200 flex items-center gap-4 text-sm text-stone-600 font-bold">
                    <span class="text-xs text-stone-400 font-normal">表示:</span>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" id="filterMale" checked class="accent-[#7B2C3A]"> 男</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" id="filterFemale" checked class="accent-[#7B2C3A]"> 女</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" id="filterOther" checked class="accent-[#7B2C3A]"> その他</label>
                </div>
            </div>
            
            <p class="text-xs text-stone-500 mb-3">自分の行の「出欠」や「コメント」「お名前」はいつでもクリックして編集できます。</p>
            
            <div class="hidden md:grid grid-cols-12 gap-3 mb-1 px-4 py-2 bg-[#F4F1EA] border border-stone-300 text-xs font-bold text-stone-700">
                <div class="col-span-4">お名前</div>
                <div class="col-span-3 text-center">出欠</div>
                <div class="col-span-5">コメント</div>
            </div>
            
            <div id="rsvpList" class="border-t md:border-t-0 border-stone-200"></div>
            
            <div class="mt-16 pt-8 border-t border-stone-200 flex flex-col items-center gap-4">
                <a href="?" class="text-xs text-stone-500 hover:text-[#7B2C3A] font-bold transition">別のイベントを新しく作る</a>
                <button id="deleteEventBtn" class="text-[10px] text-stone-400 hover:text-red-500 transition">このイベントを完全に削除する</button>
            </div>
        `;

        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(eventUrl);
            document.getElementById('copyBtn').textContent = "コピー済";
            setTimeout(() => document.getElementById('copyBtn').textContent = "URLをコピー", 2000);
        });
        
        // 登録フォームの開閉アコーディオン機能
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

        const editStart = document.getElementById('editStartTime');
        const editEnd = document.getElementById('editEndTime');
        editStart.addEventListener('change', () => {
            editEnd.innerHTML = generateTimeOptions(editEnd.value, editStart.value);
        });

        document.getElementById('editEventBtn').addEventListener('click', () => {
            const inputPin = prompt("イベントの編集を行います。\n管理用パスワード(4桁)を入力してください。");
            if (inputPin === null) return;
            if (inputPin !== eventData.pin) return alert("パスワードが違います。");
            document.getElementById('eventDisplayArea').classList.add('hidden');
            document.getElementById('eventEditArea').classList.remove('hidden');
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.getElementById('eventEditArea').classList.add('hidden');
            document.getElementById('eventDisplayArea').classList.remove('hidden');
        });

        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const newName = document.getElementById('editName').value;
            if (!newName) return alert("イベント名を入力してください");
            document.getElementById('saveEditBtn').textContent = "保存中...";
            try {
                await updateDoc(doc(db, "events", id), {
                    name: newName,
                    date: document.getElementById('editDate').value,
                    startTime: document.getElementById('editStartTime').value,
                    endTime: document.getElementById('editEndTime').value,
                    locationQuery: document.getElementById('editLocationQuery').value,
                    location: document.getElementById('editLocation').value,
                    description: document.getElementById('editDesc').value
                });
                window.location.reload();
            } catch(e) {
                alert("エラーが発生しました");
                document.getElementById('saveEditBtn').textContent = "保存する";
            }
        });

        document.getElementById('deleteEventBtn').addEventListener('click', async () => {
            const inputPin = prompt("【警告】イベントを削除します。\n管理用パスワードを入力してください。");
            if (inputPin === null) return;
            if (inputPin !== eventData.pin) return alert("パスワードが違います。");
            if (confirm("本当に出欠データも含めて削除しますか？\n（この操作は取り消せません）")) {
                try {
                    await deleteDoc(doc(db, "events", id));
                    alert("削除しました。");
                    window.location.href = "?";
                } catch(e) {
                    alert("削除に失敗しました。");
                }
            }
        });

        document.getElementById('submitBtn').addEventListener('click', async () => {
            const lastName = document.getElementById('lastName').value.trim();
            const firstName = document.getElementById('firstName').value.trim();
            const status = document.querySelector('input[name="status"]:checked').value;
            const gender = document.querySelector('input[name="gender"]:checked')?.value || 'その他';
            const comment = document.getElementById('guestComment').value;

            if (!lastName && !firstName) return alert("姓名のどちらかは入力してください");

            document.getElementById('submitBtn').textContent = "追加中...";
            document.getElementById('submitBtn').disabled = true;

            await addDoc(collection(db, "events", id, "rsvps"), {
                lastName: lastName,
                firstName: firstName,
                gender: gender,
                status: status,
                comment: comment,
                createdAt: serverTimestamp()
            });

            document.getElementById('lastName').value = '';
            document.getElementById('firstName').value = '';
            document.getElementById('guestComment').value = '';
            document.querySelector('input[name="status"][value="-"]').checked = true;
            document.querySelector('input[name="gender"][value="男"]').checked = true;
            document.getElementById('submitBtn').textContent = "リストに追加する";
            document.getElementById('submitBtn').disabled = false;
            
            // 追加後にフォームを閉じる
            document.getElementById('registrationForm').classList.add('hidden');
            document.getElementById('toggleRegBtn').textContent = "＋ 新規名簿登録";
        });

        // 氏名・出欠・コメントの変更をすべてキャッチ
        document.getElementById('rsvpList').addEventListener('change', async (e) => {
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
            }
        });

        const filters = ['filterMale', 'filterFemale', 'filterOther'];
        filters.forEach(f => document.getElementById(f).addEventListener('change', renderListDOM));

        onSnapshot(collection(db, "events", id, "rsvps"), (snapshot) => {
            rsvpDataList = [];
            snapshot.forEach((docSnap) => {
                rsvpDataList.push({ id: docSnap.id, ...docSnap.data() });
            });
            renderListDOM();
        });

        function renderListDOM() {
            const list = document.getElementById('rsvpList');
            const summaryArea = document.getElementById('summaryArea');
            
            const showMale = document.getElementById('filterMale').checked;
            const showFemale = document.getElementById('filterFemale').checked;
            const showOther = document.getElementById('filterOther').checked;

            // 性別順（男1、女2、その他3）にソート
            const genderOrder = { '男': 1, '女': 2, 'その他': 3 };
            rsvpDataList.sort((a, b) => {
                const gA = genderOrder[a.gender || 'その他'] || 3;
                const gB = genderOrder[b.gender || 'その他'] || 3;
                return gA - gB;
            });

            list.innerHTML = '';
            let counts = { '-': 0, '〇': 0, '△': 0, '×': 0 };
            let visibleTotal = 0;

            rsvpDataList.forEach((data) => {
                const gender = data.gender || 'その他';
                if (gender === '男' && !showMale) return;
                if (gender === '女' && !showFemale) return;
                if (gender === 'その他' && !showOther) return;

                visibleTotal++;
                
                let currentStatus = data.status;
                if(currentStatus.includes('〇')) currentStatus = '〇';
                else if(currentStatus.includes('△')) currentStatus = '△';
                else if(currentStatus.includes('×')) currentStatus = '×';
                else currentStatus = '-';

                if(counts[currentStatus] !== undefined) counts[currentStatus]++;

                const row = document.createElement('div');
                row.className = "grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-3 items-center w-full px-4 py-3 border-b border-stone-200 bg-transparent hover:bg-[#F4F1EA] transition text-sm";
                
                const genderDisp = `<span class="text-[10px] text-stone-400 font-normal shrink-0">(${escapeHTML(gender)})</span>`;

                // 氏名もインラインで編集できる input タグに変更
                row.innerHTML = `
                    <div class="md:col-span-4 flex items-center gap-1 pr-2">
                        <input type="text" class="last-name-input flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#7B2C3A] focus:bg-white focus:outline-none text-stone-800 font-bold truncate transition" data-id="${data.id}" value="${escapeHTML(data.lastName || '')}" placeholder="姓">
                        <input type="text" class="first-name-input flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#7B2C3A] focus:bg-white focus:outline-none text-stone-800 font-bold truncate transition" data-id="${data.id}" value="${escapeHTML(data.firstName || '')}" placeholder="名">
                        ${genderDisp}
                    </div>
                    
                    <div class="md:col-span-3 flex md:justify-center">
                        <div class="relative w-20">
                            <select class="status-dropdown appearance-none w-full border-b border-transparent bg-transparent hover:border-stone-300 focus:border-[#7B2C3A] focus:bg-white focus:outline-none py-1 pl-2 pr-6 text-sm font-bold text-stone-800 cursor-pointer text-center transition" data-id="${data.id}">
                                <option value="-" ${currentStatus === '-' ? 'selected' : ''}>-</option>
                                <option value="〇" ${currentStatus === '〇' ? 'selected' : ''}>〇</option>
                                <option value="△" ${currentStatus === '△' ? 'selected' : ''}>△</option>
                                <option value="×" ${currentStatus === '×' ? 'selected' : ''}>×</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-stone-400">${svgChevron}</div>
                        </div>
                    </div>
                    
                    <div class="md:col-span-5 relative">
                        <input type="text" class="comment-input w-full bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#7B2C3A] focus:bg-white focus:outline-none text-stone-600 text-xs md:text-sm py-1 transition" data-id="${data.id}" value="${escapeHTML(data.comment || '')}" placeholder="クリックしてコメントを編集">
                    </div>
                `;
                list.appendChild(row);
            });

            summaryArea.innerHTML = `
                <span class="text-emerald-600">〇 参加 ${counts['〇']}人</span> 
                <span class="text-amber-500">△ 未定 ${counts['△']}人</span> 
                <span class="text-rose-600">× 欠席 ${counts['×']}人</span>
                <span class="text-stone-400 font-normal ml-2">（表示中 ${visibleTotal}人）</span>
            `;
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
