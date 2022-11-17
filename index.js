import dotenv from 'dotenv'
dotenv.config()
import { Client, GatewayIntentBits } from 'discord.js';
import WebSocket from 'ws';
// import axios
import axios from 'axios';

// create isJson function to check if a string is a valid json
const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// store crystal mine locations in an array
let crystalMineLocations = [];

// store goblin locations in an array
let goblinLocations = [];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

let startPosition = 4095;
let endPosition = 0;
let wsOpen = false;
let ACCESS_TOKEN = '';

// function to generate random string with min and max length
function randomString(min, max) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < Math.floor(Math.random() * (max - min + 1) + min); i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// get goblin locations from user input and send to discord
// user input format: /goblin level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('/goblin level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the crystal mine locations from goblinLocations
        const filteredGoblinLocations = goblinLocations.filter(goblinLocation => goblinLocation.level === parseInt(level));

        // sort the filtered crystal mine locations by expired time
        filteredGoblinLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered crystal mine locations by level
        filteredGoblinLocations.sort((a, b) => b.level - a.level);

        let messageToSend = '';

        // loop through filtered crystal mine locations
        filteredGoblinLocations.forEach(goblinLocation => {
            let now = new Date().getTime();
            let goblinExpiresData = goblinLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = goblinExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the message
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += goblinLocation !== undefined && `**X:** ${goblinLocation.location["X"]}, **Y:** ${goblinLocation.location["Y"]} | **Level:** ${goblinLocation.level} - (${hours}H Expiry) ${signal}\n`;

        })

        // check if messageToSend is not empty
        if (messageToSend !== '') {
            // send 5 lines at a time using '\n' as the delimiter
            const lines = messageToSend.split('\n');
            const chunk = 5;
            for (let i = 0; i < lines.length; i += chunk) {
                const temparray = lines.slice(i, i + chunk);
                // check if the message is not empty
                if (temparray.join('\n') !== '') {
                    client.channels.cache.get(process.env.CHANNEL_ID).send(temparray.join('\n'));
                }
            }
        } else {
            client.channels.cache.get(process.env.CHANNEL_ID).send('No goblin found for level ' + level);
        }
    }
});

// get crystal mine locations from user input and send to discord
// user input format: /crystalmine level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('/cmine level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the crystal mine locations from crystalMineLocations
        const filteredCrystalMineLocations = crystalMineLocations.filter(crystalMineLocation => crystalMineLocation.level === parseInt(level));

        // sort the filtered crystal mine locations by expired time
        filteredCrystalMineLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered crystal mine locations by level
        filteredCrystalMineLocations.sort((a, b) => b.level - a.level);

        let messageToSend = '';

        // loop through filtered crystal mine locations
        filteredCrystalMineLocations.forEach(crystalMineLocation => {
            let now = new Date().getTime();
            let cmineExpiresData = crystalMineLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = cmineExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the message
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += crystalMineLocation !== undefined && `**X:** ${crystalMineLocation.location["X"]}, **Y:** ${crystalMineLocation.location["Y"]} | **Level:** ${crystalMineLocation.level} - (${hours}H Expiry) ${signal}\n`;
        })

        // check if messageToSend is not empty
        if (messageToSend !== '') {
            // send 5 lines at a time using '\n' as the delimiter
            const lines = messageToSend.split('\n');
            const chunk = 5;
            for (let i = 0; i < lines.length; i += chunk) {
                const temparray = lines.slice(i, i + chunk);
                // check if the message is not empty
                if (temparray.join('\n') !== '') {
                    client.channels.cache.get(process.env.CHANNEL_ID).send(temparray.join('\n'));
                }
            }
        } else {
            client.channels.cache.get(process.env.CHANNEL_ID).send('No crystal mine locations found for level ' + level);
        }
    }
});

// get all crystal mine locations from user input and send to discord
// user input format: /get all
client.on('messageCreate', message => {
    if (message.content.startsWith('/cmine all') && (message.channel.id === process.env.CHANNEL_ID)) {
        let messageToSend = '';

        // sort the filtered crystal mine locations by expired time
        crystalMineLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered crystal mine locations by level
        crystalMineLocations.sort((a, b) => b.level - a.level);

        // loop through crystal mine locations
        crystalMineLocations.forEach(crystalMineLocation => {
            let now = new Date().getTime();
            let cmineExpiresData = crystalMineLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = cmineExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the message
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += crystalMineLocation !== undefined && `**X:** ${crystalMineLocation.location["X"]}, **Y:** ${crystalMineLocation.location["Y"]} | **Level:** ${crystalMineLocation.level} - (${hours}H Expiry) ${signal}\n`;
        })

        // check if messageToSend is not empty
        if (messageToSend !== '') {
            // send 5 lines at a time using '\n' as the delimiter
            const lines = messageToSend.split('\n');
            const chunk = 5;
            for (let i = 0; i < lines.length; i += chunk) {
                const temparray = lines.slice(i, i + chunk);
                // check if the message is not empty
                if (temparray.join('\n') !== '') {
                    client.channels.cache.get(process.env.CHANNEL_ID).send(temparray.join('\n'));
                }
            }
        } else {
            // send message to discord
            client.channels.cache.get(process.env.CHANNEL_ID).send('No crystal mine locations found');
        }
    }
});

