// server/admin.ts
// @ts-ignore
import admin from 'firebase-admin';
// @ts-ignore
import express from 'express';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import { readFileSync } from 'fs';

const app = express();
app.use(cors()); // 允許你的 Vue 前端存取
app.use(express.json());


// @ts-ignore
const serviceAccount = JSON.parse(
    // @ts-ignore
    readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf-8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// API: 取得所有使用者的所有紀錄
app.get('/api/all-records', async (req, res) => {
    try {
        const snapshot = await db.collectionGroup('records').get();
        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            userId: doc.ref.parent.parent?.id, // 取得該紀錄所屬的玩家 UID
            ...doc.data()
        }));
        console.log("records:", records);
        res.json(records);
    } catch (error) {
        // @ts-ignore
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Admin Server running on http://localhost:3000'));