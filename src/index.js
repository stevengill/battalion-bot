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
const http = require('http');

const kmsEncryptedToken = 'AQECAHhgNvpiumqxJ3vR4djEGsVfTsD1D/nsXmo42tKbnHcu2gAAAHYwdAYJKoZIhvcNAQcGoGcwZQIBADBgBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNLxa93cWGQhwS2O4gIBEIAzuF1tczZDyCq9Nqe/LxlCsibmAKQfUWOAM41LfDZrC8E7Z8kd5qqXU+ICTzM9IpBCA92P';
let token;


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
    scrape(commandText, params.response_url)
    callback(null, {"text":`${user} invoked ${command} in ${channel} with the following text: ${commandText}`, "response_type": "in_channel"});

    }

function scrape(command, url) {
    //callback(null, `${user} invoked ${command} in ${channel} with the following text: ${commandText}`);
    //callback(null, `ran command ${command}`);
    //return `ran command ${command}`;
    console.log(command, url);
}


exports.handler = (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? (err.message || err) : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (token) {
        // Container reuse, simply process the event with the key in memory
        processEvent(event, done);
    } else if (kmsEncryptedToken && kmsEncryptedToken !== '<kmsEncryptedToken>') {
        const cipherText = { CiphertextBlob: new Buffer(kmsEncryptedToken, 'base64') };
        const kms = new AWS.KMS();
        kms.decrypt(cipherText, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return done(err);
            }
            token = data.Plaintext.toString('ascii');
            processEvent(event, done);
        });
    } else {
        done('Token has not been set.');
    }
};
