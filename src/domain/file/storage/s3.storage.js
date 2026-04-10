export default class S3Storage {
    async upload(file, docId, isImage) {
        // Implementation for S3 upload
        return { storageKey: file.filename, mime: file.mimetype, size: file.size };
    }
    
    async delete(filename) {
        // Implementation for S3 delete
    }
    
    getUrl(filename) {
        // Implementation for URL retrieval
        return "";
    }
}
