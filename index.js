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

// store gold mine locations in an array
let goldMineLocations = [];

// store crystal mine locations in an array
let crystalMineLocations = [];

// store goblin locations in an array
let goblinLocations = [];

// store deathkar locations in an array
let deathkarLocations = [];

// store orc locations in an array
let orcLocations = [];

// store skeleton locations in an array
let skeletonLocations = [];

// store golem locations in an array
let golemLocations = [];

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
let CONTINENT = process.env.CONTINENT;

// get gold mine locations from user input and send to discord
// user input format: /gold level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!gold level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the gold mine locations from goldMineLocations
        const filteredGoldMineLocations = goldMineLocations.filter(goldMineLocation => goldMineLocation.level === parseInt(level));

        // sort the filtered gold mine locations by expired time
        filteredGoldMineLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered gold mine locations by level
        filteredGoldMineLocations.sort((a, b) => b.level - a.level);

        let messageToSend = '';

        // loop through filtered gold mine locations and maximum 10 locations
        for (let i = 0; i < filteredGoldMineLocations.length && i < 50; i++) {
            const goldMineLocation = filteredGoldMineLocations[i];
            messageToSend += `**X:** ${goldMineLocation.location["X"]}, **Y:** ${goldMineLocation.location["Y"]} | **Level:** ${goldMineLocation.level}\n`;
        }

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
            client.channels.cache.get(process.env.CHANNEL_ID).send('No gold mine locations found for level ' + level);
        }
    }
});

// get crystal mine locations from user input and send to discord
// user input format: /crystalmine level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!cmine level') && (message.channel.id === process.env.CHANNEL_ID)) {
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

// get goblin locations from user input and send to discord
// user input format: /goblin level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!goblin level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the goblin locations from goblinLocations
        const filteredGoblinLocations = goblinLocations.filter(goblinLocation => goblinLocation.level === parseInt(level));

        // sort the filtered goblin locations by expired time
        filteredGoblinLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered goblin locations by level
        filteredGoblinLocations.sort((a, b) => b.level - a.level);

        // limit the number of goblin locations to 50
        filteredGoblinLocations.length = 50;

        let messageToSend = '';

        // loop through filtered goblin locations
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

// get deathkar locations from user input and send to discord
// user input format: /deathkar level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!deathkar level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the deathkar locations from deathkarLocations
        const filteredDeathkarLocations = deathkarLocations.filter(deathkarLocation => deathkarLocation.level === parseInt(level));

        // sort the filtered deathkar locations by expired time
        filteredDeathkarLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered deathkar locations by level
        filteredDeathkarLocations.sort((a, b) => b.level - a.level);

        // limit the filtered deathkar locations to 50
        filteredDeathkarLocations.length = 50;

        let messageToSend = '';

        // loop through filtered deathkar locations
        filteredDeathkarLocations.forEach(deathkarLocation => {
            let now = new Date().getTime();
            let deathkarExpiresData = deathkarLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = deathkarExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += deathkarLocation !== undefined && `**X:** ${deathkarLocation.location["X"]}, **Y:** ${deathkarLocation.location["Y"]} | **Level:** ${deathkarLocation.level} - (${hours}H Expiry) ${signal}\n`;

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
            client.channels.cache.get(process.env.CHANNEL_ID).send('No deathkar found for level ' + level);
        }
    }
});

// get orc locations from user input and send to discord
// user input format: /orc level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!orc level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the orc locations from orcLocations
        const filteredOrcLocations = orcLocations.filter(orcLocation => orcLocation.level === parseInt(level));

        // sort the filtered orc locations by expired time
        filteredOrcLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered orc locations by level
        filteredOrcLocations.sort((a, b) => b.level - a.level);

        // limit the number of locations to 50
        filteredOrcLocations.length = 50;

        let messageToSend = '';

        // loop through filtered orc locations
        filteredOrcLocations.forEach(orcLocation => {
            let now = new Date().getTime();
            let orcExpiresData = orcLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = orcExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += orcLocation !== undefined && `**X:** ${orcLocation.location["X"]}, **Y:** ${orcLocation.location["Y"]} | **Level:** ${orcLocation.level} - (${hours}H Expiry) ${signal}\n`;

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
            client.channels.cache.get(process.env.CHANNEL_ID).send('No orc found for level ' + level);
        }
    }
});

// get skeleton locations from user input and send to discord
// user input format: /skeleton level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!skeleton level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the skeleton locations from skeletonLocations
        const filteredSkeletonLocations = skeletonLocations.filter(skeletonLocation => skeletonLocation.level === parseInt(level));

        // sort the filtered skeleton locations by expired time
        filteredSkeletonLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered skeleton locations by level
        filteredSkeletonLocations.sort((a, b) => b.level - a.level);

        // limit the filtered skeleton locations to 50
        filteredSkeletonLocations.length = 50;

        let messageToSend = '';

        // loop through filtered skeleton locations
        filteredSkeletonLocations.forEach(skeletonLocation => {
            let now = new Date().getTime();
            let skeletonExpiresData = skeletonLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = skeletonExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += skeletonLocation !== undefined && `**X:** ${skeletonLocation.location["X"]}, **Y:** ${skeletonLocation.location["Y"]} | **Level:** ${skeletonLocation.level} - (${hours}H Expiry) ${signal}\n`;

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
            client.channels.cache.get(process.env.CHANNEL_ID).send('No skeleton found for level ' + level);
        }
    }
});

