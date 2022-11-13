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
const crystalMineLocations = [];

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

        // sort the filtered crystal mine locations by Y coordinate
        filteredCrystalMineLocations.sort((a, b) => a.location["Y"] - b.location["Y"]);

        // sort the filtered crystal mine locations by X coordinate
        filteredCrystalMineLocations.sort((a, b) => a.location["X"] - b.location["X"]);

        // sort the filtered crystal mine locations by level
        filteredCrystalMineLocations.sort((a, b) => b.level - a.level);

        let messageToSend = '';

        // loop through filtered crystal mine locations
        filteredCrystalMineLocations.forEach(crystalMineLocation => {
            // append to messageToSend
            messageToSend += crystalMineLocation !== undefined && `**X:** ${crystalMineLocation.location["X"]}, **Y:** ${crystalMineLocation.location["Y"]} | **Level:** ${crystalMineLocation.level}\n`;
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

        // sort the crystal mine locations by level
        crystalMineLocations.sort((a, b) => b.level - a.level);

        // loop through crystal mine locations
        crystalMineLocations.forEach(crystalMineLocation => {
            // append to messageToSend
            messageToSend += crystalMineLocation !== undefined && `**X:** ${crystalMineLocation.location["X"]}, **Y:** ${crystalMineLocation.location["Y"]} | **Level:** ${crystalMineLocation.level}\n`;
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
            await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 2000) + 500));
        }

        // send message to discord channel that the bot is done
        client.channels.cache.get(process.env.CHANNEL_ID).send(`------\n**INFO:** Completed my search! I found ${crystalMineLocations.length} crystal mines.\n------`);

        // reset start position
        startPosition = 4095;

        // close websocket connection
        ws.close();

        ws = null;
    }

    ws.on('open', async function open() {
        wsOpen = true;

        // delete all previous messages in the channel
        client.channels.cache.get(process.env.CHANNEL_ID).bulkDelete(100);
        client.channels.cache.get(process.env.CHANNEL_ID).send(`**${process.env.BOT_NAME} is searching Crystal Mines!** 🧐`);

        search();
    });

    ws.onclose = function () {
        // connection closed
        wsOpen = false;
        ws = null;

        let randomTime = Math.floor(Math.random() * 300000) + 120000;

        // send message to discord channel that the bot is done and reseting in X minutes (randomTime)
        client.channels.cache.get(process.env.CHANNEL_ID).send(`------\n**INFO:** Resetting in ${Math.floor(randomTime / 60000)} minutes.\n------`);

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
                    if (object.level === 1 && object.param && object.param.value === 50 && !object.occupied) {
                        // push the object location, level, and param value to the crystalMineLocations array
                        crystalMineLocations.push({
                            location: { "Continent": object.loc[0], "X": object.loc[1], "Y": object.loc[2] },
                            level: object.level,
                        });
                    }

                    // // check if the object is a crystal mine level 2
                    if (object.level === 2 && object.param && object.param.value === 100 && !object.occupied) {
                        // push the object location, level, and param value to the crystalMineLocations array
                        crystalMineLocations.push({
                            location: { "Continent": object.loc[0], "X": object.loc[1], "Y": object.loc[2] },
                            level: object.level,
                        });
                    }

                    // // check if the object is a crystal mine level 3
                    if (object.level === 3 && object.param && object.param.value === 200 && !object.occupied) {
                        // push the object location, level, and param value to the crystalMineLocations array
                        crystalMineLocations.push({
                            location: { "Continent": object.loc[0], "X": object.loc[1], "Y": object.loc[2] },
                            level: object.level,
                        });
                    }

                    // // check if the object is a crystal mine level 4
                    if (object.level === 4 && object.param && object.param.value === 400 && !object.occupied) {
                        // push the object location, level, and param value to the crystalMineLocations array
                        crystalMineLocations.push({
                            location: { "Continent": object.loc[0], "X": object.loc[1], "Y": object.loc[2] },
                            level: object.level,
                        });
                    }

                    // // check if the object is a crystal mine level 5
                    if (object.level === 5 && object.param && object.param.value === 800 && !object.occupied) {
                        // push the object location, level, and param value to the crystalMineLocations array
                        crystalMineLocations.push({
                            location: { "Continent": object.loc[0], "X": object.loc[1], "Y": object.loc[2] },
                            level: object.level,
                        });
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
            while (1) {
                if (wsOpen === false) {
                    // empty crystalMineLocations array
                    crystalMineLocations.length = 0;

                    startWebsocket();
                }

                await new Promise((resolve) => setTimeout(resolve, 10000));
            }
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