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

const AWS = require('aws-sdk');
const qs = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const webshot = require('webshot');
const imgur = require('imgur');
const config = require('./config.json');
const shelljs = require('shelljs');

imgur.setClientId(config['imgur']['clientID']);
const kmsEncryptedToken = 'AQECAHhgNvpiumqxJ3vR4djEGsVfTsD1D/nsXmo42tKbnHcu2gAAAHYwdAYJKoZIhvcNAQcGoGcwZQIBADBgBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNLxa93cWGQhwS2O4gIBEIAzuF1tczZDyCq9Nqe/LxlCsibmAKQfUWOAM41LfDZrC8E7Z8kd5qqXU+ICTzM9IpBCA92P';
let token;

var rurl;

function processEvent(event, callback) {
    const params = qs.parse(event.body);
    const requestToken = params.token;
    if (requestToken !== token) {
        console.error(`Request token (${requestToken}) does not match expected`);
        return callback('Invalid request token');
    }

    const user = params.user_name;
    const command = params.command;
    const channel = params.channel_name;
    const commandText = params.text;
    console.log(event);
    console.log(params.response_url)
    
    
    
    callback(null, {"text":`${user} invoked ${command} in ${channel} with the following text: ${commandText}`});
    }

function scrape(command, resURL) {
    
    resURL = rurl;
    console.log('res: ' + resURL)
    

    //execute('npm -v');
    console.log('pre npm install')
    shelljs.exec('npm install', function(code, stdout, stderr) {
        console.log('Exit code:', code);
        console.log('Program output:', stdout);
        console.log('Program stderr:', stderr);
    }); 
    console.log('here');

    const teamUrl = 'http://stats.siahl.org/display-schedule.php?team=3058&season=37&tlev=0&tseq=0&league=27';

    /*webshot(teamUrl, 'teamstats.png', function(err) {
          // screenshot now saved to google.png
    });*/
    //callback(null, `${user} invoked ${command} in ${channel} with the following text: ${commandText}`);
    //callback(null, `ran command ${command}`);
    //return `ran command ${command}`;
    //
    request(teamUrl, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            let $ = cheerio.load(html);
                        //console.log($('center').children()[3].children[0]);
            //console.log(html);
            let tables = $('table');
            //tables[0] Game Results
            //tables[1] Player Stats
            //tables[2] Goalie Stats
            //tables[3] Team Stats
            //tables[4] Special Teams Stats
            let playerStats = tables[1]
            let playerStatsHTML = '<table border="0"><tbody>'+$(playerStats).html()+ '</tbody></table>';
            //playerStatsHTML ='<html><body>Hello World</body></html>';
            console.log(playerStatsHTML);

            var options = {
                siteType: 'html',
                defaultWhiteBackground: true,
                shotSize: {width: '700', height: '450'}
            };

            webshot(playerStatsHTML, 'teamstats.png', options,  function(err) {
                imgur.uploadFile('teamstats.png')
                .then(function(json) {
                    console.log(json.data.link);
                    return slackResponse(resURL, json.data.link);
                })
                .catch(function (err1) {
                    console.log(err1.message);
                });
                console.log(err);
                console.log('done');
            });

            /*let pstats = {};
            playerStats.children.forEach(function(elm1, index, array) {
                if(index >=2) {
                    pstats.
                    for (let player of playerStats.children[index].children) {
                        pstats
                        console.log(player.children[0].data);
                    }
                }
            });
            */
            //console.log(playerStats);
        }
    });
   
}

function slackResponse(resURL, attachmentURL) {
    console.log(slackResponse);
    let options = {
        url: resURL,
        json: {
            "text": "this is the text",
		    "response_type": "in_channel",
            "attachments": [ 
                {
                    "image_url": attachmentURL
                }
            ]
        }
    };
    //var p = new Promise();
    request.post(options, function(error, response, body) {
        if (error) {
            console.log(error);
            throw new Error(error);            
        } 
        console.log('in post callback');
        console.log(response.statusCode, body);
        return(response.statusCode); 
    }); 

    console.log(options);

	//console.log(command, resURL);
}

function execute(command, callback){
    console.log(command);
    shelljs.exec(command, function(error, stdout, stderr){

        console.log(error)
        console.log('here');
        console.log(stdout); });
};

module.exports.slackResponse = slackResponse;
module.exports.scrape = scrape;
exports.handler = (event, context, callback) => {
    console.log('event');
    console.log(event)

    
    console.log('context');
    console.log(context)

    console.log('callback:')
    console.log(callback.toString());

    const params = qs.parse(event.body);
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? (err.message || err) : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json'
        }
    }, false);
    
    rurl = params.response_url;

    done(null, {"text":`sending the response`});
    
    console.log(params);
        let options = {
        url: params.response_url,
        json: {
            "text": "this is the text"
        }
    };
    console.log(options);
    /*
    request.post(options, function(error, response, body) {
        if (error) {
            console.log(error);
            throw new Error(error);            
        } 
        console.log('in post callback');
        console.log(response.statusCode, body);
        return(response.statusCode); 
    }); */
/*
    if (token) {
        // Container reuse, simply process the event with the key in memory
        //processEvent(event, done);
       //scrape(params.command, params.response_url)
    } else if (kmsEncryptedToken && kmsEncryptedToken !== '<kmsEncryptedToken>') {
        const cipherText = { CiphertextBlob: new Buffer(kmsEncryptedToken, 'base64') };
        const kms = new AWS.KMS();
        kms.decrypt(cipherText, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return done(err);
            }
            token = data.Plaintext.toString('ascii');
            
            //processEvent(event, done);
            //scrape(params.command, params.response_url)
        });
    } else {
        done('Token has not been set.');
    }
*/
};

setTimeout(scrape, 2000);
//scrape();
