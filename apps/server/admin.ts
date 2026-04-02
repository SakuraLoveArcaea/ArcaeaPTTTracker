// server/views.ts
// @ts-ignore
import admin from 'firebase-admin';
// @ts-ignore
import express from 'express';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import { readFileSync } from 'fs';

const app = express();
app.use(cors());
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

// API 1: 取得所有使用者列表
app.get('/api/users', async (req, res) => {
    try {
        const snapshot = await db.collectionGroup('records').get();
        const uniqueUids = new Set();

        snapshot.docs.forEach(doc => {
            const uid = doc.ref.parent.parent?.id;
            if (uid) uniqueUids.add(uid);
        });

        const users = Array.from(uniqueUids).map(uid => ({ uid }));
        console.log(users);
        res.json(users);
    } catch (error) {
        // @ts-ignore
        res.status(500).json({ error: error.message });
    }
});

// API 2: 取得指定使用者的所有紀錄
app.get('/api/users/:userId/records', async (req, res) => {
    const { userId } = req.params;
    try {
        const snapshot = await db.collection('users').doc(userId).collection('records').get();
        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            userId: userId,
            ...doc.data()
        }));
        res.json(records);
    } catch (error) {
        // @ts-ignore
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Admin Server running on http://localhost:3000'));