// get all goblin locations from user input and send to discord
// user input format: /goblin all
client.on('messageCreate', message => {
    if (message.content.startsWith('/goblin all') && (message.channel.id === process.env.CHANNEL_ID)) {
        // send message to discord
        client.channels.cache.get(process.env.CHANNEL_ID).send('To avoid spam, please use **/goblin level [LEVEL]** command!');
    }
});

function authentication() {

    /*
    * Target endpoint: https://api-lok-live.leagueofkingdoms.com/api/auth/login
    * Method: POST
    * Headers: Content-Type: application/json
    
    * userKey must be random

    * Successful authentication response: {"result":true,"user":{"_id":"6374f66d9271496654f93117","userKey":"6dbb1149-7c36-4966-85d0-be7f8b5ec3b6","authType":"guest","agree":false},"property":{"crystal":0,"purchase":"0","mint":0,"unmint":0,"vip":1,"kingdom":1},"lstProtect":"WyIvYXBpL2tpbmdkb20vZW50ZXIiLCIvYXBpL2tpbmdkb20vaG9zcGl0YWwvcmVjb3ZlciIsIi9hcGkva2luZ2RvbS9yZXNvdXJjZS9oYXJ2ZXN0IiwiL2FwaS9raW5nZG9tL2J1aWxkaW5nL3VwZ3JhZGUiLCIvYXBpL2tpbmdkb20vYnVpbGRpbmcvZGVtb2xpc2giLCIvYXBpL2tpbmdkb20vdHJlYXN1cmUvZXhjaGFuZ2UiLCIvYXBpL2tpbmdkb20vdHJlYXN1cmUvdXBncmFkZSIsIi9hcGkva2luZ2RvbS90cmVhc3VyZS9za2lsbC91cGdyYWRlIiwiL2FwaS9raW5nZG9tL3Rhc2svc3BlZWR1cCIsIi9hcGkva2luZ2RvbS9oZWFsL3NwZWVkdXAiLCIvYXBpL2tpbmdkb20vaGVhbC9pbnN0YW50IiwiL2FwaS9raW5nZG9tL3ZpcHNob3AvYnV5IiwiL2FwaS9raW5nZG9tL3ZpcC9jbGFpbSIsIi9hcGkvZmllbGQvbWFyY2gvaW5mbyIsIi9hcGkvZmllbGQvbWFyY2gvc3RhcnQiLCIvYXBpL2ZpZWxkL21hcmNoL3JldHVybiIsIi9hcGkvZmllbGQvcmFsbHkvc3RhcnQiLCIvYXBpL2ZpZWxkL3JhbGx5L2pvaW4iLCIvYXBpL2ZpZWxkL3RlbGVwb3J0IiwiL2FwaS9pdGVtL3VzZSIsIi9hcGkvaXRlbS9mcmVlY2hlc3QiLCIvYXBpL2l0ZW0vY29tYmluZS9za2luIiwiL2FwaS9hbGxpYW5jZS9naWZ0L2NsYWltIiwiL2FwaS9hbGxpYW5jZS9naWZ0L2NsYWltL2FsbCIsIi9hcGkvcXVlc3QvY2xhaW0iXQ==","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Mzc0ZjY2ZDkyNzE0OTY2NTRmOTMxMTciLCJraW5nZG9tSWQiOiI2Mzc0ZjY2ZDkyNzE0OTY2NTRmOTMxMTgiLCJ3b3JsZElkIjo1MiwidmVyc2lvbiI6MCwiYnVpbGQiOjAsInBsYXRmb3JtIjoiIiwidGltZSI6MTY2ODYwOTY0NTU4NywiY2xpZW50WG9yIjoiMCIsImlhdCI6MTY2ODYwOTY0NSwiZXhwIjoxNjY4NjUyODQ1LCJpc3MiOiJub2RnYW1lcy5jb20iLCJzdWIiOiJ1c2VySW5mbyJ9.oUwZQbLH1cEzxHDWTyaqlv7Q-IXCCAIuXlQHlhsYChI","dbTime":"2022-11-16T14:40:49.271Z","regionHash":"IjcuMzI4MTEwMzcyMTYyMTQ5LTEwMTBub2QtMCI=","joined":true}
    */

    // fetch email from environment variables
    const email = process.env.EMAIL;
    // fetch password from environment variables
    const password = process.env.PASSWORD;

    let headers = {
        "accept": "*/*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site"
    };

    axios.post('https://api-lok-live.leagueofkingdoms.com/api/auth/login',
        `json=%7B%22authType%22%3A%22email%22%2C%22email%22%3A%22${encodeURIComponent(email)}%22%2C%22password%22%3A%22${password}%22%2C%22deviceInfo%22%3A%7B%22OS%22%3A%22Mac%20OS%20X%2010_15_7%22%2C%22country%22%3A%22USA%22%2C%22language%22%3A%22English%22%2C%22bundle%22%3A%22%22%2C%22version%22%3A%221.1539.119.200%22%2C%22platform%22%3A%22web%22%2C%22pushId%22%3A%22532a61c8-2dd2-4ae0-823c-bf262c13aefe%22%2C%22build%22%3A%22global%22%7D%7D`,
        { headers: headers }
    ).then(response => {

        // Validate if the user is authenticated by checking token
        if (response.data.token) {
            // Save the token in the ACCESS_TOKEN variable 
            ACCESS_TOKEN = response.data.token;

            startWebsocket();

            return true;
        }

        return authentication();

    })

}

