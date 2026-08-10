'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('photos', [
  {
    "id": 1,
    "userId": "121",
    "postId": 1,
    "url": "https://picsum.photos/id/11/600/400",
    "description": "Foto do post: His mother had always taught him",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.828 +00:00",
    "updatedAt": "2026-05-23 04:49:35.828 +00:00"
  },
  {
    "id": 2,
    "userId": "91",
    "postId": 2,
    "url": "https://picsum.photos/id/12/600/400",
    "description": "Foto do post: He was an expert but not in a discipline",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.835 +00:00",
    "updatedAt": "2026-05-23 04:49:35.836 +00:00"
  },
  {
    "id": 3,
    "userId": "16",
    "postId": 3,
    "url": "https://picsum.photos/id/13/600/400",
    "description": "Foto do post: Dave watched as the forest burned up on the hill.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.843 +00:00",
    "updatedAt": "2026-05-23 04:49:35.843 +00:00"
  },
  {
    "id": 4,
    "userId": "47",
    "postId": 4,
    "url": "https://picsum.photos/id/14/600/400",
    "description": "Foto do post: All he wanted was a candy bar.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.851 +00:00",
    "updatedAt": "2026-05-23 04:49:35.851 +00:00"
  },
  {
    "id": 5,
    "userId": "131",
    "postId": 5,
    "url": "https://picsum.photos/id/15/600/400",
    "description": "Foto do post: Hopes and dreams were dashed that day.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.858 +00:00",
    "updatedAt": "2026-05-23 04:49:35.858 +00:00"
  },
  {
    "id": 6,
    "userId": "98",
    "postId": 6,
    "url": "https://picsum.photos/id/16/600/400",
    "description": "Foto do post: Dave wasn't exactly sure how he had ended up",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.865 +00:00",
    "updatedAt": "2026-05-23 04:49:35.865 +00:00"
  },
  {
    "id": 7,
    "userId": "70",
    "postId": 7,
    "url": "https://picsum.photos/id/17/600/400",
    "description": "Foto do post: This is important to remember.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.872 +00:00",
    "updatedAt": "2026-05-23 04:49:35.872 +00:00"
  },
  {
    "id": 8,
    "userId": "67",
    "postId": 8,
    "url": "https://picsum.photos/id/18/600/400",
    "description": "Foto do post: One can cook on and with an open fire.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.878 +00:00",
    "updatedAt": "2026-05-23 04:49:35.878 +00:00"
  },
  {
    "id": 9,
    "userId": "82",
    "postId": 9,
    "url": "https://picsum.photos/id/19/600/400",
    "description": "Foto do post: There are different types of secrets.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.885 +00:00",
    "updatedAt": "2026-05-23 04:49:35.885 +00:00"
  },
  {
    "id": 10,
    "userId": "144",
    "postId": 10,
    "url": "https://picsum.photos/id/20/600/400",
    "description": "Foto do post: They rushed out the door.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.892 +00:00",
    "updatedAt": "2026-05-23 04:49:35.892 +00:00"
  },
  {
    "id": 11,
    "userId": "43",
    "postId": 11,
    "url": "https://picsum.photos/id/21/600/400",
    "description": "Foto do post: It wasn't quite yet time to panic.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.901 +00:00",
    "updatedAt": "2026-05-23 04:49:35.902 +00:00"
  },
  {
    "id": 12,
    "userId": "82",
    "postId": 12,
    "url": "https://picsum.photos/id/22/600/400",
    "description": "Foto do post: She was aware that things could go wrong.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.912 +00:00",
    "updatedAt": "2026-05-23 04:49:35.912 +00:00"
  },
  {
    "id": 13,
    "userId": "199",
    "postId": 13,
    "url": "https://picsum.photos/id/23/600/400",
    "description": "Foto do post: She wanted rainbow hair.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.924 +00:00",
    "updatedAt": "2026-05-23 04:49:35.924 +00:00"
  },
  {
    "id": 14,
    "userId": "140",
    "postId": 14,
    "url": "https://picsum.photos/id/24/600/400",
    "description": "Foto do post: The paper was blank.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.935 +00:00",
    "updatedAt": "2026-05-23 04:49:35.935 +00:00"
  },
  {
    "id": 15,
    "userId": "1",
    "postId": 15,
    "url": "https://picsum.photos/id/25/600/400",
    "description": "Foto do post: The trees, therefore, must be such old",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.947 +00:00",
    "updatedAt": "2026-05-23 04:49:35.947 +00:00"
  },
  {
    "id": 16,
    "userId": "99",
    "postId": 16,
    "url": "https://picsum.photos/id/26/600/400",
    "description": "Foto do post: There was only one way to do things in the Statton house.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.959 +00:00",
    "updatedAt": "2026-05-23 04:49:35.959 +00:00"
  },
  {
    "id": 17,
    "userId": "30",
    "postId": 17,
    "url": "https://picsum.photos/id/27/600/400",
    "description": "Foto do post: She was in a hurry.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.970 +00:00",
    "updatedAt": "2026-05-23 04:49:35.970 +00:00"
  },
  {
    "id": 18,
    "userId": "97",
    "postId": 18,
    "url": "https://picsum.photos/id/28/600/400",
    "description": "Foto do post: She had a terrible habit o comparing her life to others",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.981 +00:00",
    "updatedAt": "2026-05-23 04:49:35.982 +00:00"
  },
  {
    "id": 19,
    "userId": "143",
    "postId": 19,
    "url": "https://picsum.photos/id/29/600/400",
    "description": "Foto do post: The rain and wind abruptly stopped.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:35.995 +00:00",
    "updatedAt": "2026-05-23 04:49:35.995 +00:00"
  },
  {
    "id": 20,
    "userId": "12",
    "postId": 20,
    "url": "https://picsum.photos/id/30/600/400",
    "description": "Foto do post: He couldn't remember exactly where he had read it",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.007 +00:00",
    "updatedAt": "2026-05-23 04:49:36.007 +00:00"
  },
  {
    "id": 21,
    "userId": "136",
    "postId": 21,
    "url": "https://picsum.photos/id/31/600/400",
    "description": "Foto do post: He wandered down the stairs and into the basement",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.019 +00:00",
    "updatedAt": "2026-05-23 04:49:36.019 +00:00"
  },
  {
    "id": 22,
    "userId": "183",
    "postId": 22,
    "url": "https://picsum.photos/id/32/600/400",
    "description": "Foto do post: She has seen this scene before.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.031 +00:00",
    "updatedAt": "2026-05-23 04:49:36.031 +00:00"
  },
  {
    "id": 23,
    "userId": "206",
    "postId": 23,
    "url": "https://picsum.photos/id/33/600/400",
    "description": "Foto do post: It's an unfortunate reality that we don't teach people how to make money",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.039 +00:00",
    "updatedAt": "2026-05-23 04:49:36.040 +00:00"
  },
  {
    "id": 24,
    "userId": "124",
    "postId": 24,
    "url": "https://picsum.photos/id/34/600/400",
    "description": "Foto do post: The robot clicked disapprovingly.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.048 +00:00",
    "updatedAt": "2026-05-23 04:49:36.048 +00:00"
  },
  {
    "id": 25,
    "userId": "148",
    "postId": 25,
    "url": "https://picsum.photos/id/35/600/400",
    "description": "Foto do post: It went through such rapid contortions",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.056 +00:00",
    "updatedAt": "2026-05-23 04:49:36.056 +00:00"
  },
  {
    "id": 26,
    "userId": "156",
    "postId": 26,
    "url": "https://picsum.photos/id/36/600/400",
    "description": "Foto do post: She patiently waited for his number to be called.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.064 +00:00",
    "updatedAt": "2026-05-23 04:49:36.064 +00:00"
  },
  {
    "id": 27,
    "userId": "95",
    "postId": 27,
    "url": "https://picsum.photos/id/37/600/400",
    "description": "Foto do post: Ten more steps.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.073 +00:00",
    "updatedAt": "2026-05-23 04:49:36.073 +00:00"
  },
  {
    "id": 28,
    "userId": "19",
    "postId": 28,
    "url": "https://picsum.photos/id/38/600/400",
    "description": "Foto do post: He had three simple rules by which he lived.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.080 +00:00",
    "updatedAt": "2026-05-23 04:49:36.080 +00:00"
  },
  {
    "id": 29,
    "userId": "74",
    "postId": 29,
    "url": "https://picsum.photos/id/39/600/400",
    "description": "Foto do post: The chair sat in the corner where it had been",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.093 +00:00",
    "updatedAt": "2026-05-23 04:49:36.093 +00:00"
  },
  {
    "id": 30,
    "userId": "177",
    "postId": 30,
    "url": "https://picsum.photos/id/40/600/400",
    "description": "Foto do post: Things aren't going well at all",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.099 +00:00",
    "updatedAt": "2026-05-23 04:49:36.100 +00:00"
  },
  {
    "id": 31,
    "userId": "168",
    "postId": 31,
    "url": "https://picsum.photos/id/41/600/400",
    "description": "Foto do post: It was just a burger.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.106 +00:00",
    "updatedAt": "2026-05-23 04:49:36.106 +00:00"
  },
  {
    "id": 32,
    "userId": "6",
    "postId": 32,
    "url": "https://picsum.photos/id/42/600/400",
    "description": "Foto do post: He swung back the fishing pole and cast the line",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.113 +00:00",
    "updatedAt": "2026-05-23 04:49:36.113 +00:00"
  },
  {
    "id": 33,
    "userId": "58",
    "postId": 33,
    "url": "https://picsum.photos/id/43/600/400",
    "description": "Foto do post: He lifted the bottle to his lips and took a sip",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.119 +00:00",
    "updatedAt": "2026-05-23 04:49:36.119 +00:00"
  },
  {
    "id": 34,
    "userId": "98",
    "postId": 34,
    "url": "https://picsum.photos/id/44/600/400",
    "description": "Foto do post: Debbie had taken George for granted",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.126 +00:00",
    "updatedAt": "2026-05-23 04:49:36.126 +00:00"
  },
  {
    "id": 35,
    "userId": "190",
    "postId": 35,
    "url": "https://picsum.photos/id/45/600/400",
    "description": "Foto do post: She sat deep in thought.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.132 +00:00",
    "updatedAt": "2026-05-23 04:49:36.133 +00:00"
  },
  {
    "id": 36,
    "userId": "207",
    "postId": 36,
    "url": "https://picsum.photos/id/46/600/400",
    "description": "Foto do post: The leather jacked showed the scars",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.139 +00:00",
    "updatedAt": "2026-05-23 04:49:36.139 +00:00"
  },
  {
    "id": 37,
    "userId": "150",
    "postId": 37,
    "url": "https://picsum.photos/id/47/600/400",
    "description": "Foto do post: There was no time.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.146 +00:00",
    "updatedAt": "2026-05-23 04:49:36.146 +00:00"
  },
  {
    "id": 38,
    "userId": "177",
    "postId": 38,
    "url": "https://picsum.photos/id/48/600/400",
    "description": "Foto do post: He collected the plastic trash on a daily basis.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.153 +00:00",
    "updatedAt": "2026-05-23 04:49:36.153 +00:00"
  },
  {
    "id": 39,
    "userId": "115",
    "postId": 39,
    "url": "https://picsum.photos/id/49/600/400",
    "description": "Foto do post: It was so great to hear from you today",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.160 +00:00",
    "updatedAt": "2026-05-23 04:49:36.160 +00:00"
  },
  {
    "id": 40,
    "userId": "181",
    "postId": 40,
    "url": "https://picsum.photos/id/50/600/400",
    "description": "Foto do post: Have you ever wondered about toes?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.167 +00:00",
    "updatedAt": "2026-05-23 04:49:36.168 +00:00"
  },
  {
    "id": 41,
    "userId": "140",
    "postId": 41,
    "url": "https://picsum.photos/id/51/600/400",
    "description": "Foto do post: His parents continued to question him.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.175 +00:00",
    "updatedAt": "2026-05-23 04:49:36.175 +00:00"
  },
  {
    "id": 42,
    "userId": "188",
    "postId": 42,
    "url": "https://picsum.photos/id/52/600/400",
    "description": "Foto do post: You know that tingly feeling you get on the back of your neck sometimes?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.181 +00:00",
    "updatedAt": "2026-05-23 04:49:36.181 +00:00"
  },
  {
    "id": 43,
    "userId": "6",
    "postId": 43,
    "url": "https://picsum.photos/id/53/600/400",
    "description": "Foto do post: Explain to me again why I shouldn't cheat?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.191 +00:00",
    "updatedAt": "2026-05-23 04:49:36.191 +00:00"
  },
  {
    "id": 44,
    "userId": "124",
    "postId": 44,
    "url": "https://picsum.photos/id/54/600/400",
    "description": "Foto do post: A long black shadow slid across the pavement",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.198 +00:00",
    "updatedAt": "2026-05-23 04:49:36.198 +00:00"
  },
  {
    "id": 45,
    "userId": "45",
    "postId": 45,
    "url": "https://picsum.photos/id/55/600/400",
    "description": "Foto do post: The red line moved across the page.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.205 +00:00",
    "updatedAt": "2026-05-23 04:49:36.205 +00:00"
  },
  {
    "id": 46,
    "userId": "132",
    "postId": 46,
    "url": "https://picsum.photos/id/56/600/400",
    "description": "Foto do post: The clowns had taken over. And yes, they were literally clowns.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.212 +00:00",
    "updatedAt": "2026-05-23 04:49:36.212 +00:00"
  },
  {
    "id": 47,
    "userId": "126",
    "postId": 47,
    "url": "https://picsum.photos/id/57/600/400",
    "description": "Foto do post: The shoes had been there for as long as anyone could remember.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.220 +00:00",
    "updatedAt": "2026-05-23 04:49:36.220 +00:00"
  },
  {
    "id": 48,
    "userId": "175",
    "postId": 48,
    "url": "https://picsum.photos/id/58/600/400",
    "description": "Foto do post: Trees. It was something about the trees.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.227 +00:00",
    "updatedAt": "2026-05-23 04:49:36.227 +00:00"
  },
  {
    "id": 49,
    "userId": "207",
    "postId": 49,
    "url": "https://picsum.photos/id/59/600/400",
    "description": "Foto do post: Sometimes it's just better not to be seen.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.234 +00:00",
    "updatedAt": "2026-05-23 04:49:36.234 +00:00"
  },
  {
    "id": 50,
    "userId": "15",
    "postId": 50,
    "url": "https://picsum.photos/id/60/600/400",
    "description": "Foto do post: It was a concerning development that he couldn't get out of his mind.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.243 +00:00",
    "updatedAt": "2026-05-23 04:49:36.243 +00:00"
  },
  {
    "id": 51,
    "userId": "69",
    "postId": 51,
    "url": "https://picsum.photos/id/61/600/400",
    "description": "Foto do post: The towels had been hanging from the rod for years.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.251 +00:00",
    "updatedAt": "2026-05-23 04:49:36.251 +00:00"
  },
  {
    "id": 52,
    "userId": "135",
    "postId": 52,
    "url": "https://picsum.photos/id/62/600/400",
    "description": "Foto do post: The headache wouldn't go away.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.259 +00:00",
    "updatedAt": "2026-05-23 04:49:36.259 +00:00"
  },
  {
    "id": 53,
    "userId": "48",
    "postId": 53,
    "url": "https://picsum.photos/id/63/600/400",
    "description": "Foto do post: The young man wanted a role model.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.267 +00:00",
    "updatedAt": "2026-05-23 04:49:36.268 +00:00"
  },
  {
    "id": 54,
    "userId": "200",
    "postId": 54,
    "url": "https://picsum.photos/id/64/600/400",
    "description": "Foto do post: Debbie knew she was being selfish",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.276 +00:00",
    "updatedAt": "2026-05-23 04:49:36.276 +00:00"
  },
  {
    "id": 55,
    "userId": "105",
    "postId": 55,
    "url": "https://picsum.photos/id/65/600/400",
    "description": "Foto do post: She tried to explain that love wasn't like pie.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.283 +00:00",
    "updatedAt": "2026-05-23 04:49:36.283 +00:00"
  },
  {
    "id": 56,
    "userId": "191",
    "postId": 56,
    "url": "https://picsum.photos/id/66/600/400",
    "description": "Foto do post: The house was located at the top of the hill",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.290 +00:00",
    "updatedAt": "2026-05-23 04:49:36.290 +00:00"
  },
  {
    "id": 57,
    "userId": "72",
    "postId": 57,
    "url": "https://picsum.photos/id/67/600/400",
    "description": "Foto do post: It seemed like it should have been so simple.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.297 +00:00",
    "updatedAt": "2026-05-23 04:49:36.298 +00:00"
  },
  {
    "id": 58,
    "userId": "93",
    "postId": 58,
    "url": "https://picsum.photos/id/68/600/400",
    "description": "Foto do post: Balloons are pretty and come in different colors",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.305 +00:00",
    "updatedAt": "2026-05-23 04:49:36.305 +00:00"
  },
  {
    "id": 59,
    "userId": "89",
    "postId": 59,
    "url": "https://picsum.photos/id/69/600/400",
    "description": "Foto do post: She looked at her student wondering if she could ever get through.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.312 +00:00",
    "updatedAt": "2026-05-23 04:49:36.312 +00:00"
  },
  {
    "id": 60,
    "userId": "204",
    "postId": 60,
    "url": "https://picsum.photos/id/70/600/400",
    "description": "Foto do post: He heard the crack echo in the late afternoon about a mile away.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.319 +00:00",
    "updatedAt": "2026-05-23 04:49:36.319 +00:00"
  },
  {
    "id": 61,
    "userId": "5",
    "postId": 61,
    "url": "https://picsum.photos/id/71/600/400",
    "description": "Foto do post: I'm going to hire professional help tomorrow.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.326 +00:00",
    "updatedAt": "2026-05-23 04:49:36.326 +00:00"
  },
  {
    "id": 62,
    "userId": "55",
    "postId": 62,
    "url": "https://picsum.photos/id/72/600/400",
    "description": "Foto do post: He watched as the young man tried",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.333 +00:00",
    "updatedAt": "2026-05-23 04:49:36.333 +00:00"
  },
  {
    "id": 63,
    "userId": "132",
    "postId": 63,
    "url": "https://picsum.photos/id/73/600/400",
    "description": "Foto do post: Many people say that life isn't like a bed of roses.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.340 +00:00",
    "updatedAt": "2026-05-23 04:49:36.340 +00:00"
  },
  {
    "id": 64,
    "userId": "170",
    "postId": 64,
    "url": "https://picsum.photos/id/74/600/400",
    "description": "Foto do post: There are only three ways to make this work.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.347 +00:00",
    "updatedAt": "2026-05-23 04:49:36.348 +00:00"
  },
  {
    "id": 65,
    "userId": "76",
    "postId": 65,
    "url": "https://picsum.photos/id/75/600/400",
    "description": "Foto do post: Time is all relative based on age and experience.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.354 +00:00",
    "updatedAt": "2026-05-23 04:49:36.354 +00:00"
  },
  {
    "id": 66,
    "userId": "124",
    "postId": 66,
    "url": "https://picsum.photos/id/76/600/400",
    "description": "Foto do post: Time is all relative based on age and experience.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.362 +00:00",
    "updatedAt": "2026-05-23 04:49:36.362 +00:00"
  },
  {
    "id": 67,
    "userId": "173",
    "postId": 67,
    "url": "https://picsum.photos/id/77/600/400",
    "description": "Foto do post: Welcome to my world.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.368 +00:00",
    "updatedAt": "2026-05-23 04:49:36.369 +00:00"
  },
  {
    "id": 68,
    "userId": "70",
    "postId": 68,
    "url": "https://picsum.photos/id/78/600/400",
    "description": "Foto do post: She sat down with her notebook in her hand",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.375 +00:00",
    "updatedAt": "2026-05-23 04:49:36.375 +00:00"
  },
  {
    "id": 69,
    "userId": "196",
    "postId": 69,
    "url": "https://picsum.photos/id/79/600/400",
    "description": "Foto do post: The wave roared towards them with speed and violence they had not anticipated.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.382 +00:00",
    "updatedAt": "2026-05-23 04:49:36.382 +00:00"
  },
  {
    "id": 70,
    "userId": "101",
    "postId": 70,
    "url": "https://picsum.photos/id/80/600/400",
    "description": "Foto do post: Sometimes there isn't a good answer.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.388 +00:00",
    "updatedAt": "2026-05-23 04:49:36.389 +00:00"
  },
  {
    "id": 71,
    "userId": "203",
    "postId": 71,
    "url": "https://picsum.photos/id/81/600/400",
    "description": "Foto do post: He knew what he was supposed to do.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.396 +00:00",
    "updatedAt": "2026-05-23 04:49:36.396 +00:00"
  },
  {
    "id": 72,
    "userId": "112",
    "postId": 72,
    "url": "https://picsum.photos/id/82/600/400",
    "description": "Foto do post: The words hadn't flowed from his fingers",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.403 +00:00",
    "updatedAt": "2026-05-23 04:49:36.403 +00:00"
  },
  {
    "id": 73,
    "userId": "155",
    "postId": 73,
    "url": "https://picsum.photos/id/83/600/400",
    "description": "Foto do post: It was difficult to explain to them",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.410 +00:00",
    "updatedAt": "2026-05-23 04:49:36.410 +00:00"
  },
  {
    "id": 74,
    "userId": "152",
    "postId": 74,
    "url": "https://picsum.photos/id/84/600/400",
    "description": "Foto do post: He couldn't move. His head throbbed and spun.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.417 +00:00",
    "updatedAt": "2026-05-23 04:49:36.417 +00:00"
  },
  {
    "id": 75,
    "userId": "54",
    "postId": 75,
    "url": "https://picsum.photos/id/85/600/400",
    "description": "Foto do post: There was something beautiful in his hate.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.424 +00:00",
    "updatedAt": "2026-05-23 04:49:36.424 +00:00"
  },
  {
    "id": 76,
    "userId": "13",
    "postId": 76,
    "url": "https://picsum.photos/id/86/600/400",
    "description": "Foto do post: Her mom had warned her.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.432 +00:00",
    "updatedAt": "2026-05-23 04:49:36.432 +00:00"
  },
  {
    "id": 77,
    "userId": "114",
    "postId": 77,
    "url": "https://picsum.photos/id/87/600/400",
    "description": "Foto do post: She nervously peered over the edge.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.439 +00:00",
    "updatedAt": "2026-05-23 04:49:36.439 +00:00"
  },
  {
    "id": 78,
    "userId": "51",
    "postId": 78,
    "url": "https://picsum.photos/id/88/600/400",
    "description": "Foto do post: The thing that's great about this job",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.446 +00:00",
    "updatedAt": "2026-05-23 04:49:36.446 +00:00"
  },
  {
    "id": 79,
    "userId": "45",
    "postId": 79,
    "url": "https://picsum.photos/id/89/600/400",
    "description": "Foto do post: It was a simple tip of the hat",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.453 +00:00",
    "updatedAt": "2026-05-23 04:49:36.453 +00:00"
  },
  {
    "id": 80,
    "userId": "80",
    "postId": 80,
    "url": "https://picsum.photos/id/90/600/400",
    "description": "Foto do post: Cake or pie?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.461 +00:00",
    "updatedAt": "2026-05-23 04:49:36.461 +00:00"
  },
  {
    "id": 81,
    "userId": "126",
    "postId": 81,
    "url": "https://picsum.photos/id/91/600/400",
    "description": "Foto do post: There was something in the tree.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.469 +00:00",
    "updatedAt": "2026-05-23 04:49:36.469 +00:00"
  },
  {
    "id": 82,
    "userId": "79",
    "postId": 82,
    "url": "https://picsum.photos/id/92/600/400",
    "description": "Foto do post: Pink ponies and purple giraffes roamed the field.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.477 +00:00",
    "updatedAt": "2026-05-23 04:49:36.477 +00:00"
  },
  {
    "id": 83,
    "userId": "84",
    "postId": 83,
    "url": "https://picsum.photos/id/93/600/400",
    "description": "Foto do post: Are you getting my texts???",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.485 +00:00",
    "updatedAt": "2026-05-23 04:49:36.485 +00:00"
  },
  {
    "id": 84,
    "userId": "145",
    "postId": 84,
    "url": "https://picsum.photos/id/94/600/400",
    "description": "Foto do post: He stepped away from the mic. This was the best take he had done so far",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.493 +00:00",
    "updatedAt": "2026-05-23 04:49:36.493 +00:00"
  },
  {
    "id": 85,
    "userId": "47",
    "postId": 85,
    "url": "https://picsum.photos/id/95/600/400",
    "description": "Foto do post: The choice was red, green, or blue.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.500 +00:00",
    "updatedAt": "2026-05-23 04:49:36.500 +00:00"
  },
  {
    "id": 86,
    "userId": "171",
    "postId": 86,
    "url": "https://picsum.photos/id/96/600/400",
    "description": "Foto do post: He picked up the burnt end of the branch and made a mark on the stone.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.508 +00:00",
    "updatedAt": "2026-05-23 04:49:36.509 +00:00"
  },
  {
    "id": 87,
    "userId": "144",
    "postId": 87,
    "url": "https://picsum.photos/id/97/600/400",
    "description": "Foto do post: The red glint of paint sparkled under the sun.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.517 +00:00",
    "updatedAt": "2026-05-23 04:49:36.517 +00:00"
  },
  {
    "id": 88,
    "userId": "51",
    "postId": 88,
    "url": "https://picsum.photos/id/98/600/400",
    "description": "Foto do post: There were little things that she simply could not stand.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.524 +00:00",
    "updatedAt": "2026-05-23 04:49:36.524 +00:00"
  },
  {
    "id": 89,
    "userId": "104",
    "postId": 89,
    "url": "https://picsum.photos/id/99/600/400",
    "description": "Foto do post: On Saturday nights I would sit by the phone",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.531 +00:00",
    "updatedAt": "2026-05-23 04:49:36.531 +00:00"
  },
  {
    "id": 90,
    "userId": "150",
    "postId": 90,
    "url": "https://picsum.photos/id/100/600/400",
    "description": "Foto do post: Gentlemen of the free-and-easy sort",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.537 +00:00",
    "updatedAt": "2026-05-23 04:49:36.537 +00:00"
  },
  {
    "id": 91,
    "userId": "204",
    "postId": 91,
    "url": "https://picsum.photos/id/101/600/400",
    "description": "Foto do post: In truth, Mrs. Gradgrind's stock of facts in",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.543 +00:00",
    "updatedAt": "2026-05-23 04:49:36.543 +00:00"
  },
  {
    "id": 92,
    "userId": "102",
    "postId": 92,
    "url": "https://picsum.photos/id/102/600/400",
    "description": "Foto do post: 'My dear Bounderby,' Mr. Gradgrind began",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.548 +00:00",
    "updatedAt": "2026-05-23 04:49:36.548 +00:00"
  },
  {
    "id": 93,
    "userId": "169",
    "postId": 93,
    "url": "https://picsum.photos/id/103/600/400",
    "description": "Foto do post: He could find no answer, except life's usual",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.553 +00:00",
    "updatedAt": "2026-05-23 04:49:36.553 +00:00"
  },
  {
    "id": 94,
    "userId": "28",
    "postId": 94,
    "url": "https://picsum.photos/id/104/600/400",
    "description": "Foto do post: Happiness was different in childhood.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.558 +00:00",
    "updatedAt": "2026-05-23 04:49:36.558 +00:00"
  },
  {
    "id": 95,
    "userId": "113",
    "postId": 95,
    "url": "https://picsum.photos/id/105/600/400",
    "description": "Foto do post: So what is the answer? How can you stand",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.563 +00:00",
    "updatedAt": "2026-05-23 04:49:36.563 +00:00"
  },
  {
    "id": 96,
    "userId": "198",
    "postId": 96,
    "url": "https://picsum.photos/id/106/600/400",
    "description": "Foto do post: If only it were all so simple! If only there",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.567 +00:00",
    "updatedAt": "2026-05-23 04:49:36.567 +00:00"
  },
  {
    "id": 97,
    "userId": "72",
    "postId": 97,
    "url": "https://picsum.photos/id/107/600/400",
    "description": "Foto do post: As for the leaflets reporting the creation of",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.573 +00:00",
    "updatedAt": "2026-05-23 04:49:36.573 +00:00"
  },
  {
    "id": 98,
    "userId": "161",
    "postId": 98,
    "url": "https://picsum.photos/id/108/600/400",
    "description": "Foto do post: And how can you bring it home to them?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.579 +00:00",
    "updatedAt": "2026-05-23 04:49:36.579 +00:00"
  },
  {
    "id": 99,
    "userId": "154",
    "postId": 99,
    "url": "https://picsum.photos/id/109/600/400",
    "description": "Foto do post: Like all men not really up to their job,",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.584 +00:00",
    "updatedAt": "2026-05-23 04:49:36.584 +00:00"
  },
  {
    "id": 100,
    "userId": "131",
    "postId": 100,
    "url": "https://picsum.photos/id/110/600/400",
    "description": "Foto do post: But Art is a punitive sentence, not a",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.590 +00:00",
    "updatedAt": "2026-05-23 04:49:36.590 +00:00"
  },
  {
    "id": 101,
    "userId": "72",
    "postId": 101,
    "url": "https://picsum.photos/id/111/600/400",
    "description": "Foto do post: All Hallows Day: grief comes in waves.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.595 +00:00",
    "updatedAt": "2026-05-23 04:49:36.595 +00:00"
  },
  {
    "id": 102,
    "userId": "73",
    "postId": 102,
    "url": "https://picsum.photos/id/112/600/400",
    "description": "Foto do post: Being in high school, Miles had no idea there",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.601 +00:00",
    "updatedAt": "2026-05-23 04:49:36.601 +00:00"
  },
  {
    "id": 103,
    "userId": "66",
    "postId": 103,
    "url": "https://picsum.photos/id/113/600/400",
    "description": "Foto do post: But they didn't devote the whole evening to",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.607 +00:00",
    "updatedAt": "2026-05-23 04:49:36.607 +00:00"
  },
  {
    "id": 104,
    "userId": "77",
    "postId": 104,
    "url": "https://picsum.photos/id/114/600/400",
    "description": "Foto do post: Each failed overture of peace made the next",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.613 +00:00",
    "updatedAt": "2026-05-23 04:49:36.613 +00:00"
  },
  {
    "id": 105,
    "userId": "97",
    "postId": 105,
    "url": "https://picsum.photos/id/115/600/400",
    "description": "Foto do post: All men dream, but not equally.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.619 +00:00",
    "updatedAt": "2026-05-23 04:49:36.619 +00:00"
  },
  {
    "id": 106,
    "userId": "18",
    "postId": 106,
    "url": "https://picsum.photos/id/116/600/400",
    "description": "Foto do post: Sometimes… Come on, how often exactly,",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.626 +00:00",
    "updatedAt": "2026-05-23 04:49:36.626 +00:00"
  },
  {
    "id": 107,
    "userId": "18",
    "postId": 107,
    "url": "https://picsum.photos/id/117/600/400",
    "description": "Foto do post: She would never know, because he would",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.632 +00:00",
    "updatedAt": "2026-05-23 04:49:36.632 +00:00"
  },
  {
    "id": 108,
    "userId": "174",
    "postId": 108,
    "url": "https://picsum.photos/id/118/600/400",
    "description": "Foto do post: He ran as he'd never run before",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.640 +00:00",
    "updatedAt": "2026-05-23 04:49:36.640 +00:00"
  },
  {
    "id": 109,
    "userId": "23",
    "postId": 109,
    "url": "https://picsum.photos/id/119/600/400",
    "description": "Foto do post: How vulgar, this hankering after",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.648 +00:00",
    "updatedAt": "2026-05-23 04:49:36.648 +00:00"
  },
  {
    "id": 110,
    "userId": "107",
    "postId": 110,
    "url": "https://picsum.photos/id/120/600/400",
    "description": "Foto do post: The embassy's door was of bulletproof steel",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.655 +00:00",
    "updatedAt": "2026-05-23 04:49:36.655 +00:00"
  },
  {
    "id": 111,
    "userId": "112",
    "postId": 111,
    "url": "https://picsum.photos/id/121/600/400",
    "description": "Foto do post: Act, implores the Ghost of Future Regret.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.662 +00:00",
    "updatedAt": "2026-05-23 04:49:36.662 +00:00"
  },
  {
    "id": 112,
    "userId": "32",
    "postId": 112,
    "url": "https://picsum.photos/id/122/600/400",
    "description": "Foto do post: The ship rolls and her timbers creak like",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.669 +00:00",
    "updatedAt": "2026-05-23 04:49:36.669 +00:00"
  },
  {
    "id": 113,
    "userId": "171",
    "postId": 113,
    "url": "https://picsum.photos/id/123/600/400",
    "description": "Foto do post: He let the phone slip from his hand and lay",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.676 +00:00",
    "updatedAt": "2026-05-23 04:49:36.676 +00:00"
  },
  {
    "id": 114,
    "userId": "67",
    "postId": 114,
    "url": "https://picsum.photos/id/124/600/400",
    "description": "Foto do post: When they leave the church, the last light is",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.683 +00:00",
    "updatedAt": "2026-05-23 04:49:36.683 +00:00"
  },
  {
    "id": 115,
    "userId": "72",
    "postId": 115,
    "url": "https://picsum.photos/id/125/600/400",
    "description": "Foto do post: In the days to follow the hacendado would",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.690 +00:00",
    "updatedAt": "2026-05-23 04:49:36.690 +00:00"
  },
  {
    "id": 116,
    "userId": "26",
    "postId": 116,
    "url": "https://picsum.photos/id/126/600/400",
    "description": "Foto do post: Imagine the silence now, in that place which",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.697 +00:00",
    "updatedAt": "2026-05-23 04:49:36.697 +00:00"
  },
  {
    "id": 117,
    "userId": "62",
    "postId": 117,
    "url": "https://picsum.photos/id/127/600/400",
    "description": "Foto do post: Then, perhaps overcome with nostalgia for",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.704 +00:00",
    "updatedAt": "2026-05-23 04:49:36.704 +00:00"
  },
  {
    "id": 118,
    "userId": "57",
    "postId": 118,
    "url": "https://picsum.photos/id/128/600/400",
    "description": "Foto do post: I knew that on the island one was driven",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.711 +00:00",
    "updatedAt": "2026-05-23 04:49:36.711 +00:00"
  },
  {
    "id": 119,
    "userId": "13",
    "postId": 119,
    "url": "https://picsum.photos/id/129/600/400",
    "description": "Foto do post: It was but a hurried parting in a common",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.719 +00:00",
    "updatedAt": "2026-05-23 04:49:36.719 +00:00"
  },
  {
    "id": 120,
    "userId": "105",
    "postId": 120,
    "url": "https://picsum.photos/id/130/600/400",
    "description": "Foto do post: When a woman withdraws to give birth the",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.726 +00:00",
    "updatedAt": "2026-05-23 04:49:36.726 +00:00"
  },
  {
    "id": 121,
    "userId": "7",
    "postId": 121,
    "url": "https://picsum.photos/id/131/600/400",
    "description": "Foto do post: Revolution and youth are closely allied.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.734 +00:00",
    "updatedAt": "2026-05-23 04:49:36.734 +00:00"
  },
  {
    "id": 122,
    "userId": "31",
    "postId": 122,
    "url": "https://picsum.photos/id/132/600/400",
    "description": "Foto do post: The point was we took this shit very",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.743 +00:00",
    "updatedAt": "2026-05-23 04:49:36.743 +00:00"
  },
  {
    "id": 123,
    "userId": "5",
    "postId": 123,
    "url": "https://picsum.photos/id/133/600/400",
    "description": "Foto do post: The old scholar was watching the noisy",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.751 +00:00",
    "updatedAt": "2026-05-23 04:49:36.751 +00:00"
  },
  {
    "id": 124,
    "userId": "150",
    "postId": 124,
    "url": "https://picsum.photos/id/134/600/400",
    "description": "Foto do post: Later, on my walk, I wondered why I felt I",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.759 +00:00",
    "updatedAt": "2026-05-23 04:49:36.759 +00:00"
  },
  {
    "id": 125,
    "userId": "152",
    "postId": 125,
    "url": "https://picsum.photos/id/135/600/400",
    "description": "Foto do post: Looking back on those incidents,",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.768 +00:00",
    "updatedAt": "2026-05-23 04:49:36.768 +00:00"
  },
  {
    "id": 126,
    "userId": "102",
    "postId": 126,
    "url": "https://picsum.photos/id/136/600/400",
    "description": "Foto do post: I hoped she did not dislike me,",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.776 +00:00",
    "updatedAt": "2026-05-23 04:49:36.776 +00:00"
  },
  {
    "id": 127,
    "userId": "43",
    "postId": 127,
    "url": "https://picsum.photos/id/137/600/400",
    "description": "Foto do post: If I may so express it, I was steeped in Dora.",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.784 +00:00",
    "updatedAt": "2026-05-23 04:49:36.784 +00:00"
  },
  {
    "id": 128,
    "userId": "63",
    "postId": 128,
    "url": "https://picsum.photos/id/138/600/400",
    "description": "Foto do post: Lyrical poetry is a realm in which any",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.792 +00:00",
    "updatedAt": "2026-05-23 04:49:36.792 +00:00"
  },
  {
    "id": 129,
    "userId": "128",
    "postId": 129,
    "url": "https://picsum.photos/id/139/600/400",
    "description": "Foto do post: Sometimes, when Chapuys has finished",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.800 +00:00",
    "updatedAt": "2026-05-23 04:49:36.800 +00:00"
  },
  {
    "id": 130,
    "userId": "48",
    "postId": 130,
    "url": "https://picsum.photos/id/140/600/400",
    "description": "Foto do post: Always I had acted as if a third person was watching",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.807 +00:00",
    "updatedAt": "2026-05-23 04:49:36.807 +00:00"
  },
  {
    "id": 131,
    "userId": "30",
    "postId": 131,
    "url": "https://picsum.photos/id/141/600/400",
    "description": "Foto do post: What was I after all?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.815 +00:00",
    "updatedAt": "2026-05-23 04:49:36.815 +00:00"
  },
  {
    "id": 132,
    "userId": "170",
    "postId": 132,
    "url": "https://picsum.photos/id/142/600/400",
    "description": "Foto do post: Now they were in the earth",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.823 +00:00",
    "updatedAt": "2026-05-23 04:49:36.823 +00:00"
  },
  {
    "id": 133,
    "userId": "116",
    "postId": 133,
    "url": "https://picsum.photos/id/143/600/400",
    "description": "Foto do post: He thought of the cost exacted",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.830 +00:00",
    "updatedAt": "2026-05-23 04:49:36.830 +00:00"
  },
  {
    "id": 134,
    "userId": "97",
    "postId": 134,
    "url": "https://picsum.photos/id/144/600/400",
    "description": "Foto do post: He buried her beside her husband",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.839 +00:00",
    "updatedAt": "2026-05-23 04:49:36.840 +00:00"
  },
  {
    "id": 135,
    "userId": "87",
    "postId": 135,
    "url": "https://picsum.photos/id/145/600/400",
    "description": "Foto do post: I was disconcerted, for I had broken away",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.847 +00:00",
    "updatedAt": "2026-05-23 04:49:36.848 +00:00"
  },
  {
    "id": 136,
    "userId": "106",
    "postId": 136,
    "url": "https://picsum.photos/id/146/600/400",
    "description": "Foto do post: You must thrive in spite of yourself",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.856 +00:00",
    "updatedAt": "2026-05-23 04:49:36.856 +00:00"
  },
  {
    "id": 137,
    "userId": "59",
    "postId": 137,
    "url": "https://picsum.photos/id/147/600/400",
    "description": "Foto do post: He once thought it himself, that he might die",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.864 +00:00",
    "updatedAt": "2026-05-23 04:49:36.864 +00:00"
  },
  {
    "id": 138,
    "userId": "126",
    "postId": 138,
    "url": "https://picsum.photos/id/148/600/400",
    "description": "Foto do post: On foot, from necessity or in deference",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.872 +00:00",
    "updatedAt": "2026-05-23 04:49:36.872 +00:00"
  },
  {
    "id": 139,
    "userId": "125",
    "postId": 139,
    "url": "https://picsum.photos/id/149/600/400",
    "description": "Foto do post: He stood over the body in the fading light",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.881 +00:00",
    "updatedAt": "2026-05-23 04:49:36.881 +00:00"
  },
  {
    "id": 140,
    "userId": "150",
    "postId": 140,
    "url": "https://picsum.photos/id/150/600/400",
    "description": "Foto do post: A secret always has a strengthening effect",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.889 +00:00",
    "updatedAt": "2026-05-23 04:49:36.889 +00:00"
  },
  {
    "id": 141,
    "userId": "34",
    "postId": 141,
    "url": "https://picsum.photos/id/151/600/400",
    "description": "Foto do post: A judgment that is necessarily hampered",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.898 +00:00",
    "updatedAt": "2026-05-23 04:49:36.898 +00:00"
  },
  {
    "id": 142,
    "userId": "35",
    "postId": 142,
    "url": "https://picsum.photos/id/152/600/400",
    "description": "Foto do post: For although a man is judged by his actions",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.910 +00:00",
    "updatedAt": "2026-05-23 04:49:36.910 +00:00"
  },
  {
    "id": 143,
    "userId": "34",
    "postId": 143,
    "url": "https://picsum.photos/id/153/600/400",
    "description": "Foto do post: Everything failed to subdue me",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.923 +00:00",
    "updatedAt": "2026-05-23 04:49:36.923 +00:00"
  },
  {
    "id": 144,
    "userId": "104",
    "postId": 144,
    "url": "https://picsum.photos/id/154/600/400",
    "description": "Foto do post: In the hospital men's room",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.934 +00:00",
    "updatedAt": "2026-05-23 04:49:36.935 +00:00"
  },
  {
    "id": 145,
    "userId": "126",
    "postId": 145,
    "url": "https://picsum.photos/id/155/600/400",
    "description": "Foto do post: But just as I didn't want to resent my kids",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.946 +00:00",
    "updatedAt": "2026-05-23 04:49:36.946 +00:00"
  },
  {
    "id": 146,
    "userId": "189",
    "postId": 146,
    "url": "https://picsum.photos/id/156/600/400",
    "description": "Foto do post: Christ, he thinks, by my age I ought to know",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.958 +00:00",
    "updatedAt": "2026-05-23 04:49:36.958 +00:00"
  },
  {
    "id": 147,
    "userId": "126",
    "postId": 147,
    "url": "https://picsum.photos/id/157/600/400",
    "description": "Foto do post: They look so fine, and young",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.968 +00:00",
    "updatedAt": "2026-05-23 04:49:36.968 +00:00"
  },
  {
    "id": 148,
    "userId": "138",
    "postId": 148,
    "url": "https://picsum.photos/id/158/600/400",
    "description": "Foto do post: Your only chance of survival",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.979 +00:00",
    "updatedAt": "2026-05-23 04:49:36.979 +00:00"
  },
  {
    "id": 149,
    "userId": "56",
    "postId": 149,
    "url": "https://picsum.photos/id/159/600/400",
    "description": "Foto do post: During the first part of your life",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:36.991 +00:00",
    "updatedAt": "2026-05-23 04:49:36.991 +00:00"
  },
  {
    "id": 150,
    "userId": "94",
    "postId": 150,
    "url": "https://picsum.photos/id/160/600/400",
    "description": "Foto do post: Were you in love with her?",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.003 +00:00",
    "updatedAt": "2026-05-23 04:49:37.003 +00:00"
  },
  {
    "id": 151,
    "userId": "108",
    "postId": 151,
    "url": "https://picsum.photos/id/161/600/400",
    "description": "Foto do post: The sun set below the horizon",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.015 +00:00",
    "updatedAt": "2026-05-23 04:49:37.015 +00:00"
  },
  {
    "id": 152,
    "userId": "57",
    "postId": 152,
    "url": "https://picsum.photos/id/162/600/400",
    "description": "Foto do post: He gazed at the old photographs",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.026 +00:00",
    "updatedAt": "2026-05-23 04:49:37.027 +00:00"
  },
  {
    "id": 153,
    "userId": "24",
    "postId": 153,
    "url": "https://picsum.photos/id/163/600/400",
    "description": "Foto do post: The forest was alive with the sounds of nature",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.046 +00:00",
    "updatedAt": "2026-05-23 04:49:37.046 +00:00"
  },
  {
    "id": 154,
    "userId": "133",
    "postId": 154,
    "url": "https://picsum.photos/id/164/600/400",
    "description": "Foto do post: She found solace in books",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.053 +00:00",
    "updatedAt": "2026-05-23 04:49:37.053 +00:00"
  },
  {
    "id": 155,
    "userId": "37",
    "postId": 155,
    "url": "https://picsum.photos/id/165/600/400",
    "description": "Foto do post: The city was a jungle of concrete and steel",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.060 +00:00",
    "updatedAt": "2026-05-23 04:49:37.061 +00:00"
  },
  {
    "id": 156,
    "userId": "108",
    "postId": 156,
    "url": "https://picsum.photos/id/166/600/400",
    "description": "Foto do post: He marveled at the starry sky",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.068 +00:00",
    "updatedAt": "2026-05-23 04:49:37.069 +00:00"
  },
  {
    "id": 157,
    "userId": "92",
    "postId": 157,
    "url": "https://picsum.photos/id/167/600/400",
    "description": "Foto do post: The old man told tales of his youth",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.075 +00:00",
    "updatedAt": "2026-05-23 04:49:37.075 +00:00"
  },
  {
    "id": 158,
    "userId": "179",
    "postId": 158,
    "url": "https://picsum.photos/id/168/600/400",
    "description": "Foto do post: The waves crashed against the rocks",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.081 +00:00",
    "updatedAt": "2026-05-23 04:49:37.081 +00:00"
  },
  {
    "id": 159,
    "userId": "9",
    "postId": 159,
    "url": "https://picsum.photos/id/169/600/400",
    "description": "Foto do post: The garden was a riot of color",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.087 +00:00",
    "updatedAt": "2026-05-23 04:49:37.087 +00:00"
  },
  {
    "id": 160,
    "userId": "108",
    "postId": 160,
    "url": "https://picsum.photos/id/170/600/400",
    "description": "Foto do post: She cherished the quiet moments",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.094 +00:00",
    "updatedAt": "2026-05-23 04:49:37.094 +00:00"
  },
  {
    "id": 161,
    "userId": "204",
    "postId": 161,
    "url": "https://picsum.photos/id/171/600/400",
    "description": "Foto do post: The music filled the room",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.100 +00:00",
    "updatedAt": "2026-05-23 04:49:37.100 +00:00"
  },
  {
    "id": 162,
    "userId": "32",
    "postId": 162,
    "url": "https://picsum.photos/id/172/600/400",
    "description": "Foto do post: The lighthouse stood tall on the rocky shore",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.107 +00:00",
    "updatedAt": "2026-05-23 04:49:37.107 +00:00"
  },
  {
    "id": 163,
    "userId": "26",
    "postId": 163,
    "url": "https://picsum.photos/id/173/600/400",
    "description": "Foto do post: She wandered through the ancient ruins",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.113 +00:00",
    "updatedAt": "2026-05-23 04:49:37.113 +00:00"
  },
  {
    "id": 164,
    "userId": "65",
    "postId": 164,
    "url": "https://picsum.photos/id/174/600/400",
    "description": "Foto do post: The desert stretched out before him",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.120 +00:00",
    "updatedAt": "2026-05-23 04:49:37.120 +00:00"
  },
  {
    "id": 165,
    "userId": "133",
    "postId": 165,
    "url": "https://picsum.photos/id/175/600/400",
    "description": "Foto do post: The old bridge spanned the wide river",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.126 +00:00",
    "updatedAt": "2026-05-23 04:49:37.126 +00:00"
  },
  {
    "id": 166,
    "userId": "131",
    "postId": 166,
    "url": "https://picsum.photos/id/176/600/400",
    "description": "Foto do post: She listened to the rain pattering on the roof",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.133 +00:00",
    "updatedAt": "2026-05-23 04:49:37.133 +00:00"
  },
  {
    "id": 167,
    "userId": "118",
    "postId": 167,
    "url": "https://picsum.photos/id/177/600/400",
    "description": "Foto do post: The market was a bustling maze of sights and sounds",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.139 +00:00",
    "updatedAt": "2026-05-23 04:49:37.139 +00:00"
  },
  {
    "id": 168,
    "userId": "110",
    "postId": 168,
    "url": "https://picsum.photos/id/178/600/400",
    "description": "Foto do post: The abandoned mansion loomed on the hill",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.146 +00:00",
    "updatedAt": "2026-05-23 04:49:37.146 +00:00"
  },
  {
    "id": 169,
    "userId": "18",
    "postId": 169,
    "url": "https://picsum.photos/id/179/600/400",
    "description": "Foto do post: The train journey took him through diverse landscapes",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.153 +00:00",
    "updatedAt": "2026-05-23 04:49:37.153 +00:00"
  },
  {
    "id": 170,
    "userId": "208",
    "postId": 170,
    "url": "https://picsum.photos/id/180/600/400",
    "description": "Foto do post: The small village was nestled in a valley",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.160 +00:00",
    "updatedAt": "2026-05-23 04:49:37.160 +00:00"
  },
  {
    "id": 171,
    "userId": "46",
    "postId": 171,
    "url": "https://picsum.photos/id/181/600/400",
    "description": "Foto do post: The library was a haven for book lovers",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.168 +00:00",
    "updatedAt": "2026-05-23 04:49:37.168 +00:00"
  },
  {
    "id": 172,
    "userId": "51",
    "postId": 172,
    "url": "https://picsum.photos/id/182/600/400",
    "description": "Foto do post: The meadow was awash with wildflowers",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.175 +00:00",
    "updatedAt": "2026-05-23 04:49:37.175 +00:00"
  },
  {
    "id": 173,
    "userId": "175",
    "postId": 173,
    "url": "https://picsum.photos/id/183/600/400",
    "description": "Foto do post: He sat at the piano, fingers poised over the keys",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.181 +00:00",
    "updatedAt": "2026-05-23 04:49:37.181 +00:00"
  },
  {
    "id": 174,
    "userId": "198",
    "postId": 174,
    "url": "https://picsum.photos/id/184/600/400",
    "description": "Foto do post: The farmhouse kitchen was a hub of activity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.188 +00:00",
    "updatedAt": "2026-05-23 04:49:37.188 +00:00"
  },
  {
    "id": 175,
    "userId": "128",
    "postId": 175,
    "url": "https://picsum.photos/id/185/600/400",
    "description": "Foto do post: The mountain lake was a mirror",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.195 +00:00",
    "updatedAt": "2026-05-23 04:49:37.196 +00:00"
  },
  {
    "id": 176,
    "userId": "80",
    "postId": 176,
    "url": "https://picsum.photos/id/186/600/400",
    "description": "Foto do post: The city's historic district was a blend of old and new",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.202 +00:00",
    "updatedAt": "2026-05-23 04:49:37.202 +00:00"
  },
  {
    "id": 177,
    "userId": "112",
    "postId": 177,
    "url": "https://picsum.photos/id/187/600/400",
    "description": "Foto do post: The library's grand reading room",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.208 +00:00",
    "updatedAt": "2026-05-23 04:49:37.208 +00:00"
  },
  {
    "id": 178,
    "userId": "201",
    "postId": 178,
    "url": "https://picsum.photos/id/188/600/400",
    "description": "Foto do post: The beach at sunset was a sight to behold",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.215 +00:00",
    "updatedAt": "2026-05-23 04:49:37.215 +00:00"
  },
  {
    "id": 179,
    "userId": "83",
    "postId": 179,
    "url": "https://picsum.photos/id/189/600/400",
    "description": "Foto do post: The old theater was a relic of a glamorous past",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.221 +00:00",
    "updatedAt": "2026-05-23 04:49:37.221 +00:00"
  },
  {
    "id": 180,
    "userId": "195",
    "postId": 180,
    "url": "https://picsum.photos/id/190/600/400",
    "description": "Foto do post: The garden was a sanctuary",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.227 +00:00",
    "updatedAt": "2026-05-23 04:49:37.227 +00:00"
  },
  {
    "id": 181,
    "userId": "36",
    "postId": 181,
    "url": "https://picsum.photos/id/191/600/400",
    "description": "Foto do post: The bookshop was a treasure trove",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.232 +00:00",
    "updatedAt": "2026-05-23 04:49:37.232 +00:00"
  },
  {
    "id": 182,
    "userId": "44",
    "postId": 182,
    "url": "https://picsum.photos/id/192/600/400",
    "description": "Foto do post: The orchard was in full bloom",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.239 +00:00",
    "updatedAt": "2026-05-23 04:49:37.239 +00:00"
  },
  {
    "id": 183,
    "userId": "2",
    "postId": 183,
    "url": "https://picsum.photos/id/193/600/400",
    "description": "Foto do post: The bustling marketplace",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.245 +00:00",
    "updatedAt": "2026-05-23 04:49:37.245 +00:00"
  },
  {
    "id": 184,
    "userId": "185",
    "postId": 184,
    "url": "https://picsum.photos/id/194/600/400",
    "description": "Foto do post: The old journal revealed secrets of the past",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.251 +00:00",
    "updatedAt": "2026-05-23 04:49:37.252 +00:00"
  },
  {
    "id": 185,
    "userId": "201",
    "postId": 185,
    "url": "https://picsum.photos/id/195/600/400",
    "description": "Foto do post: The beach was a paradise",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.258 +00:00",
    "updatedAt": "2026-05-23 04:49:37.258 +00:00"
  },
  {
    "id": 186,
    "userId": "26",
    "postId": 186,
    "url": "https://picsum.photos/id/196/600/400",
    "description": "Foto do post: The village fair was in full swing",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.264 +00:00",
    "updatedAt": "2026-05-23 04:49:37.264 +00:00"
  },
  {
    "id": 187,
    "userId": "11",
    "postId": 187,
    "url": "https://picsum.photos/id/197/600/400",
    "description": "Foto do post: The cabin in the woods",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.270 +00:00",
    "updatedAt": "2026-05-23 04:49:37.270 +00:00"
  },
  {
    "id": 188,
    "userId": "162",
    "postId": 188,
    "url": "https://picsum.photos/id/198/600/400",
    "description": "Foto do post: The art gallery was a feast for the eyes",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.277 +00:00",
    "updatedAt": "2026-05-23 04:49:37.277 +00:00"
  },
  {
    "id": 189,
    "userId": "167",
    "postId": 189,
    "url": "https://picsum.photos/id/199/600/400",
    "description": "Foto do post: The evening concert was magical",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.283 +00:00",
    "updatedAt": "2026-05-23 04:49:37.283 +00:00"
  },
  {
    "id": 190,
    "userId": "188",
    "postId": 190,
    "url": "https://picsum.photos/id/200/600/400",
    "description": "Foto do post: The farm was a bustling hub of activity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.288 +00:00",
    "updatedAt": "2026-05-23 04:49:37.288 +00:00"
  },
  {
    "id": 191,
    "userId": "134",
    "postId": 191,
    "url": "https://picsum.photos/id/201/600/400",
    "description": "Foto do post: The mountain trail was challenging",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.295 +00:00",
    "updatedAt": "2026-05-23 04:49:37.296 +00:00"
  },
  {
    "id": 192,
    "userId": "183",
    "postId": 192,
    "url": "https://picsum.photos/id/202/600/400",
    "description": "Foto do post: The hidden cove was a secret paradise",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.306 +00:00",
    "updatedAt": "2026-05-23 04:49:37.306 +00:00"
  },
  {
    "id": 193,
    "userId": "82",
    "postId": 193,
    "url": "https://picsum.photos/id/203/600/400",
    "description": "Foto do post: The grand ballroom",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.317 +00:00",
    "updatedAt": "2026-05-23 04:49:37.317 +00:00"
  },
  {
    "id": 194,
    "userId": "145",
    "postId": 194,
    "url": "https://picsum.photos/id/204/600/400",
    "description": "Foto do post: The ancient castle stood atop the hill",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.329 +00:00",
    "updatedAt": "2026-05-23 04:49:37.329 +00:00"
  },
  {
    "id": 195,
    "userId": "181",
    "postId": 195,
    "url": "https://picsum.photos/id/205/600/400",
    "description": "Foto do post: The river flowed gently through the valley",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.353 +00:00",
    "updatedAt": "2026-05-23 04:49:37.353 +00:00"
  },
  {
    "id": 196,
    "userId": "164",
    "postId": 196,
    "url": "https://picsum.photos/id/206/600/400",
    "description": "Foto do post: The bustling harbor was alive with activity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.364 +00:00",
    "updatedAt": "2026-05-23 04:49:37.364 +00:00"
  },
  {
    "id": 197,
    "userId": "150",
    "postId": 197,
    "url": "https://picsum.photos/id/207/600/400",
    "description": "Foto do post: The summer festival",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.375 +00:00",
    "updatedAt": "2026-05-23 04:49:37.375 +00:00"
  },
  {
    "id": 198,
    "userId": "156",
    "postId": 198,
    "url": "https://picsum.photos/id/208/600/400",
    "description": "Foto do post: The autumn forest",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.386 +00:00",
    "updatedAt": "2026-05-23 04:49:37.386 +00:00"
  },
  {
    "id": 199,
    "userId": "83",
    "postId": 199,
    "url": "https://picsum.photos/id/209/600/400",
    "description": "Foto do post: The old lighthouse",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.398 +00:00",
    "updatedAt": "2026-05-23 04:49:37.398 +00:00"
  },
  {
    "id": 200,
    "userId": "127",
    "postId": 200,
    "url": "https://picsum.photos/id/210/600/400",
    "description": "Foto do post: The snow-covered village",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.410 +00:00",
    "updatedAt": "2026-05-23 04:49:37.410 +00:00"
  },
  {
    "id": 201,
    "userId": "93",
    "postId": 201,
    "url": "https://picsum.photos/id/211/600/400",
    "description": "Foto do post: The botanical garden",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.423 +00:00",
    "updatedAt": "2026-05-23 04:49:37.423 +00:00"
  },
  {
    "id": 202,
    "userId": "159",
    "postId": 202,
    "url": "https://picsum.photos/id/212/600/400",
    "description": "Foto do post: The starlit sky dazzled above the desert",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.434 +00:00",
    "updatedAt": "2026-05-23 04:49:37.434 +00:00"
  },
  {
    "id": 203,
    "userId": "102",
    "postId": 203,
    "url": "https://picsum.photos/id/213/600/400",
    "description": "Foto do post: The coastal cliffs towered over the crashing waves",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.447 +00:00",
    "updatedAt": "2026-05-23 04:49:37.447 +00:00"
  },
  {
    "id": 204,
    "userId": "19",
    "postId": 204,
    "url": "https://picsum.photos/id/214/600/400",
    "description": "Foto do post: The quaint village square bustled with activity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.459 +00:00",
    "updatedAt": "2026-05-23 04:49:37.459 +00:00"
  },
  {
    "id": 205,
    "userId": "174",
    "postId": 205,
    "url": "https://picsum.photos/id/215/600/400",
    "description": "Foto do post: The ancient temple stood silent in the jungle",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.470 +00:00",
    "updatedAt": "2026-05-23 04:49:37.470 +00:00"
  },
  {
    "id": 206,
    "userId": "142",
    "postId": 206,
    "url": "https://picsum.photos/id/216/600/400",
    "description": "Foto do post: The mountain stream sparkled in the sunlight",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.481 +00:00",
    "updatedAt": "2026-05-23 04:49:37.481 +00:00"
  },
  {
    "id": 207,
    "userId": "157",
    "postId": 207,
    "url": "https://picsum.photos/id/217/600/400",
    "description": "Foto do post: The bustling city market was a melting pot of cultures",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.493 +00:00",
    "updatedAt": "2026-05-23 04:49:37.493 +00:00"
  },
  {
    "id": 208,
    "userId": "61",
    "postId": 208,
    "url": "https://picsum.photos/id/218/600/400",
    "description": "Foto do post: The old oak tree stood sentinel in the meadow",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.504 +00:00",
    "updatedAt": "2026-05-23 04:49:37.504 +00:00"
  },
  {
    "id": 209,
    "userId": "155",
    "postId": 209,
    "url": "https://picsum.photos/id/219/600/400",
    "description": "Foto do post: The traditional tea house exuded warmth and hospitality",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.516 +00:00",
    "updatedAt": "2026-05-23 04:49:37.516 +00:00"
  },
  {
    "id": 210,
    "userId": "180",
    "postId": 210,
    "url": "https://picsum.photos/id/220/600/400",
    "description": "Foto do post: The rural farmstead was a picture of idyllic simplicity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.527 +00:00",
    "updatedAt": "2026-05-23 04:49:37.527 +00:00"
  },
  {
    "id": 211,
    "userId": "12",
    "postId": 211,
    "url": "https://picsum.photos/id/221/600/400",
    "description": "Foto do post: The majestic waterfall cascaded down the cliffside",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.538 +00:00",
    "updatedAt": "2026-05-23 04:49:37.538 +00:00"
  },
  {
    "id": 212,
    "userId": "130",
    "postId": 212,
    "url": "https://picsum.photos/id/222/600/400",
    "description": "Foto do post: The ancient ruins whispered tales of the past",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.550 +00:00",
    "updatedAt": "2026-05-23 04:49:37.550 +00:00"
  },
  {
    "id": 213,
    "userId": "122",
    "postId": 213,
    "url": "https://picsum.photos/id/223/600/400",
    "description": "Foto do post: The sun-dappled forest was alive with the chatter of birds",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.561 +00:00",
    "updatedAt": "2026-05-23 04:49:37.561 +00:00"
  },
  {
    "id": 214,
    "userId": "48",
    "postId": 214,
    "url": "https://picsum.photos/id/224/600/400",
    "description": "Foto do post: The coastal town was a haven for seafood lovers",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.571 +00:00",
    "updatedAt": "2026-05-23 04:49:37.571 +00:00"
  },
  {
    "id": 215,
    "userId": "47",
    "postId": 215,
    "url": "https://picsum.photos/id/225/600/400",
    "description": "Foto do post: The ancient cathedral soared towards the heavens",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.581 +00:00",
    "updatedAt": "2026-05-23 04:49:37.581 +00:00"
  },
  {
    "id": 216,
    "userId": "6",
    "postId": 216,
    "url": "https://picsum.photos/id/226/600/400",
    "description": "Foto do post: The vibrant street market buzzed with energy",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.593 +00:00",
    "updatedAt": "2026-05-23 04:49:37.593 +00:00"
  },
  {
    "id": 217,
    "userId": "120",
    "postId": 217,
    "url": "https://picsum.photos/id/227/600/400",
    "description": "Foto do post: The old windmill stood as a symbol of bygone days",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.603 +00:00",
    "updatedAt": "2026-05-23 04:49:37.604 +00:00"
  },
  {
    "id": 218,
    "userId": "2",
    "postId": 218,
    "url": "https://picsum.photos/id/228/600/400",
    "description": "Foto do post: The bustling city street was a feast for the senses",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.615 +00:00",
    "updatedAt": "2026-05-23 04:49:37.615 +00:00"
  },
  {
    "id": 219,
    "userId": "184",
    "postId": 219,
    "url": "https://picsum.photos/id/229/600/400",
    "description": "Foto do post: The rolling hills stretched to the horizon",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.626 +00:00",
    "updatedAt": "2026-05-23 04:49:37.626 +00:00"
  },
  {
    "id": 220,
    "userId": "174",
    "postId": 220,
    "url": "https://picsum.photos/id/230/600/400",
    "description": "Foto do post: The quaint village inn welcomed weary travelers",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.638 +00:00",
    "updatedAt": "2026-05-23 04:49:37.638 +00:00"
  },
  {
    "id": 221,
    "userId": "61",
    "postId": 221,
    "url": "https://picsum.photos/id/231/600/400",
    "description": "Foto do post: The ancient forest was shrouded in mystery",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.650 +00:00",
    "updatedAt": "2026-05-23 04:49:37.650 +00:00"
  },
  {
    "id": 222,
    "userId": "163",
    "postId": 222,
    "url": "https://picsum.photos/id/232/600/400",
    "description": "Foto do post: The coastal cliffs provided a breathtaking view",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.661 +00:00",
    "updatedAt": "2026-05-23 04:49:37.661 +00:00"
  },
  {
    "id": 223,
    "userId": "199",
    "postId": 223,
    "url": "https://picsum.photos/id/233/600/400",
    "description": "Foto do post: The bustling city square was the heart of urban life",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.672 +00:00",
    "updatedAt": "2026-05-23 04:49:37.672 +00:00"
  },
  {
    "id": 224,
    "userId": "170",
    "postId": 224,
    "url": "https://picsum.photos/id/234/600/400",
    "description": "Foto do post: The ancient aqueducts stood as a testament to engineering prowess",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.683 +00:00",
    "updatedAt": "2026-05-23 04:49:37.683 +00:00"
  },
  {
    "id": 225,
    "userId": "134",
    "postId": 225,
    "url": "https://picsum.photos/id/235/600/400",
    "description": "Foto do post: The remote mountain village was a hidden gem",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.694 +00:00",
    "updatedAt": "2026-05-23 04:49:37.694 +00:00"
  },
  {
    "id": 226,
    "userId": "182",
    "postId": 226,
    "url": "https://picsum.photos/id/236/600/400",
    "description": "Foto do post: The tranquil lake mirrored the surrounding mountains",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.704 +00:00",
    "updatedAt": "2026-05-23 04:49:37.705 +00:00"
  },
  {
    "id": 227,
    "userId": "7",
    "postId": 227,
    "url": "https://picsum.photos/id/237/600/400",
    "description": "Foto do post: The historic castle loomed over the town below",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.716 +00:00",
    "updatedAt": "2026-05-23 04:49:37.716 +00:00"
  },
  {
    "id": 228,
    "userId": "81",
    "postId": 228,
    "url": "https://picsum.photos/id/238/600/400",
    "description": "Foto do post: The bustling harbor was a hive of activity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.727 +00:00",
    "updatedAt": "2026-05-23 04:49:37.727 +00:00"
  },
  {
    "id": 229,
    "userId": "138",
    "postId": 229,
    "url": "https://picsum.photos/id/239/600/400",
    "description": "Foto do post: The charming cottage nestled in a sun-dappled clearing",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.737 +00:00",
    "updatedAt": "2026-05-23 04:49:37.737 +00:00"
  },
  {
    "id": 230,
    "userId": "29",
    "postId": 230,
    "url": "https://picsum.photos/id/240/600/400",
    "description": "Foto do post: The bustling market square was a melting pot of cultures",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.749 +00:00",
    "updatedAt": "2026-05-23 04:49:37.749 +00:00"
  },
  {
    "id": 231,
    "userId": "175",
    "postId": 231,
    "url": "https://picsum.photos/id/241/600/400",
    "description": "Foto do post: The ancient forest whispered secrets to those who dared to listen",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.761 +00:00",
    "updatedAt": "2026-05-23 04:49:37.761 +00:00"
  },
  {
    "id": 232,
    "userId": "89",
    "postId": 232,
    "url": "https://picsum.photos/id/242/600/400",
    "description": "Foto do post: The sun-kissed vineyard stretched across the hills",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.773 +00:00",
    "updatedAt": "2026-05-23 04:49:37.773 +00:00"
  },
  {
    "id": 233,
    "userId": "172",
    "postId": 233,
    "url": "https://picsum.photos/id/243/600/400",
    "description": "Foto do post: The historic town square was a living museum",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.784 +00:00",
    "updatedAt": "2026-05-23 04:49:37.784 +00:00"
  },
  {
    "id": 234,
    "userId": "189",
    "postId": 234,
    "url": "https://picsum.photos/id/244/600/400",
    "description": "Foto do post: The tranquil pond was a haven for wildlife",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.795 +00:00",
    "updatedAt": "2026-05-23 04:49:37.795 +00:00"
  },
  {
    "id": 235,
    "userId": "88",
    "postId": 235,
    "url": "https://picsum.photos/id/245/600/400",
    "description": "Foto do post: The bustling city market was a feast for the senses",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.806 +00:00",
    "updatedAt": "2026-05-23 04:49:37.807 +00:00"
  },
  {
    "id": 236,
    "userId": "35",
    "postId": 236,
    "url": "https://picsum.photos/id/246/600/400",
    "description": "Foto do post: The picturesque waterfall cascaded down the rocky cliffs",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.817 +00:00",
    "updatedAt": "2026-05-23 04:49:37.817 +00:00"
  },
  {
    "id": 237,
    "userId": "178",
    "postId": 237,
    "url": "https://picsum.photos/id/247/600/400",
    "description": "Foto do post: The cozy cabin nestled in the snowy mountains",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.827 +00:00",
    "updatedAt": "2026-05-23 04:49:37.827 +00:00"
  },
  {
    "id": 238,
    "userId": "192",
    "postId": 238,
    "url": "https://picsum.photos/id/248/600/400",
    "description": "Foto do post: The ancient library was a treasure trove of knowledge",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.838 +00:00",
    "updatedAt": "2026-05-23 04:49:37.838 +00:00"
  },
  {
    "id": 239,
    "userId": "83",
    "postId": 239,
    "url": "https://picsum.photos/id/249/600/400",
    "description": "Foto do post: The vibrant city park was a green oasis",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.850 +00:00",
    "updatedAt": "2026-05-23 04:49:37.850 +00:00"
  },
  {
    "id": 240,
    "userId": "205",
    "postId": 240,
    "url": "https://picsum.photos/id/250/600/400",
    "description": "Foto do post: The rustic farmhouse stood amidst fields of golden wheat",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.862 +00:00",
    "updatedAt": "2026-05-23 04:49:37.862 +00:00"
  },
  {
    "id": 241,
    "userId": "90",
    "postId": 241,
    "url": "https://picsum.photos/id/251/600/400",
    "description": "Foto do post: The sunlit garden was a riot of color",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.871 +00:00",
    "updatedAt": "2026-05-23 04:49:37.871 +00:00"
  },
  {
    "id": 242,
    "userId": "60",
    "postId": 242,
    "url": "https://picsum.photos/id/252/600/400",
    "description": "Foto do post: The serene meadow stretched to the horizon",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.879 +00:00",
    "updatedAt": "2026-05-23 04:49:37.879 +00:00"
  },
  {
    "id": 243,
    "userId": "150",
    "postId": 243,
    "url": "https://picsum.photos/id/253/600/400",
    "description": "Foto do post: The quaint village church stood as a beacon of faith",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.888 +00:00",
    "updatedAt": "2026-05-23 04:49:37.888 +00:00"
  },
  {
    "id": 244,
    "userId": "58",
    "postId": 244,
    "url": "https://picsum.photos/id/254/600/400",
    "description": "Foto do post: The ancient ruins were a window into the past",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.894 +00:00",
    "updatedAt": "2026-05-23 04:49:37.894 +00:00"
  },
  {
    "id": 245,
    "userId": "196",
    "postId": 245,
    "url": "https://picsum.photos/id/255/600/400",
    "description": "Foto do post: The tranquil river wound its way through the countryside",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.901 +00:00",
    "updatedAt": "2026-05-23 04:49:37.901 +00:00"
  },
  {
    "id": 246,
    "userId": "88",
    "postId": 246,
    "url": "https://picsum.photos/id/256/600/400",
    "description": "Foto do post: The bustling city streets were alive with energy",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.908 +00:00",
    "updatedAt": "2026-05-23 04:49:37.908 +00:00"
  },
  {
    "id": 247,
    "userId": "132",
    "postId": 247,
    "url": "https://picsum.photos/id/257/600/400",
    "description": "Foto do post: The cozy bookstore was a haven for book lovers",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.915 +00:00",
    "updatedAt": "2026-05-23 04:49:37.915 +00:00"
  },
  {
    "id": 248,
    "userId": "93",
    "postId": 248,
    "url": "https://picsum.photos/id/258/600/400",
    "description": "Foto do post: The vibrant city skyline glittered in the night",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.922 +00:00",
    "updatedAt": "2026-05-23 04:49:37.922 +00:00"
  },
  {
    "id": 249,
    "userId": "149",
    "postId": 249,
    "url": "https://picsum.photos/id/259/600/400",
    "description": "Foto do post: The ancient temple stood as a testament to human ingenuity",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.929 +00:00",
    "updatedAt": "2026-05-23 04:49:37.929 +00:00"
  },
  {
    "id": 250,
    "userId": "52",
    "postId": 250,
    "url": "https://picsum.photos/id/260/600/400",
    "description": "Foto do post: The peaceful village square was a gathering place for locals",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.938 +00:00",
    "updatedAt": "2026-05-23 04:49:37.938 +00:00"
  },
  {
    "id": 251,
    "userId": "187",
    "postId": 251,
    "url": "https://picsum.photos/id/261/600/400",
    "description": "Foto do post: The majestic waterfall thundered down the mountainside",
    "isDefault": 1,
    "createdAt": "2026-05-23 04:49:37.946 +00:00",
    "updatedAt": "2026-05-23 04:49:37.946 +00:00"
  },
  {
    "id": 252,
    "userId": "99",
    "postId": null,
    "url": "https://res.cloudinary.com/dpjwlpes0/image/upload/v1779512781/users/galeria/haevvar0zgrz5ti1cwq4.jpg",
    "description": "Foto de Perfil",
    "isDefault": 1,
    "createdAt": "2026-05-23 05:06:22.243 +00:00",
    "updatedAt": "2026-05-23 05:06:22.244 +00:00"
  },
  {
    "id": 253,
    "userId": "99",
    "postId": null,
    "url": "https://res.cloudinary.com/dpjwlpes0/image/upload/v1779512827/users/galeria/rcw7rtenbawetgacpbjx.jpg",
    "description": "Foto de Perfil",
    "isDefault": 0,
    "createdAt": "2026-05-23 05:07:07.476 +00:00",
    "updatedAt": "2026-05-23 05:07:48.855 +00:00"
  },
  {
    "id": 254,
    "userId": "99",
    "postId": 253,
    "url": "https://res.cloudinary.com/dpjwlpes0/image/upload/v1779512868/users/galeria/ofnqrre59stmgpx0kqgt.jpg",
    "description": "",
    "isDefault": 1,
    "createdAt": "2026-05-23 05:07:48.849 +00:00",
    "updatedAt": "2026-05-23 05:07:48.850 +00:00"
  }
], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('photos', null, {});
  }
};
