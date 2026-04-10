export default {
    success: (res, data, statusCode = 200, message, code = "00000") => {
        return res.status(statusCode).json({
            success: true,
            code, // HTTP code is for transport, this code is for business logic
            message,
            data
        })
    },
    error: (res, message, statusCode = 400, code = "99999") => {
        return res.status(statusCode).json({
            success: false,
            code,
            message,
            error: { message }
        })
    },
    paginate: (res, items, total, page, limit, code = "00000") => {
        return res.status(200).json({
            success: true,
            code,
            data: {
                items,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        })
    }
}