function startWebsocket() {

    let ws = new WebSocket(process.env.WEBSOCKET_URL);

    async function search() {

        ws.send(`42["/field/enter", {"token":"${ACCESS_TOKEN}"}]`);

        // loop until start position is less than end position
        while (startPosition >= endPosition) {

            // send message to wss
            ws.send(`42["/zone/enter/list/v2", {"world":${process.env.CONTINENT}, "zones":"[${startPosition - 7},${startPosition - 6},${startPosition - 5},${startPosition - 4},${startPosition - 3},${startPosition - 2},${startPosition - 1},${startPosition}]"}]`);
            ws.send(`42["/zone/leave/list/v2", {"world":${process.env.CONTINENT}, "zones":"[${startPosition - 7},${startPosition - 6},${startPosition - 5},${startPosition - 4},${startPosition - 3},${startPosition - 2},${startPosition - 1},${startPosition}]"}]`);

            // decrement start position
            startPosition -= 8;

            // add delay of 1 second to prevent rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // reset start position
        startPosition = 4095;

        // close websocket connection
        ws.close();

        ws = null;
    }

    ws.on('open', async function open() {
        wsOpen = true;

        search();
    });

    ws.onclose = function () {
        // connection closed
        wsOpen = false;
        ws = null;

        // remove objects from crystalMineLocations which has remaining hours less than 30
        crystalMineLocations = crystalMineLocations.filter(crystalMineLocation => {
            let now = new Date().getTime();
            let cmineExpiresData = crystalMineLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = cmineExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            // remove the crystal mine location if hours is less than 30
            return hours >= 30;
        });

        // remove all objects from goblinLocations
        goblinLocations = [];

        let randomTime = Math.floor(Math.random() * 1000) + 5000;

        // start websocket again
        setTimeout(startWebsocket, randomTime)
    };

    ws.on('message', data => {
        // convert data to string
        const dataString = data.toString();

        // parse the data
        const parsedData = dataString.slice(2);

        // check if the data is json parsable
        if (isJson(parsedData)) {
            // parse the data
            const parsedDataJson = JSON.parse(parsedData);

            // check if the data is "/field/objects"
            if (parsedDataJson[0] === '/field/objects') {
                // loop through 'objects' array
                parsedDataJson[1].objects.forEach(object => {

                    /* returns =>
                        {
                        _id: '636f627ee9a37148b7d906af',
                        loc: [ 18, 1785, 2045 ],
                        level: 2,
                        code: 20100101,
                        param: { value: 100000 },
                        state: 1,
                        expired: '2022-11-14T01:43:23.048Z'
                        }
                    */

                    // check if the object is a goblin level 1
                    if (object.level === 1 && object.param && object.param.value === 500 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a crystal mine level 1
                    if (object.level === 1 && object.param && object.param.value === 50) {
                        // if the object already exists in the crystalMineLocations array and object is occupied, then remove it
                        if (crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2] && object.occupied)) {
                            // remove the object from the crystalMineLocations array using the object _id and crystalMineLocations id
                            crystalMineLocations = crystalMineLocations.filter(crystalMineLocation => crystalMineLocation.id !== object._id);
                        }

                        // if the object does not exist in the crystalMineLocations array and object is not occupied, then add it
                        if (!crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2]) && !object.occupied) {
                            // add the object to the crystalMineLocations array
                            crystalMineLocations.push({
                                id: object._id,
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 2
                    if (object.level === 2 && object.param && object.param.value === 5000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // // check if the object is a crystal mine level 2
                    if (object.level === 2 && object.param && object.param.value === 100) {
                        // if the object already exists in the crystalMineLocations array and object is occupied, then remove it
                        if (crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2] && object.occupied)) {
                            // remove the object from the crystalMineLocations array using the object _id and crystalMineLocations id
                            crystalMineLocations = crystalMineLocations.filter(crystalMineLocation => crystalMineLocation.id !== object._id);
                        }

                        // if the object does not exist in the crystalMineLocations array and object is not occupied, then add it
                        if (!crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2]) && !object.occupied) {
                            // add the object to the crystalMineLocations array
                            crystalMineLocations.push({
                                id: object._id,
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 3
                    if (object.level === 3 && object.param && object.param.value === 15000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // // check if the object is a crystal mine level 3
                    if (object.level === 3 && object.param && object.param.value === 200) {
                        // if the object already exists in the crystalMineLocations array and object is occupied, then remove it
                        if (crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2] && object.occupied)) {
                            // remove the object from the crystalMineLocations array using the object _id and crystalMineLocations id
                            crystalMineLocations = crystalMineLocations.filter(crystalMineLocation => crystalMineLocation.id !== object._id);
                        }

                        // if the object does not exist in the crystalMineLocations array and object is not occupied, then add it
                        if (!crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2]) && !object.occupied) {
                            // add the object to the crystalMineLocations array
                            crystalMineLocations.push({
                                id: object._id,
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 4
                    if (object.level === 4 && object.param && object.param.value === 50000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // // check if the object is a crystal mine level 4
                    if (object.level === 4 && object.param && object.param.value === 300) {
                        // if the object already exists in the crystalMineLocations array and object is occupied, then remove it
                        if (crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2] && object.occupied)) {
                            // remove the object from the crystalMineLocations array using the object _id and crystalMineLocations id
                            crystalMineLocations = crystalMineLocations.filter(crystalMineLocation => crystalMineLocation.id !== object._id);
                        }

                        // if the object does not exist in the crystalMineLocations array and object is not occupied, then add it
                        if (!crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2]) && !object.occupied) {
                            // add the object to the crystalMineLocations array
                            crystalMineLocations.push({
                                id: object._id,
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 5
                    if (object.level === 5 && object.param && object.param.value === 150000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // // check if the object is a crystal mine level 5
                    if (object.level === 5 && object.param && object.param.value === 600) {
                        // if the object already exists in the crystalMineLocations array and object is occupied, then remove it
                        if (crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2] && object.occupied)) {
                            // remove the object from the crystalMineLocations array using the object _id and crystalMineLocations id
                            crystalMineLocations = crystalMineLocations.filter(crystalMineLocation => crystalMineLocation.id !== object._id);
                        }

                        // if the object does not exist in the crystalMineLocations array and object is not occupied, then add it
                        if (!crystalMineLocations.some(crystalMineLocation => crystalMineLocation.location["X"] === object.loc[1] && crystalMineLocation.location["Y"] === object.loc[2]) && !object.occupied) {
                            // add the object to the crystalMineLocations array
                            crystalMineLocations.push({
                                id: object._id,
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 6
                    if (object.level === 6 && object.param && object.param.value === 250000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 7
                    if (object.level === 7 && object.param && object.param.value === 500000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                    // check if the object is a goblin level 6
                    if (object.level === 8 && object.param && object.param.value === 750000 && object.code === 20200104) {
                        // if the object does not exist in the goblinLocations array, then add it
                        if (!goblinLocations.some(goblinLocation => goblinLocation.location["X"] === object.loc[1] && goblinLocation.location["Y"] === object.loc[2])) {
                            // add the object to the goblinLocations array
                            goblinLocations.push({
                                location: {
                                    "X": object.loc[1],
                                    "Y": object.loc[2]
                                },
                                level: object.level,
                                expires: new Date(object.expired)
                            });
                        }
                    }

                })

            }
        }
    });
}

// client on ready
client.on('ready', () => {

    client.channels.cache.get(process.env.CHANNEL_ID).send(`Logged in as ${process.env.BOT_NAME}!`);

    (async () => {
        try {
            authentication();
        } catch (error) {
            console.log(error);
        }
    })();
});

// show help message
client.on('messageCreate', message => {
    if (message.content === '/help' && (message.channel.id === process.env.CHANNEL_ID)) {
        client.channels.cache.get(process.env.CHANNEL_ID).send(`1. **/help** - Shows this message.\n2. **/cmine level [LEVEL]** - Fetches the crystal mines for the specified level.\n3. **/cmine all** - Fetches all crystal mines.\n4. **/goblin level [LEVEL]** - Fetches the goblins for the specified level.`);
    }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token