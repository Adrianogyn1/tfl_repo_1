/*dto para a class User.js*/

class _base{
    constructor() {
        this.id = '';
        this.createdAt = '';
        this.updatedAt = '';
    }
     static fromObject(obj) {
        const instance = new this(); // Se 'this' (a classe) for undefined por causa do ciclo, quebra aqui!
        Object.assign(instance, obj);
        delete instance.password;
        return instance;
    }
}
class RoomBaseInfo extends _base
{
    constructor()
    {
        super();
        this.usersCount = 0;
        this.isMine = false;
    }
}


class UserInfoBase extends _base {
    constructor() {        
        super();
        this.userName = '';
        this.thumbnail = '';
        this.online = '';
        this.userId = '';
        /*@type RoomBaseInfo*/
        this.currentRoom = new RoomBaseInfo();
    }
}


class UserDto extends UserInfoBase {
    constructor() {
        super();
        this.login = '';
        this.age = '';
        this.token = '';
        this.roomId = '';
        this.avatarId = '';
        this.currencyId = '';
        this.email = '';

        //outra informação
        /*@type array UserInfo*/
        this.friends = {};
          /*@type array UserInfo*/
        this.invites = {};
          /*@type array UserInfo*/
        this.ignores = {};
          /*@type array RoomBaseInfo*/
        this.roomsInfo = {};

        delete this.password;
    }
}

module.exports = { UserDto, UserInfoBase, RoomBaseInfo };