// get golem locations from user input and send to discord
// user input format: /golem level [level]
client.on('messageCreate', message => {
    if (message.content.startsWith('!golem level') && (message.channel.id === process.env.CHANNEL_ID)) {
        // get the level from the user input
        const level = message.content.split(' ')[2];

        // get the golem locations from golemLocations
        const filteredGolemLocations = golemLocations.filter(golemLocation => golemLocation.level === parseInt(level));

        // sort the filtered golem locations by expired time
        filteredGolemLocations.sort((a, b) => b.expires - a.expires);

        // sort the filtered golem locations by level
        filteredGolemLocations.sort((a, b) => b.level - a.level);

        // limit the filtered golem locations to 50
        filteredGolemLocations.length = 50;

        let messageToSend = '';

        // loop through filtered golem locations
        filteredGolemLocations.forEach(golemLocation => {
            let now = new Date().getTime();
            let golemExpiresData = golemLocation.expires;

            // get the time difference between now and the crystal mine location expires time
            let timeDifference = golemExpiresData.getTime() - now;

            // format the time difference to hours
            let hours = Math.floor(timeDifference / (1000 * 60 * 60));

            let signal = '🔴';

            // if hour is greater than 30, then add the crystal mine location to the
            if (hours >= 40) {
                signal = '🟢';
            } else if (hours >= 30) {
                signal = '🟡';
            } else if (hours >= 20) {
                signal = '🟠';
            }

            // append to messageToSend
            messageToSend += golemLocation !== undefined && `**X:** ${golemLocation.location["X"]}, **Y:** ${golemLocation.location["Y"]} | **Level:** ${golemLocation.level} - (${hours}H Expiry) ${signal}\n`;

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
            client.channels.cache.get(process.env.CHANNEL_ID).send('No golem found for level ' + level);
        }
    }
});

// get all crystal mine locations from user input and send to discord
// user input format: /get all
client.on('messageCreate', message => {
    if (message.content.startsWith('!cmine all') && (message.channel.id === process.env.CHANNEL_ID)) {
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

// get all deathkar locations from user input and send to discord
// user input format: /deathkar all
client.on('messageCreate', message => {
    if (message.content.startsWith('/deathkar all') && (message.channel.id === process.env.CHANNEL_ID)) {
        // send message to discord
        client.channels.cache.get(process.env.CHANNEL_ID).send('To avoid spam, please use **/deathkar level [LEVEL]** command!');
    }
});

// get all orc locations from user input and send to discord
// user input format: /orc all
client.on('messageCreate', message => {
    if (message.content.startsWith('/orc all') && (message.channel.id === process.env.CHANNEL_ID)) {
        // send message to discord
        client.channels.cache.get(process.env.CHANNEL_ID).send('To avoid spam, please use **/orc level [LEVEL]** command!');
    }
});

// get all skeleton locations from user input and send to discord
// user input format: /skeleton all
client.on('messageCreate', message => {
    if (message.content.startsWith('/skeleton all') && (message.channel.id === process.env.CHANNEL_ID)) {
        // send message to discord
        client.channels.cache.get(process.env.CHANNEL_ID).send('To avoid spam, please use **/skeleton level [LEVEL]** command!');
    }
});

// get all golem locations from user input and send to discord
// user input format: /golem all
client.on('messageCreate', message => {
    if (message.content.startsWith('/golem all') && (message.channel.id === process.env.CHANNEL_ID)) {
        // send message to discord
        client.channels.cache.get(process.env.CHANNEL_ID).send('To avoid spam, please use **/golem level [LEVEL]** command!');
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
        if (response && response.data && response.data.token) {

            client.channels.cache.get(process.env.CHANNEL_ID).send('```ini\n[Now Searching Resources]\n```');

            // Save the token in the ACCESS_TOKEN variable 
            ACCESS_TOKEN = response.data.token;

            // Start websocket connection
            startWebsocket();

            // Exit the function
            return;
        }

        // If the user is not authenticated, then restart authentication() and send message to discord
        client.channels.cache.get(process.env.CHANNEL_ID).send('```diff\n- Authentication Failed! Account banned. ⚠️```');

        // Pause the script for 1 minute
        setTimeout(() => {
            // Restart authentication()
            authentication();
        }, 60000);
    })

}

async function sendLocation(level, objectCode, continent, x, y) {
    let headers = {
        "accept": "*/*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-access-token": ACCESS_TOKEN
    };

    axios.post('https://api-lok-live.leagueofkingdoms.com/api/chat/channels',
        `json=%7B%7D`,
        { headers: headers }
    )

    axios.post('https://api-lok-live.leagueofkingdoms.com/api/chat/new',
        `json%3D%7B%22chatChannel%22%3A2%2C%22chatType%22%3A2%2C%22text%22%3A%22Lv.${level}%3Ffo_${objectCode}%22%2C%22param%22%3A%7B%22loc%22%3A%5B${continent}%2C${x}%2C${y}%5D%7D%7D`,
        { headers: headers }
    )
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
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // reset start position
        startPosition = 4095;

        // close websocket connection
        ws.close();

        ws = null;
    }

    ws.on('open', async function open() {
        wsOpen = true;

        // empty goldMineLocations array
        goldMineLocations = [];

        // empty crystalMineLocations array
        crystalMineLocations = [];

        // empty goblinLocations array
        goblinLocations = [];

        search();
    });

    ws.onclose = function () {
        // connection closed
        wsOpen = false;
        ws = null;

        // send message to discord channel informing that the search is complete
        client.channels.cache.get(process.env.CHANNEL_ID).send('```ini\n[Search Complete 🎉]\n```');
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

                    // check if the object is a gold mine
                    if (object.code === 20100104) {
                        // if the object is not occupied, then add it
                        if (!object.occupied) {
                            // add the object to the goldMineLocations array
                            goldMineLocations.push({
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

                    // // check if the object is a crystal mine
                    if (object.code === 20100105) {
                        // if the object is not occupied, then add it
                        if (!object.occupied) {
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

                            // check if remaining expired time is greater than 40 hours
                            if (new Date(object.expired) - Date.now() > 144000000) {
                                if (object.level === 1) {
                                    // send cmine location to master account
                                    sendLocation(object.level, object.code, CONTINENT, object.loc[1], object.loc[2]);
                                }
                            }

                            // check if remaining expired time is greater than 40 hours
                            if (new Date(object.expired) - Date.now() > 144000000) {
                                if (object.level === 2) {
                                    // send cmine location to master account
                                    sendLocation(object.level, object.code, CONTINENT, object.loc[1], object.loc[2]);
                                }
                            }

                            // check if remaining expired time is greater than 40 hours
                            if (new Date(object.expired) - Date.now() > 144000000) {
                                if (object.level === 3) {
                                    // send cmine location to master account
                                    sendLocation(object.level, object.code, CONTINENT, object.loc[1], object.loc[2]);
                                }
                            }
                        }

                    }

                    // check if the object is a goblin
                    if (object.code === 20200104) {
                        goblinLocations.push({
                            location: {
                                "X": object.loc[1],
                                "Y": object.loc[2]
                            },
                            level: object.level,
                            expires: new Date(object.expired)
                        });
                    }

                    // check if the object is a deathkar
                    if (object.code === 20200201) {
                        deathkarLocations.push({
                            location: {
                                "X": object.loc[1],
                                "Y": object.loc[2]
                            },
                            level: object.level,
                            expires: new Date(object.expired)
                        });
                    }

                    // check if the object is an orc
                    if (object.code === 20200101) {
                        deathkarLocations.push({
                            location: {
                                "X": object.loc[1],
                                "Y": object.loc[2]
                            },
                            level: object.level,
                            expires: new Date(object.expired)
                        });
                    }

                    // check if the object is a skeleton
                    if (object.code === 20200102) {
                        skeletonLocations.push({
                            location: {
                                "X": object.loc[1],
                                "Y": object.loc[2]
                            },
                            level: object.level,
                            expires: new Date(object.expired)
                        });
                    }

                    // check if the object is a golem
                    if (object.code === 20200103) {
                        golemLocations.push({
                            location: {
                                "X": object.loc[1],
                                "Y": object.loc[2]
                            },
                            level: object.level,
                            expires: new Date(object.expired)
                        });
                    }

                })

            }
        }
    });
}

// client on ready
client.on('ready', () => {
    client.channels.cache.get(process.env.CHANNEL_ID).send('```ini\n[Connected to Discord]\n```');
});

// search command
client.on('messageCreate', async message => {
    if (message.content === '!search' && (message.channel.id === process.env.CHANNEL_ID)) {
        // check if wsOpen is false
        if (!wsOpen) {
            authentication();
        } else {
            // send message to discord channel informing that the search is already running
            client.channels.cache.get(process.env.CHANNEL_ID).send('```ini\n[Search is already running 🤖]\n```');
        }
    }
});

// show help message
client.on('messageCreate', message => {
    if (message.content === '!help' && (message.channel.id === process.env.CHANNEL_ID)) {
        client.channels.cache.get(process.env.CHANNEL_ID).send(`1. **!help** - Shows this message.\n2. **!cmine level [LEVEL]** - Fetches the crystal mines for the specified level.\n3. **!cmine all** - Fetches all crystal mines.\n4. **!goblin level [LEVEL]** - Fetches the goblins for the specified level.\n5. **!deathkar level [LEVEL]** - Fetches the deathkar for the specified level.\n6. **!orc level [LEVEL]** - Fetches the orc for the specified level.\n7. **!skeleton level [LEVEL]** - Fetches the skeleton for the specified level.\n8. **!golem level [LEVEL]** - Fetches the golem for the specified level.\n9. **!gold level [LEVEL]** - Fetches the gold mines for the specified level.\n10. **!search** - Searches the map.`);
    }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token