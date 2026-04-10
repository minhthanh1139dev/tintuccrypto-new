"use strict"

import fileService from "../services/file.service.js";

class FileJob {
    /** Cleanup orphan uploads — xoá file trên disk không còn record trong DB */
    cleanupOrphanUploads = {
        name: "Upload Cleanup",
        schedule: "0 3 * * *",
        action: async () => {
            await fileService.cleanupOrphanUploads();
        },
    };

    async example() {
        return {
            name: "Example",
            schedule: "0 3 * * *",
            action: async () => {
                console.log("Example job");
            },
        };
    }
}

export default new FileJob();
