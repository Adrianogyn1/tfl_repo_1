class UserInfoBase {
    constructor() {       
        this.id = '';
        this.userId = ''; // <--- Subiu para a base para todos terem
        this.userName = '';
        this.thumbnail = '';
        this.createdAt = '';
        this.updatedAt = '';
        this.isMine = false;
        this.likesCount = 0;
        this.likes = [];
        this.liked = false;
    }

     static fromObject(obj) {
    const instance = new this(); // Se 'this' (a classe) for undefined por causa do ciclo, quebra aqui!
    Object.assign(instance, obj);
    return instance;
}
}

class PhotoDto extends UserInfoBase {
    constructor() {
        super();
        this.url = '';
        this.description = '';
        this.isDefault = false;
    }    
}


class PostBase extends UserInfoBase {
    constructor() {
        super();
        this.comments = [];
        this.commentsCount = 0;
    }
}

class LikeDto extends UserInfoBase {
    constructor() {
        super(); 
        this.postId = '';
        // this.userId = ''; // Removido daqui, já herda da base
        this.photoId = '';
        this.commentId = '';
        this.profileId = '';

        delete this.likes;
        delete this.likesCount;
    }
}

class PostDto extends PostBase {
    constructor() {
        super(); 
        // this.userId = ''; // Removido daqui, já herda da base
        this.text = '';
        this.title = '';
        this.photos = [];
    }
}

class CommentDto extends PostBase {
    constructor() {
        super(); 
        this.postId = '';
        this.text = '';
    }
}

module.exports = { PostDto, CommentDto, LikeDto, PhotoDto };