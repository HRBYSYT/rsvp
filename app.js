// Firebase SDKのインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, serverTimestamp, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const appDiv = document.getElementById('app');

// ==========================================
// 各種SVGアイコン
// ==========================================
const svgChevron = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
const svgCalendar = `<svg class="w-5 h-5 inline-block mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
const svgMapPin = `<svg class="w-5 h-5 inline-block mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
const svgDoc = `<svg class="w-5 h-5 inline-block mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;
const svgEdit = `<svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`;
const svgSearch = `<svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`;
const svgList = `<svg class="w-5 h-5 inline-block mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>`;

// 時間のプルダウンを生成する関数（デフォルト未選択）
function generateTimeOptions(defaultTime) {
    let options = `<option value="">未選択</option>`;
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            let time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            let selected = time === defaultTime ? 'selected' : '';
            options += `<option value="${time}" ${selected}>${time}</option>`;
        }
    }
    return options;
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
        <h1 class="text-2xl font-bold mb-6 text-center text-indigo-600">新しいイベントを作成</h1>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">イベント名 <span class="text-red-500">*</span></label>
                <!-- autocomplete="new-password" でキャッシュを無効化 -->
                <input type="text" id="eventName" autocomplete="new-password" class="w-full border rounded p-2 focus:ring focus:ring-indigo-200" placeholder="例：2024年 忘年会">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">日にち</label>
                    <input type="date" id="eventDate" class="w-full border rounded p-2 focus:ring focus:ring-indigo-200">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">開始時間</label>
                    <div class="relative">
                        <select id="eventStartTime" class="appearance-none w-full border rounded p-2 focus:ring focus:ring-indigo-200 pr-8 bg-white">
                            ${generateTimeOptions('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${svgChevron}</div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">終了時間</label>
                    <div class="relative">
                        <select id="eventEndTime" class="appearance-none w-full border rounded p-2 focus:ring focus:ring-indigo-200 pr-8 bg-white">
                            ${generateTimeOptions('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${svgChevron}</div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium mb-1">場所</label>
                <div class="flex gap-2">
                    <input type="text" id="eventLocation" autocomplete="new-password" class="flex-1 border rounded p-2 focus:ring focus:ring-indigo-200" placeholder="例：新宿〇〇居酒屋">
                    <button type="button" id="searchMapBtn" class="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 flex items-center whitespace-nowrap text-sm font-bold">
                        ${svgSearch} マップ検索
                    </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">※場所名を入力して登録すると、自動的にGoogleマップのURLが埋め込まれます。</p>
            </div>

            <div>
                <label class="block text-sm font-medium mb-1">詳細・備考</label>
                <textarea id="eventDesc" autocomplete="new-password" class="w-full border rounded p-2 h-24 focus:ring focus:ring-indigo-200" placeholder="会費や待ち合わせ場所などの詳細"></textarea>
            </div>
            
            <div class="bg-red-50 p-4 rounded mt-6 border border-red-100">
                <label class="block text-sm font-bold text-red-600 mb-1">管理用パスワード（数字4桁） <span class="text-red-500">*</span></label>
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="eventPin" maxlength="4" autocomplete="new-password" oninput="this.value = this.value.replace(/[^0-9]/g, '');" class="w-full md:w-1/2 border rounded p-2 focus:ring focus:ring-red-200 tracking-widest text-lg" placeholder="例：1234">
            </div>

            <button id="createBtn" class="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 transition mt-4">イベント専用URLを作成する</button>
        </div>
    `;

    // マップ検索ボタンの挙動
    document.getElementById('searchMapBtn').addEventListener('click', () => {
        const loc = document.getElementById('eventLocation').value.trim();
        if (!loc) return alert("場所を入力してください");
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
    });

    document.getElementById('createBtn').addEventListener('click', async () => {
        const name = document.getElementById('eventName').value;
        const pin = document.getElementById('eventPin').value;
        
        if (!name) return alert("イベント名を入力してください");
        if (pin.length !== 4) return alert("管理用パスワードは数字4桁で入力してください");

        document.getElementById('createBtn').textContent = "作成中...";
        document.getElementById('createBtn').disabled = true;

        try {
            const docRef = await addDoc(collection(db, "events"), {
                name: name,
                date: document.getElementById('eventDate').value,
                startTime: document.getElementById('eventStartTime').value,
                endTime: document.getElementById('eventEndTime').value,
                location: document.getElementById('eventLocation').value,
                description: document.getElementById('eventDesc').value,
                pin: pin,
                createdAt: serverTimestamp()
            });
            window.location.href = `?id=${docRef.id}`;
        } catch (e) {
            console.error("エラー:", e);
            alert("エラーが発生しました。");
            document.getElementById('createBtn').textContent = "イベント専用URLを作成する";
            document.getElementById('createBtn').disabled = false;
        }
    });
}

// ------------------------------------------
// 出欠入力・一覧画面
// ------------------------------------------
async function renderRsvpPage(id) {
    appDiv.innerHTML = `<div class="text-center text-gray-500">イベント情報を取得中...</div>`;

    try {
        const eventSnap = await getDoc(doc(db, "events", id));
        if (!eventSnap.exists()) {
            appDiv.innerHTML = `<div class="text-center text-red-500 font-bold">イベントが見つかりません。</div>
                                <div class="mt-4 text-center"><a href="?" class="text-indigo-500 hover:underline">トップへ戻る</a></div>`;
            return;
        }

        const eventData = eventSnap.data();
        const eventUrl = window.location.href;
        
        const dateStr = eventData.date ? eventData.date : '未定';
        const timeStr = (eventData.startTime && eventData.endTime) ? `${eventData.startTime} 〜 ${eventData.endTime}` : '';
        
        let locationHTML = '未定';
        if (eventData.location) {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.location)}`;
            locationHTML = `<a href="${mapUrl}" target="_blank" class="inline-flex items-center text-blue-600 hover:underline break-all">${escapeHTML(eventData.location)}</a>`;
        }

        appDiv.innerHTML = `
            <div id="eventDisplayArea" class="mb-8 border-b pb-6 relative">
                <button id="editEventBtn" class="absolute top-0 right-0 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center font-bold shadow-sm">${svgEdit} 編集</button>
                <h1 class="text-3xl font-bold text-gray-800 mb-4 pr-16">${escapeHTML(eventData.name)}</h1>
                
                <div class="bg-gray-50 p-4 rounded-lg space-y-2 mb-4 text-gray-700">
                    <p class="flex items-center"><span class="font-bold mr-2 text-gray-500 flex items-center">${svgCalendar} 日時:</span> <span>${escapeHTML(dateStr)} ${escapeHTML(timeStr)}</span></p>
                    <p class="flex items-start"><span class="font-bold mr-2 text-gray-500 flex items-center whitespace-nowrap">${svgMapPin} 場所:</span> <span>${locationHTML}</span></p>
                    ${eventData.description ? `<div class="mt-2 pt-2 border-t border-gray-200"><span class="font-bold mb-1 text-gray-500 flex items-center">${svgDoc} 詳細:</span><p class="whitespace-pre-wrap mt-1">${escapeHTML(eventData.description)}</p></div>` : ''}
                </div>

                <div class="flex items-center gap-2">
                    <input type="text" readonly value="${eventUrl}" class="flex-1 border rounded p-2 text-sm bg-gray-50 text-gray-500" id="shareUrl">
                    <button id="copyBtn" class="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300 font-bold whitespace-nowrap">URLをコピー</button>
                </div>
            </div>

            <!-- 編集フォーム（初期非表示） -->
            <div id="eventEditArea" class="mb-8 border-b pb-6 hidden bg-yellow-50 p-4 rounded">
                <h2 class="text-lg font-bold mb-4 text-yellow-800 flex items-center">${svgEdit} イベント情報の編集</h2>
                <div class="space-y-3">
                    <input type="text" id="editName" autocomplete="new-password" class="w-full border rounded p-2" value="${escapeHTML(eventData.name)}">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input type="date" id="editDate" class="border rounded p-2 bg-white" value="${eventData.date || ''}">
                        <div class="relative">
                            <select id="editStartTime" class="appearance-none w-full border rounded p-2 bg-white pr-8">${generateTimeOptions(eventData.startTime)}</select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${svgChevron}</div>
                        </div>
                        <div class="relative">
                            <select id="editEndTime" class="appearance-none w-full border rounded p-2 bg-white pr-8">${generateTimeOptions(eventData.endTime)}</select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${svgChevron}</div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <input type="text" id="editLocation" autocomplete="new-password" class="flex-1 border rounded p-2 bg-white" value="${escapeHTML(eventData.location || '')}" placeholder="場所">
                        <button type="button" id="editSearchMapBtn" class="bg-yellow-200 text-yellow-800 px-3 py-2 rounded hover:bg-yellow-300 flex items-center whitespace-nowrap text-sm font-bold">
                            ${svgSearch} 検索
                        </button>
                    </div>

                    <textarea id="editDesc" autocomplete="new-password" class="w-full border rounded p-2 h-24 bg-white">${escapeHTML(eventData.description || '')}</textarea>
                    <div class="flex gap-2">
                        <button id="saveEditBtn" class="flex-1 bg-yellow-600 text-white font-bold py-2 rounded">保存する</button>
                        <button id="cancelEditBtn" class="bg-gray-300 px-4 py-2 rounded font-bold">キャンセル</button>
                    </div>
                </div>
            </div>

            <h2 class="text-xl font-bold mb-4">メンバーを追加</h2>
            <div class="space-y-4 mb-10 bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">苗字</label>
                        <input type="text" id="lastName" autocomplete="new-password" class="w-full border rounded p-2" placeholder="山田">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">名前</label>
                        <input type="text" id="firstName" autocomplete="new-password" class="w-full border rounded p-2" placeholder="太郎">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">出欠ステータス</label>
                    <div class="flex flex-wrap gap-4 font-bold text-gray-700">
                        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="-" checked> -</label>
                        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="〇"> 〇</label>
                        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="△"> △</label>
                        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="×"> ×</label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">備考（任意）</label>
                    <input type="text" id="guestComment" autocomplete="new-password" class="w-full border rounded p-2" placeholder="遅れて参加します等">
                </div>
                <button id="submitBtn" class="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 mt-2">リストに追加する</button>
            </div>

            <h2 class="text-xl font-bold mb-4 flex items-center border-l-4 border-indigo-600 pl-2">出欠リスト</h2>
            
            <!-- リストの見出し -->
            <div class="hidden md:grid grid-cols-12 gap-2 mb-2 px-3 text-sm font-bold text-gray-500">
                <div class="col-span-4">名前</div>
                <div class="col-span-4">出欠</div>
                <div class="col-span-4">備考</div>
            </div>
            
            <ul id="rsvpList" class="space-y-3"></ul>
            
            <div class="mt-12 pt-8 border-t flex flex-col items-center gap-4">
                <a href="?" class="text-sm text-indigo-500 hover:underline font-bold">別のイベントを新しく作る</a>
                <button id="deleteEventBtn" class="text-xs text-red-400 hover:text-red-600">このイベントを完全に削除する</button>
            </div>
        `;

        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(eventUrl);
            document.getElementById('copyBtn').textContent = "コピー完了!";
            setTimeout(() => document.getElementById('copyBtn').textContent = "URLをコピー", 2000);
        });

        document.getElementById('editSearchMapBtn').addEventListener('click', () => {
            const loc = document.getElementById('editLocation').value.trim();
            if (!loc) return alert("場所を入力してください");
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
        });

        document.getElementById('editEventBtn').addEventListener('click', () => {
            const inputPin = prompt("イベントの編集を行います。\n作成時に設定した4桁のパスワードを入力してください。");
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
            const inputPin = prompt("【警告】イベントを削除します。\n作成時に設定した4桁のパスワードを入力してください。");
            if (inputPin === null) return;
            if (inputPin !== eventData.pin) return alert("パスワードが違います。");
            
            if (confirm("本当に出欠データも含めてこのイベントを完全に削除しますか？\n（この操作は取り消せません）")) {
                try {
                    await deleteDoc(doc(db, "events", id));
                    alert("イベントを削除しました。トップ画面に戻ります。");
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
            const comment = document.getElementById('guestComment').value;

            if (!lastName && !firstName) return alert("苗字か名前のどちらかは入力してください");

            document.getElementById('submitBtn').textContent = "追加中...";
            document.getElementById('submitBtn').disabled = true;

            await addDoc(collection(db, "events", id, "rsvps"), {
                lastName: lastName,
                firstName: firstName,
                status: status,
                comment: comment,
                createdAt: serverTimestamp()
            });

            document.getElementById('lastName').value = '';
            document.getElementById('firstName').value = '';
            document.getElementById('guestComment').value = '';
            document.querySelector('input[name="status"][value="-"]').checked = true;
            document.getElementById('submitBtn').textContent = "リストに追加する";
            document.getElementById('submitBtn').disabled = false;
        });

        document.getElementById('rsvpList').addEventListener('change', async (e) => {
            if (e.target.classList.contains('status-dropdown')) {
                const rsvpId = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                await updateDoc(doc(db, "events", id, "rsvps", rsvpId), {
                    status: newStatus
                });
            }
        });

        onSnapshot(collection(db, "events", id, "rsvps"), (snapshot) => {
            const list = document.getElementById('rsvpList');
            list.innerHTML = '';
            let counts = { '-': 0, '〇': 0, '△': 0, '×': 0 };

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const rsvpId = docSnap.id;
                
                // 集計カウント（過去のデータ形式の互換性も考慮）
                let currentStatus = data.status;
                if(currentStatus.includes('〇')) currentStatus = '〇';
                else if(currentStatus.includes('△')) currentStatus = '△';
                else if(currentStatus.includes('×')) currentStatus = '×';
                else currentStatus = '-';

                if(counts[currentStatus] !== undefined) {
                    counts[currentStatus]++;
                }

                const li = document.createElement('li');
                li.className = "p-3 bg-white border rounded shadow-sm hover:shadow-md transition";
                
                const fullName = `${escapeHTML(data.lastName || '')} ${escapeHTML(data.firstName || '')}`.trim();

                // 【名前・出欠・備考】をGridで横並びに配置
                li.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
                        <!-- 名前 -->
                        <div class="md:col-span-4 font-bold text-lg truncate">${fullName}</div>
                        
                        <!-- 出欠 -->
                        <div class="md:col-span-4 relative">
                            <select class="status-dropdown appearance-none w-full border border-gray-300 rounded p-2 text-base font-bold bg-gray-50 focus:ring-indigo-200 cursor-pointer pr-8" data-id="${rsvpId}">
                                <option value="-" ${currentStatus === '-' ? 'selected' : ''}>-</option>
                                <option value="〇" ${currentStatus === '〇' ? 'selected' : ''}>〇</option>
                                <option value="△" ${currentStatus === '△' ? 'selected' : ''}>△</option>
                                <option value="×" ${currentStatus === '×' ? 'selected' : ''}>×</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${svgChevron}</div>
                        </div>
                        
                        <!-- 備考 -->
                        <div class="md:col-span-4 text-sm text-gray-600 break-all pt-1 md:pt-0">${escapeHTML(data.comment || '')}</div>
                    </div>
                `;
                list.appendChild(li);
            });

            // 集計ヘッダー
            const summary = document.createElement('div');
            summary.className = "flex flex-wrap justify-center gap-6 mb-4 text-lg font-bold bg-gray-100 p-4 rounded";
            summary.innerHTML = `
                <span class="text-green-600">〇 ${counts['〇']}名</span> 
                <span class="text-yellow-600">△ ${counts['△']}名</span> 
                <span class="text-red-500">× ${counts['×']}名</span>
                <span class="text-gray-500">- ${counts['-']}名</span>
            `;
            list.insertBefore(summary, list.firstChild);
        });

    } catch (e) {
        console.error("エラー:", e);
        appDiv.innerHTML = `<div class="text-center text-red-500">読み込みエラーが発生しました。</div>`;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
