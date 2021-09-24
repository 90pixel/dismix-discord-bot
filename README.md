<img width="230" height="150" align="left" style="float: left; margin: 0 10px 0 0;" alt="90Pixel" src="https://media.discordapp.net/attachments/824366760744321075/856539971409805342/90px.png">  

# Dismix Bot

## Description

You can listen to music on youtube, write channel messages to a file and see user logs.


## Installation

Builded with NestJS

```bash
$ https://github.com/90pixel/dismix-discord-bot
$ cd dismix-discord-bot
$ npm install
```
Fill the .env variables and setup your db for logs and new feautres


## Run with docker

>Note: Docker files uses .dev.env

```docker
docker-compose up -d
```

## Running the app

```bash
# dev mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Alternative
```bash
$ pm2 startOrRestart ecosystem.config.js --only dismix-bot-`$env` --env `$env` && pm2 save
```

## Permissions

* Application uses slash commands. So you have to ``applications.commands`` enabled.

## Deploying Commands
> Note: Only bot author can do this command.

Before using bot with music feature, you have to deploy commands to your Discord Server. Use ``!deploy`` command to do.

<img src="./public/assets/bot-deployed.png">

After use ``!deploy`` command you can see commands by typing a ``slash``

<img src="./public/assets/commands.png">

## Features & Commands

### Slash Commands

* Play music with given YouTube Url

``/play YouTubeURL``

* Show queued list

``/queue``
  
* Skip current song

``/skip``

* Pause current song

```/pause```

* Resume current song

``/resume``

* Leave from channel

``/leave``


<img src="./public/assets/que.png">

### Prefixed Commands ``!``

* You can check user presence updates with setting a log channel for it. Only bot author can do it. Basically you can get the channel id by clicking channel with right click then copy the ID.

```!log-channel {$channelId}```

<img src="./public/assets/log-channel.png">

Either way you can update your log channel too.

After create a log channel, you will able to see presence updates with their time.

<img src="./public/assets/log-detail.png">

* You can set log status active or passive

``!logs active``

``!logs passive``

<img src="./public/assets/stop-logs.png">

* Show Online & Offline Members

``!online-members``

``!offline-members``

<img src="./public/assets/online-members.png">


* Send private message to mentioned users.
```!send-message [message] @Shanks @.. @.. @..```

<img src="./public/assets/mentioned.png">

* History of a channel as json and save the root directory

``!history``

<img src="./public/assets/history.png">

```json
[
    {
        "username": "Shanks",
        "timestamp": "23/09/2021 - 02:44:25 AM",
        "content": "!history"
    },
    {
        "username": "Biohazard",
        "timestamp": "23/09/2021 - 02:31:49 AM",
        "content": "Hello!"
    },
    {
        "username": "Shanks",
        "timestamp": "23/09/2021 - 02:12:02 AM",
        "content": "!deploy"
    }
]
```

## Contributing

Feel free the pull request.

## Author

[Çağrı Sungur](https://github.com/cagrisungur) - Part of 90Pixel Team

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details




