const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const del = require('./delete');

// remove expired subs

console.log('-----------------------------------------------');
const filePath = path.resolve(path.join('./dist', 'users.subs.checked.xml'));
console.log(">>> XML Path >>>>", filePath);
del(filePath);


// async function run() {
//     let filePath;
//     await new Promise((res,rej)=>{
//         filePath = path.resolve(path.join('./dist', 'users.subs.checked.xml'));
//         res();
//     });
//      await del(filePath);
//      console.log(">>>Path >>>>",filePath);
// };
//
// run();
//
// console.log(">>> Finish >>>>");

// const mail = {
//     // from: {
//     //     name: 'Memocast',
//     //     address: 'info@memocast.com'
//     // },
//     to: 'bahinsky@gmail.com',
//     // bcc: 'bahinsky@gmail.com',
//     subject: 'Memocast Payment Processing Error',
//     template: 'deleted-sub',
//     context: {}
// }
// mailer(mail);