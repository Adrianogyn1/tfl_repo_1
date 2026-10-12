


class Response 
{
        constructor(sucess, message, data) {
        this.sucess = sucess;
        this.message = message;
        this.data = data;
    }
}
class ResponseList extends Response {
    constructor(sucess, message, data, total, page, nextPage) {
        super(sucess, message, data);
        this.total = total;
        this.page = page;
        this.nextPage = nextPage;
    }
}

module.exports = { Response, ResponseList };