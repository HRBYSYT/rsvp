// Firebase SDKのインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, serverTimestamp, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// Firebase設定（設定済み）
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

// 共通のSVGアイコン（プルダウン矢印）
const chevronDownSVG = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;

// 時間のプルダウンを生成する関数
function generateTimeOptions(defaultTime) {
    let options = '';
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
                <input type="text" id="eventName" autocomplete="off" class="w-full border rounded p-2 focus:ring focus:ring-indigo-200" placeholder="例：2024年 忘年会">
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
                            ${generateTimeOptions('19:00')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${chevronDownSVG}</div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">終了時間</label>
                    <div class="relative">
                        <select id="eventEndTime" class="appearance-none w-full border rounded p-2 focus:ring focus:ring-indigo-200 pr-8 bg-white">
                            ${generateTimeOptions('21:00')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${chevronDownSVG}</div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium mb-1">場所</label>
                <input type="text" id="eventLocation" autocomplete="off" class="w-full border rounded p-2 focus:ring focus:ring-indigo-200" placeholder="例：新宿〇〇居酒屋（入力するとマップのリンクになります）">
            </div>

            <div>
                <label class="block text-sm font-medium mb-1">詳細・備考</label>
                <textarea id="eventDesc" autocomplete="off" class="w-full border rounded p-2 h-24 focus:ring focus:ring-indigo-200" placeholder="会費や待ち合わせ場所などの詳細"></textarea>
            </div>
            
            <div class="bg-red-50 p-4 rounded mt-6 border border-red-100">
                <label class="block text-sm font-bold text-red-600 mb-1">管理用パスワード（数字4桁） <span class="text-red-500">*</span></label>
                <p class="text-xs text-red-500 mb-2">※後でイベント内容を編集・削除する際に必要になります。</p>
                <!-- スマホでテンキーを出し、数字以外を弾く設定 -->
                <input type="text" inputmode="numeric" pattern="[0-9]*" id="eventPin" maxlength="4" autocomplete="off" oninput="this.value = this.value.replace(/[^0-9]/g, '');" class="w-full md:w-1/2 border rounded p-2 focus:ring focus:ring-red-200 tracking-widest text-lg" placeholder="例：1234">
            </div>

            <button id="createBtn" class="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 transition mt-4">イベント専用URLを作成する</button>
        </div>
    `;

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
            appDiv.innerHTML = `<div class="text-center text-red-500 font-bold">イベントが見つかりません（削除された可能性があります）。</div>
                                <div class="mt-4 text-center"><a href="?" class="text-indigo-500 hover:underline">トップへ戻る</a></div>`;
            return;
        }

        const eventData = eventSnap.data();
        const eventUrl = window.location.href;
        
        const dateStr = eventData.date ? eventData.date : '未定';
        const timeStr = (eventData.startTime && eventData.endTime) ? `${eventData.startTime} 〜 ${eventData.endTime}` : '';
        
        // 場所からGoogle Maps URLを生成
        const mapIconSVG = `<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
        let locationHTML = '未定';
        if (eventData.location) {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.location)}`;
            locationHTML = `<a href="${mapUrl}" target="_blank" class="inline-flex items-center text-blue-600 hover:underline break-all">${mapIconSVG}${escapeHTML(eventData.location)}</a>`;
        }

        appDiv.innerHTML = `
            <div id="eventDisplayArea" class="mb-8 border-b pb-6 relative">
                <button id="editEventBtn" class="absolute top-0 right-0 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">⚙️ 編集</button>
                <h1 class="text-3xl font-bold text-gray-800 mb-4 pr-16">${escapeHTML(eventData.name)}</h1>
                
                <div class="bg-gray-50 p-4 rounded-lg space-y-2 mb-4 text-gray-700">
                    <p><span class="font-bold mr-2">📅 日時:</span> ${escapeHTML(dateStr)} ${escapeHTML(timeStr)}</p>
                    <p class="flex items-start"><span class="font-bold mr-2 whitespace-nowrap">📍 場所:</span> <span>${locationHTML}</span></p>
                    ${eventData.description ? `<div class="mt-2 pt-2 border-t border-gray-200"><span class="font-bold block mb-1">📝 詳細:</span><p class="whitespace-pre-wrap">${escapeHTML(eventData.description)}</p></div>` : ''}
                </div>

                <div class="flex items-center gap-2">
                    <input type="text" readonly value="${eventUrl}" class="flex-1 border rounded p-2 text-sm bg-gray-50 text-gray-500" id="shareUrl">
                    <button id="copyBtn" class="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300 font-bold whitespace-nowrap">URLコピー</button>
                </div>
            </div>

            <!-- イベント編集フォーム -->
            <div id="eventEditArea" class="mb-8 border-b pb-6 hidden bg-yellow-50 p-4 rounded">
                <h2 class="text-lg font-bold mb-4 text-yellow-800">イベント情報の編集</h2>
                <div class="space-y-3">
                    <input type="text" id="editName" autocomplete="off" class="w-full border rounded p-2" value="${escapeHTML(eventData.name)}">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input type="date" id="editDate" class="border rounded p-2 bg-white" value="${eventData.date || ''}">
                        <div class="relative">
                            <select id="editStartTime" class="appearance-none w-full border rounded p-2 bg-white pr-8">${generateTimeOptions(eventData.startTime)}</select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${chevronDownSVG}</div>
                        </div>
                        <div class="relative">
                            <select id="editEndTime" class="appearance-none w-full border rounded p-2 bg-white pr-8">${generateTimeOptions(eventData.endTime)}</select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${chevronDownSVG}</div>
                        </div>
                    </div>
                    <input type="text" id="editLocation" autocomplete="off" class="w-full border rounded p-2" value="${escapeHTML(eventData.location || '')}" placeholder="場所">
                    <textarea id="editDesc" autocomplete="off" class="w-full border rounded p-2 h-24">${escapeHTML(eventData.description || '')}</textarea>
                    <div class="flex gap-2">
                        <button id="saveEditBtn" class="flex-1 bg-yellow-600 text-white font-bold py-2 rounded">保存する</button>
                        <button id="cancelEditBtn" class="bg-gray-300 px-4 py-2 rounded">キャンセル</button>
                    </div>
                </div>
            </div>

            <h2 class="text-xl font-bold mb-4">メンバーを追加</h2>
            <div class="space-y-4 mb-10 bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">苗字</label>
                        <input type="text" id="lastName" autocomplete="off" class="w-full border rounded p-2" placeholder="山田">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">名前</label>
                        <input type="text" id="firstName" autocomplete="off" class="w-full border rounded p-2" placeholder="太郎">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">現在の出欠（後で変更可）</label>
                    <div class="flex flex-wrap gap-4">
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="-" checked> - (未選択)</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="〇 (参加)"> 〇 参加</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="△ (未定)"> △ 未定</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="× (欠席)"> × 欠席</label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">コメント（任意）</label>
                    <input type="text" id="guestComment" autocomplete="off" class="w-full border rounded p-2" placeholder="遅れて参加します等">
                </div>
                <button id="submitBtn" class="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 mt-2">リストに追加する</button>
            </div>

            <h2 class="text-xl font-bold mb-4 border-l-4 border-indigo-600 pl-2">出欠リスト</h2>
            <ul id="rsvpList" class="space-y-3"></ul>
            
            <div class="mt-12 pt-8 border-t flex flex-col items-center gap-4">
                <a href="?" class="text-sm text-indigo-500 hover:underline font-bold">別のイベントを新しく作る</a>
                <button id="deleteEventBtn" class="text-xs text-red-400 hover:text-red-600">このイベントを完全に削除する</button>
            </div>
        `;

        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(eventUrl);
            document.getElementById('copyBtn').textContent = "コピー完了!";
            setTimeout(() => document.getElementById('copyBtn').textContent = "URLコピー", 2000);
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
            let counts = { '-': 0, '〇 (参加)': 0, '△ (未定)': 0, '× (欠席)': 0 };

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const rsvpId = docSnap.id;
                
                // カウント処理（昔のデータ等で想定外の値が入っている場合の考慮）
                if(counts[data.status] !== undefined) {
                    counts[data.status]++;
                }

                const li = document.createElement('li');
                // 並び順変更: 名前 -> 出欠 -> 備考
                li.className = "p-3 bg-white border rounded shadow-sm flex flex-col md:flex-row md:items-center gap-3";
                const fullName = `${escapeHTML(data.lastName || '')} ${escapeHTML(data.firstName || '')}`.trim();

                li.innerHTML = `
                    <div class="font-bold text-lg w-full md:w-1/3 min-w-[150px]">${fullName}</div>
                    
                    <div class="w-full md:w-32 relative">
                        <select class="status-dropdown appearance-none w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 focus:ring-indigo-200 cursor-pointer pr-8" data-id="${rsvpId}">
                            <option value="-" ${data.status === '-' ? 'selected' : ''}>-</option>
                            <option value="〇 (参加)" ${data.status === '〇 (参加)' ? 'selected' : ''}>〇 参加</option>
                            <option value="△ (未定)" ${data.status === '△ (未定)' ? 'selected' : ''}>△ 未定</option>
                            <option value="× (欠席)" ${data.status === '× (欠席)' ? 'selected' : ''}>× 欠席</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">${chevronDownSVG}</div>
                    </div>
                    
                    <div class="text-sm text-gray-600 w-full md:w-auto flex-1 break-all">${escapeHTML(data.comment || '')}</div>
                `;
                list.appendChild(li);
            });

            // 集計ヘッダー
            const summary = document.createElement('div');
            summary.className = "flex flex-wrap justify-center gap-4 mb-4 text-base font-bold bg-gray-100 p-3 rounded";
            summary.innerHTML = `
                <span class="text-green-600">〇 ${counts['〇 (参加)']}名</span> 
                <span class="text-yellow-600">△ ${counts['△ (未定)']}名</span> 
                <span class="text-red-500">× ${counts['× (欠席)']}名</span>
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
