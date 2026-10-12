

const dominio = window.location.origin.endsWith("/") ? window.location.origin.slice(0, -1) : window.location.origin;
const API = dominio + '/api';

//#region Users
const ListUsers = async (params) => {
   
    return await $.get(`${API}/users`, params);
}
const GetUser = async (id) => {
    return await fetch(`${API}/users/${id}`).then(res => res.json());
}
//#endregion

//#region  Avatars
const ListAvatars = async (params) => {
    return await $.get(`${API}/avatars`, params);
}
const GetAvatar = async (id) => {
    return await fetch(`${API}/avatar/${id}`).then(res => res.json());
}



const ListWallets = async (params) => {
    return await $.get(`${API}/wallet`, params);
}

const GetWallet = async (id) => {
    return await fetch(`${API}/wallet/${id}`).then(res => res.json());
}

const ListWalletRegisters = async (params) => {
    return await $.get(`${API}/wallet/registers`, params);
}

const GetWalletRegister = async (id) => {
    return await fetch(`${API}/wallet/${id}/registers`).then(res => res.json());
}

const ListRooms = async (params) => {
    return await $.get(`${API}/rooms`, params); 
}

const GetRoom = async (id) => {
    return await fetch(`${API}/room/${id}`).then(res => res.json());
}

const ListRoomObjects = async (options) => {
    return await fetch(`${API}/room/objects`, options).then(res => res.json());
}
const GetRoomObject = async (id) => {
    return await fetch(`${API}/room/${id}/objects`).then(res => res.json());
}

//#endregion



const ListServers = async (params) => {
    return await $.get(`${API}/servers`, params);
}

const GetServer = async (id) => {
    return await fetch(`${API}/server/${id}`).then(res => res.json());
}