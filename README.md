# battalion-bot
slackbot for my ice hockey team

Takes screen shots of various team stats tables, uploads them to imgur and shares the link on our team slack.

## setup

Rename `config-sample.json` to `config.json` and add your variables. 

### Imgur

Imgur, [register your app](https://api.imgur.com/oauth2/addclient) and get the `clientID`. `Anonymous usage without user authorization` is all we need for uploading to imgur. Add your `clientID` to `config.json`

### Slack

Go to https://.slack.com/services/new/slash-commands and create a new slash command

## Deploying

## Deploying Locally

### local tunnel

Create a local tunnel to connect to your custom slack integration. 
```lt --port 8765 --subdomain mybot```

Feel free to replace `mybot` with a custom unqiue name. 

Copy the url that the command above gives you and post it to your slack slash integration settings url field.

Add the url from the 
Run `npm start` 


### Deploying Remotely

I followed: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04


## Resources

I followed this guide: https://medium.com/slack-developer-blog/easy-peasy-slash-commands-getting-started-c37ff3f14d3e#.le1h4yqza
