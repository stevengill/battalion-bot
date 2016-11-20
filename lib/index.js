'use strict';

/*
This function handles a Slack slash command and echoes the details back to the user.

Follow these steps to configure the slash command in Slack:

  1. Navigate to https://<your-team-domain>.slack.com/to

  2. Search for and select "Slash Commands".

  3. Enter a name for your command and click "Add Slash Command Integration".

  4. Copy the token string from the integration settings and use it in the next section.

  5. After you complete this blueprint, enter the provided API endpoint URL in the URL field.


Follow these steps to encrypt your Slack token for use in this function:

  1. Create a KMS key - http://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html

  2. Encrypt the token using the AWS CLI.
     $ aws kms encrypt --key-id alias/<KMS key name> --plaintext "<COMMAND_TOKEN>"

  3. Copy the base-64 encoded, encrypted key (CiphertextBlob) to the kmsEncyptedToken variable.
  AQECAHhgNvpiumqxJ3vR4djEGsVfTsD1D/nsXmo42tKbnHcu2gAAAHYwdAYJKoZIhvcNAQcGoGcwZQIBADBgBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNLxa93cWGQhwS2O4gIBEIAzuF1tczZDyCq9Nqe/LxlCsibmAKQfUWOAM41LfDZrC8E7Z8kd5qqXU+ICTzM9IpBCA92P


Follow these steps to complete the configuration of your command API endpoint

  1. When completing the blueprint configuration select "Open" for security
     on the "Configure triggers" page.

  2. Enter a name for your execution role in the "Role name" field.
     Your function's execution role needs kms:Decrypt permissions. We have
     pre-selected the "KMS decryption permissions" policy template that will
     automatically add these permissions.

  3. Update the URL for your Slack slash command with the invocation URL for the
     created API resource in the prod stage.
*/

const cheerio = require('cheerio');
const webshot = require('webshot');
const imgur = require('imgur');
const config = require('../config.json');
const botkit = require('botkit');
const controller = botkit.slackbot({});
const tiny = require('tiny-json-http');
imgur.setClientId(config['imgur']['clientID']);

var bot = controller.spawn({
    token: config['slack']['token']
});

controller.setupWebserver(8765,function(err,webserver) {
    controller.createWebhookEndpoints(controller.webserver, config['slack']['token']);

});

controller.on('slash_command', (bot,message) => {

  // reply to slash command
  
  handleCmd(bot, message);
  //scrape(bot, message);
});

let handleCmd = (bot, message) => {
    let cmd = message.text.toLowerCase().replace(/\s+/, "");
    let statsUrl = config['teamInfo']['stats'];
    let scheduleUrl = config['teamInfo']['schedule'];
    let opts = {
        "playerStats": {
            "index": ["1"],
            "shotSize": {"width": "700", "height": "450"}
        },
        "gameResults": {
            "index": ["0"],
            "shotSize": {"width": "900", "height": "500"}
        },
        "goalieStats": {
            "index": ["2"],
            "shotSize": {"width": "490", "height": "75"}
        },
        "teamStats": {
            "index": ["3", "4"],
            "shotSize": {"width": "400", "height": "400"}
        },
        "standings": {
            "index": [""],
            "shotSize": {"width": "700", "height": "450"}
        }
    }
    console.log(`cmd: ${cmd}`);
    switch(cmd) {
        case "stats":
        case "playerstats":
            console.log
            scrape(bot, message, statsUrl, opts['playerStats']); 
            break;
        case "results":
        case "gameresults":
            console.log('inside gamestats');
            scrape(bot, message, statsUrl, opts['gameResults']);
            break;
        case "goaliestats":
            scrape(bot, message, statsUrl, opts['goalieStats']);
            break;
        case "teamstats":
            scrape(bot, message, statsUrl, opts['teamStats']);
            break;
        case "schedule": 
            scrape(bot, message, statsUrl, opts['standings']);
            break;
        default:
            bot.replyPrivate(message, "This bot only accepts stats, results, goaliestats, teamstats and standings")
    }
}
let scrape = (bot, message, url, opts) => {

    //slack needs a response within 5 seconds
    bot.replyPrivate(message,'Getting Info');

    tiny.get({url}, function (error, html) {
        if (error) {
            console.log(error);
        }
        //console.log(html);
        if (!error) {
            let $ = cheerio.load(html);
            let tables = $('table');
            /*  tables[0] Game Results
                tables[1] Player Stats
                tables[2] Goalie Stats
                tables[3] Team Stats
                tables[4] Special Teams Stats 
            */
            let res;
            let resHtml;
            //printing more than one table
            if(opts["index"].length > 1) {
                //display two tables for teamStats
                res = tables[opts["index"][0]];
                let res2 = tables[opts["index"][1]];
                resHtml = `<table border="0"><tbody>${$(res).html()}</tbody></table>
                          <table border="0"><tbody>${$(res2).html()}</tbody></table>`;

            } else {
                res = tables[opts["index"][0]];
                resHtml = `<table border="0"><tbody>${$(res).html()}</tbody></table>`;
            }

            var options = {
                siteType: 'html',
                defaultWhiteBackground: false,
                shotSize: opts["shotSize"]
            };

            webshot(resHtml, 'result.png', options,  function(err) {
                if(err) {
                    console.log(err);
                }
                imgur.uploadFile('result.png')
                .then(function(json) {
                    console.log(json.data.link);
                    bot.replyPublicDelayed(message, json.data.link);
                })
                .catch(function (err) {
                    console.log(err);
                });
            });
        }
    });
   
}

module.exports.scrape = scrape;
