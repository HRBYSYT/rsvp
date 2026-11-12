// Firebase SDKのインポート（ビルド不要のCDN版）
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 送っていただいた設定をここに反映します
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

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// URLからイベントIDを取得（?id=xxxx）
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
const appDiv = document.getElementById('app');

// 画面ルーティング
if (!eventId) {
    renderCreateEventPage();
} else {
    renderRsvpPage(eventId);
}

// ------------------------------------------
// イベント作成画面（URLにIDがない場合）
// ------------------------------------------
function renderCreateEventPage() {
    appDiv.innerHTML = `
        <h1 class="text-2xl font-bold mb-6 text-center text-indigo-600">新しいイベントを作成</h1>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">イベント名</label>
                <input type="text" id="eventName" class="w-full border rounded p-2 focus:ring focus:ring-indigo-200" placeholder="例：2024年 忘年会">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">日時・場所などの詳細</label>
                <textarea id="eventDesc" class="w-full border rounded p-2 h-24 focus:ring focus:ring-indigo-200" placeholder="日時：12/28 19:00〜&#13;&#10;場所：新宿〇〇居酒屋"></textarea>
            </div>
            <button id="createBtn" class="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 transition">イベント専用URLを作成する</button>
        </div>
    `;

    document.getElementById('createBtn').addEventListener('click', async () => {
        const name = document.getElementById('eventName').value;
        const desc = document.getElementById('eventDesc').value;
        if (!name) return alert("イベント名を入力してください");

        document.getElementById('createBtn').textContent = "作成中...";
        document.getElementById('createBtn').disabled = true;

        try {
            // Firestoreにイベントを保存
            const docRef = await addDoc(collection(db, "events"), {
                name: name,
                description: desc,
                createdAt: serverTimestamp()
            });
            // 作成したイベントID付きのURLへリダイレクト
            window.location.href = `?id=${docRef.id}`;
        } catch (e) {
            console.error("エラー:", e);
            alert("エラーが発生しました。設定を確認してください。");
        }
    });
}

// ------------------------------------------
// 出欠入力・一覧画面（URLにIDがある場合）
// ------------------------------------------
async function renderRsvpPage(id) {
    appDiv.innerHTML = `<div class="text-center text-gray-500">イベント情報を取得中...</div>`;

    try {
        const eventSnap = await getDoc(doc(db, "events", id));
        if (!eventSnap.exists()) {
            appDiv.innerHTML = `<div class="text-center text-red-500 font-bold">イベントが見つかりません。URLを確認してください。</div>`;
            return;
        }

        const eventData = eventSnap.data();
        const eventUrl = window.location.href;

        appDiv.innerHTML = `
            <div class="mb-8 border-b pb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">${escapeHTML(eventData.name)}</h1>
                <p class="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded">${escapeHTML(eventData.description)}</p>
                <div class="mt-4 flex items-center gap-2">
                    <input type="text" readonly value="${eventUrl}" class="flex-1 border rounded p-2 text-sm bg-gray-50 text-gray-500" id="shareUrl">
                    <button id="copyBtn" class="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300">URLコピー</button>
                </div>
            </div>

            <h2 class="text-xl font-bold mb-4">出欠を入力する</h2>
            <div class="space-y-4 mb-10 bg-indigo-50 p-4 rounded-lg">
                <div>
                    <label class="block text-sm font-medium mb-1">お名前</label>
                    <input type="text" id="guestName" class="w-full border rounded p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">出欠</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="〇 (参加)" checked> 〇 参加</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="△ (未定)"> △ 未定</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="× (欠席)"> × 欠席</label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">コメント（任意）</label>
                    <input type="text" id="guestComment" class="w-full border rounded p-2" placeholder="遅れて参加します等">
                </div>
                <button id="submitBtn" class="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700">登録する</button>
            </div>

            <h2 class="text-xl font-bold mb-4 border-l-4 border-indigo-600 pl-2">回答一覧</h2>
            <ul id="rsvpList" class="space-y-3"></ul>
            <div class="mt-8 text-center"><a href="?" class="text-sm text-indigo-500 hover:underline">別のイベントを新しく作る</a></div>
        `;

        // コピーボタンの処理
        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(eventUrl);
            document.getElementById('copyBtn').textContent = "コピー完了!";
            setTimeout(() => document.getElementById('copyBtn').textContent = "URLコピー", 2000);
        });

        // 登録ボタンの処理
        document.getElementById('submitBtn').addEventListener('click', async () => {
            const name = document.getElementById('guestName').value;
            const status = document.querySelector('input[name="status"]:checked').value;
            const comment = document.getElementById('guestComment').value;

            if (!name) return alert("お名前を入力してください");

            document.getElementById('submitBtn').textContent = "送信中...";
            document.getElementById('submitBtn').disabled = true;

            await addDoc(collection(db, "events", id, "rsvps"), {
                name, status, comment,
                createdAt: serverTimestamp()
            });

            document.getElementById('guestName').value = '';
            document.getElementById('guestComment').value = '';
            document.getElementById('submitBtn').textContent = "登録する";
            document.getElementById('submitBtn').disabled = false;
        });

        // リアルタイムで出欠一覧を取得・表示
        onSnapshot(collection(db, "events", id, "rsvps"), (snapshot) => {
            const list = document.getElementById('rsvpList');
            list.innerHTML = '';
            let counts = { '〇 (参加)': 0, '△ (未定)': 0, '× (欠席)': 0 };

            snapshot.forEach((doc) => {
                const data = doc.data();
                counts[data.status]++;
                
                const li = document.createElement('li');
                li.className = "p-3 bg-white border rounded shadow-sm flex flex-col md:flex-row md:items-center gap-2";
                
                const statusColor = data.status.includes('〇') ? 'text-green-600 font-bold' : 
                                  data.status.includes('×') ? 'text-red-500' : 'text-yellow-600';

                li.innerHTML = `
                    <div class="min-w-[100px] ${statusColor}">${data.status}</div>
                    <div class="font-bold flex-1">${escapeHTML(data.name)}</div>
                    <div class="text-sm text-gray-600 w-full md:w-1/2">${escapeHTML(data.comment || '')}</div>
                `;
                list.appendChild(li);
            });

            // 集計ヘッダーを先頭に追加
            const summary = document.createElement('div');
            summary.className = "flex gap-4 mb-4 text-sm font-bold bg-gray-100 p-2 rounded";
            summary.innerHTML = `<span class="text-green-600">参加: ${counts['〇 (参加)']}名</span> <span class="text-yellow-600">未定: ${counts['△ (未定)']}名</span> <span class="text-red-500">欠席: ${counts['× (欠席)']}名</span>`;
            list.insertBefore(summary, list.firstChild);
        });

    } catch (e) {
        console.error("エラー:", e);
        appDiv.innerHTML = `<div class="text-center text-red-500">読み込みエラーが発生しました。</div>`;
    }
}

// XSS対策用のエスケープ関数
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
