import logger from "../utils/logger.js";

export class AppError extends Error {
    constructor(errorData, statusCode = 400, fallbackCode = undefined) {
        if (typeof errorData === 'object' && errorData !== null && errorData.code) {
            super(errorData.message)
            this.statusCode = statusCode
            this.code = errorData.code
        } else {
            super(errorData)
            this.statusCode = statusCode
            this.code = fallbackCode
        }
    }
}

export const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    })

    // AppError — lỗi có chủ ý
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            code: err.code || "99999",
            message: err.message
        })
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            code: '40001', // Example generic validation code
            message: err.message
        })
    }

    // Unexpected error
    return res.status(500).json({
        success: false,
        code: '50000', // Example generic internal code
        message: 'Lỗi server'
    })
}
