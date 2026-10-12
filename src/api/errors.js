
const ErrorStatus ={
    None: 0,
    Error: 1,
    Warning: 2,
    Success: 3,
    Info: 4,
    //usuarios
    
}


class ApiError extends Error {
    constructor(status, message) {
        super();
        this.status = status;
        this.message = message;
    }
}

class  UserError extends ApiError {
    constructor(status, message) {
        super(status, message);
    }
}



module.exports = {
    ErrorStatus,
    ApiError,
    UserError
}