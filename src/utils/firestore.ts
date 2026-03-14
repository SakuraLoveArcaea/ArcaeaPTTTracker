import { collection, getDocs, doc, setDoc, deleteDoc, DocumentReference } from "firebase/firestore";
import { db } from "../firebase";
import { Record } from "../data";
import { User } from "firebase/auth";

/**
 * Helper to get a document reference to a user's specific record.
 */
const getUserDocRef = (currentUser: User, recordId: string): DocumentReference => {
    if (!currentUser) throw new Error("無效的呼叫：使用者未登入");
    return doc(db, "users", currentUser.uid, "records", recordId);
};

/**
 * Fetches all records for the currently logged-in user.
 * @param currentUser The current Firebase User object.
 * @returns A promise that resolves to an array of Records, sorted by playPtt descending.
 */
export const fetchRecords = async (currentUser: User): Promise<Record[]> => {
    const fetchedData: Record[] = [];
    const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "records"));
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedData.push({
            id: docSnap.id,
            title: data.title || '',
            difficulty: data.difficulty || 'FTR',
            constant: data.constant || 0,
            score: data.score || 0,
            playPtt: data.playPtt || 0
        });
    });
    // Sort by playPtt in descending order
    fetchedData.sort((a, b) => b.playPtt - a.playPtt);
    return fetchedData;
};

/**
 * Updates an existing record for the currently logged-in user.
 * @param currentUser The current Firebase User object.
 * @param updatedRecord The modified record to save.
 */
export const modifyRecordByRecord = async (currentUser: User, updatedRecord: Record): Promise<void> => {
    // Deep clone to avoid mutating original and strip any reactive proxies if passed
    const recordData = JSON.parse(JSON.stringify(updatedRecord));
    if (!recordData.id) throw new Error("儲存失敗：缺少唯一 ID");
    const docRef = getUserDocRef(currentUser, recordData.id);
    await setDoc(docRef, recordData, { merge: true });
};

/**
 * Deletes a record for the currently logged-in user.
 * @param currentUser The current Firebase User object.
 * @param record The record to delete.
 */
export const deleteRecordDataByRecord = async (currentUser: User, record: Record): Promise<void> => {
    if (!record.id) throw new Error("刪除失敗：缺少唯一 ID");
    const docRef = getUserDocRef(currentUser, record.id);
    await deleteDoc(docRef);
};

/**
 * Adds a new record for the currently logged-in user.
 * @param currentUser The current Firebase User object.
 * @param record The new record to add.
 */
export const addRecordDataByRecord = async (currentUser: User, record: Record): Promise<void> => {
    if (!record.id) throw new Error("新增失敗：缺少唯一 ID");
    const docRef = getUserDocRef(currentUser, record.id);
    await setDoc(docRef, record, { merge: true });
};
