const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const ytsr = require('ytsr');

// const filters1 = await ytsr.getFilters('github');
// const filter1 = filters1.get('Type').get('Video');
// const filters2 = await ytsr.getFilters(filter1.url);
// const filter2 = filters2.get('Features').get('Live');
// const options = {
//   pages: 2,
// }


const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
   // client.user.setUsername("Rubato Sonata");
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  const serverQueue = queue.get(message.guild.id);
  // if (message.content.startsWith(`${prefix}play`)) {
  //   execute(message, serverQueue);
  //   return;
  // } 
  // else 
  if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}leave`)) {
    stop(message, serverQueue);
    return;
  }else if (message.content.startsWith(`${prefix}queue`)){
    queueList(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}delete`)){
    deleteQueue(message, serverQueue)
    return;
  } else if (message.content.startsWith(`${prefix}play`)){
    if(!message.content.split("play ")[1]){
      message.channel.send('You need to mention a song')
      return;
    }
    const searchResults = await ytsr(message.content.split("play ")[1],{ pages: 1 });
    //console.log("+play " +searchResults.items[0].url);
    executeNourl(message,serverQueue,searchResults.items[0].url)
  }else if (message.content.startsWith(`${prefix}help`)){
    help(message,serverQueue)
  }
  else {
    message.channel.send("You need to enter a valid command!");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

async function executeNourl(message, serverQueue,url) {
  const args = url;

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function help(message, serverQueue) {
  const file = new Discord.MessageAttachment('../assets/logo.jpeg');
  const help = new Discord.MessageEmbed()
  .setColor('#FFC000')
  .setThumbnail('attachment://logo.jpeg')
  .addFields([
    {
      name: '\u200B',
      value: "**HAALLLPPP!!!**\n\n__Commands__\n\n-play\n<plays the song or url>\n\n-skip\n<Skips Duh .. >\n\n-leave\n<Runs for life and leaves the VC>\n\n-queue\n<Dont even... yeah it queues>",
      isInline: true
    }
  ])
  message.channel.send(help)
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could stop!");
    
  
  serverQueue.connection.dispatcher.end();
  serverQueue.songs = [];
}

function deleteQueue(message, serverQueue){
 
  // queue.get(guild.id)
    if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I can list");
    var queueList = serverQueue.songs;
    console.log(queueList);
    console.log(message.content.split("+delete ")[1])
    serverQueue.songs.shift(message.content.split("+delete ")[1])
    // .shift(message.content.split("+delete ")[1])
}

function queueList(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I can list");
     var queueList = serverQueue.songs;
     console.log(queueList);
     var songs = []
     queueList.map(data => {
         songs.push(data.title)
     })
     let response ;
     for (var i in queueList) {
        response = i+'.'+queueList[i].title
        message.channel.send(response);
        }
  }

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  async function searchYouTubeAsync(args) {
    var video = await youtube.searchVideos(args.toString().replace(/,/g,' '));
    console.log(video.url);
    console.log(typeof String(video.url));
    return String(video.url);
 }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.login(token);