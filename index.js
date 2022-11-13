import dotenv from 'dotenv'
dotenv.config()
import { Client, GatewayIntentBits } from 'discord.js';
import WebSocket from 'ws';

// create isJson function to check if a string is a valid json
const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// store crystal mine locations in a map
let crystalMineLocations = [];

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
let loggedIn = false;

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

            // format the time difference to minutes
            let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

            // if hour is greater than 30, then add the crystal mine location to the message
            if (hours >= 30) {
                // append to messageToSend
                messageToSend += crystalMineLocation !== undefined && `**X:** ${crystalMineLocation.location["X"]}, **Y:** ${crystalMineLocation.location["Y"]} | **Level:** ${crystalMineLocation.level} - (${hours}H:${minutes}M)\n`;
            }
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

            // format the time difference to minutes
            let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

            // if hour is greater than 30, then add the crystal mine location to the message
            if (hours >= 30) {
                // append to messageToSend
                messageToSend += crystalMineLocation !== undefined && `**X:** ${crystalMineLocation.location["X"]}, **Y:** ${crystalMineLocation.location["Y"]} | **Level:** ${crystalMineLocation.level} - (${hours}H:${minutes}M)\n`;
            }
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


function startWebsocket() {

    let ws = new WebSocket(process.env.WEBSOCKET_URL);

    async function search() {

        ws.send(`42["/field/enter", {"token":"${process.env.ACCESS_TOKEN}"}]`);

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

        let randomTime = Math.floor(Math.random() * 1000) + 10000;

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
            startWebsocket();
        } catch (error) {
            console.log(error);
        }
    })();
});

// show help message
client.on('messageCreate', msg => {
    if (msg.content === '/help' && (message.channel.id === process.env.CHANNEL_ID)) {
        client.channels.cache.get(process.env.CHANNEL_ID).send(`1. **/help** - Shows this message.\n2. **/cmine level [LEVEL]** - Fetches the crystal mines for the specified level.\n3. **/cmine all** - Fetches all crystal mines.`);
    }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token