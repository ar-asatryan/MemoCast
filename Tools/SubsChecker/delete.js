const fs = require('fs');
const models = require('../../Common/models');
const parse = require('xml2js').parseString;
const validator = require('validator');

const mailer = require('./mailer');

//considering mailer as a separate function and async operation
const sendMailNotification = (email) => {
    try {
        if (validator.isEmail(email)) {
            const mail = {
                from: 'info@memocast.com',
                to: email,
                subject: 'Memocast Payment Processing Error',
                template: 'deleted-sub',
                context: {}
            };
            mailer(mail);
            console.log(`Notification sent to ${email}`);
        } else {
            const message = `Incorrent email ${email}`;
            console.log(message);
        }
    } catch (e) {
        const message = `Error ocurred during sending notification to ${email}`;
        console.log(message);
        console.log(e);
    }

};

//takes the users.subs.checked.xml file and read each subs>>
module.exports = async (xmlFilePath) => {

    const xml = fs.readFileSync(xmlFilePath, 'utf8');
    //console.log("!!!!Starts xmL File Path Function>>>>>>>>>>>>>>>>>>\n", xml, "End of xmL data !!!\n");

    const subs = await new Promise((resolve, reject) => {
        parse(xml, (err, obj) => {
            if (!!err) { reject(err); }
            const subs = obj.users.user.map(usr => {
                const [ userID ] = usr.id;
                const [ subID ] = usr.subs_id;
                const [ sub ] = usr.subscription;
                const [ status ] = sub.status;
                return {
                    userID,
                    subID,
                    status
                };
            }).filter(usr => {
                return usr.status !== 'CURRENT';
            });
            resolve(subs)
        });
    });
    console.log('Subscriptions of Declined Users>>>>>>>>> \n', subs);

    // process expired subscription
    for (let sub of subs) {

        const { userID, subID } = sub;
        //console.log('Welcome inside a LOOP--------->sub>\n', sub);

        try {

            // get user by id
            const usr = await models.User.findById(userID);
            if (!usr) { continue; }
            //console.log('models.User.findById(userID);--------->usr> \n', usr);

            // find expired subscription
            const { subs: userSubs = [], email = null, sex } = usr;
            //console.log('const { subs: userSubs = [], email = null, sex } = usr;--> WANTED--------> \n', usr);
            const [ subForCancelation ] = userSubs.filter((item) => {
                const { active = false, cybersource = {} } = item;
                if (!active) { return false; }
                //console.log('**********ITEM*********if (!active) { return false; }-----------------> WANTED--------> \n', item);
                return cybersource['subscription-id'] === subID;
            });
            //console.log('Sending Notification to !!!!!subForCancelation---------------> WANTED-------->1 \n', subForCancelation);
            if (!subForCancelation) { continue; }

            // mark sub as expired
            subForCancelation.active = false;

            // add temp sub to subs
            const createDate = new Date;
            // add 2 days (48 hours) from now to expiration date
            const expire = new Date(createDate.getTime() + (2 * 24 * 60 * 60 * 1000));
            const tempSub = {
                active: true,
                createDate,
                kind: 'onetime',
                expire,
                notes: 'Temporary Subscription'
            };
            // push temp sub to subs array
            userSubs.push(tempSub);
            usr.subs = userSubs;

            // fix null bug for user's sex property
            usr.sex = !sex ? 'unspecified' : sex;
            // save usr to db
            await usr.save();

            if (!!email) {
                sendMailNotification(email);
                // sendMailNotification('bahinsky@gmail.com');
            }

            // console.log(`SUBS ${subID} canceled for user ${userID}`);

        } catch (e) {
            console.log(`Error for user ${userID}`);
            console.log(e);
        }

    }
};