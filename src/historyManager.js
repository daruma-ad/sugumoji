/**
 * HistoryManager - 過去に入力したテキストやプリセットを管理する
 */
export class HistoryManager {
    constructor() {
        this.STORAGE_KEY = 'sugumoji_text_history';
        this.MAX_HISTORY = 10;
        this.history = this._load();
    }

    /**
     * localStorage から履歴を読み込む
     */
    _load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    }

    /**
     * 履歴を localStorage に保存する
     */
    _save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    /**
     * 新しいテキストを履歴に追加する
     * @param {string} text 
     */
    add(text) {
        if (!text || text.trim() === '') return;

        // 重複を削除して先頭に追加
        const filtered = this.history.filter(item => item.text !== text);
        this.history = [{
            text,
            timestamp: Date.now(),
            isPinned: false
        }, ...filtered];

        // ピン留めされていないものを削って容量制限
        const pinnedCount = this.history.filter(item => item.isPinned).length;
        if (this.history.length > this.MAX_HISTORY + pinnedCount) {
            // 末尾から「ピン留めされていないもの」を探して削除
            for (let i = this.history.length - 1; i >= 0; i--) {
                if (!this.history[i].isPinned) {
                    this.history.splice(i, 1);
                    break;
                }
            }
        }

        this._save();
    }

    /**
     * 履歴をすべて取得
     */
    getAll() {
        return this.history;
    }

    /**
     * 指定したテキストのピン留め状態を切り替える
     * @param {string} text 
     */
    togglePin(text) {
        const item = this.history.find(h => h.text === text);
        if (item) {
            item.isPinned = !item.isPinned;
            this._save();
        }
    }

    /**
     * 指定したテキストを履歴から削除
     * @param {string} text 
     */
    remove(text) {
        this.history = this.history.filter(h => h.text !== text);
        this._save();
    }
}
