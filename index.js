const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const RESULT_PATH = 'results.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token retrieved and stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/* /**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    //pageSize: 10,
    //fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    console.log('found count', files.length)
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(file);

//        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
} */
var folderList = []
var permissionList = []
var requestCount = 0;

function listFiles(auth) {
    var drive = google.drive({ version: 'v3', auth: auth });
    getFolderTree(drive, "");
}


function getFolderTree(drive, nextPageToken) {
    console.log('requesting folder #' + ++requestCount, nextPageToken);
    drive.files.list({
        pageToken: nextPageToken ? nextPageToken : "",
        pageSize: 1000,
        //  q: "mimeType='application/vnd.google-apps.folder'",
        fields: "*",
    }, (err, { data }) => {
        if (err) return console.log('The API returned an error: ' + err);
        const token = data.nextPageToken;
        //  console.log(data);

        //   Array.prototype.push.apply(folderList, data.files);

        folderList.push(...data.files.map((file) => {
            if (file.permissions) {
                permissionList.push(...file.permissions.map((permission) => {
                    if (permission !== 'anyoneWithLink') {
                        return {
                            itemId: file.id,
                            userId: permission.emailAddress,
                            PermissionName: "READ",
                            PermissionMode: "ALLOW",
                            UserType: "user"
                        }
                    }
                }))
            }
            return {
                itemId: file.id,
                itemName: file.name,
                itemType: file.mimeType,
                itemLink: file.webViewLink,
                modifiedDate: file.modifiedTime
            }
        }))
        if (token) {
            getFolderTree(drive, token);
        } else {
            // This script retrieves a folder tree under this folder ID.
            const folderId = "### Top folder ID ###";

            /*    const folderTree = function c(folder, folderSt, res) {
                   let ar = folderList.filter(e => e.parents[0] == folder);
                   folderSt += folder + "#_aabbccddee_#";
                   let arrayFolderSt = folderSt.split("#_aabbccddee_#");
                   arrayFolderSt.pop();
                   res.push(arrayFolderSt);
                   ar.length == 0 && (folderSt = "");
                   ar.forEach(e => c(e.id, folderSt, res));
                   return res;
               }(folderId, "", []);
    */
            // Output the folder tree.
            //console.log(JSON.stringify(folderList))
            console.log('===============================================================')
            //    console.log(JSON.stringify(permissionList))

            fs.writeFile(RESULT_PATH, JSON.stringify(folderList) + JSON.stringify(permissionList), (err) => {
                if (err) return console.error(err);
                console.log('Result stored to', RESULT_PATH);
            });

            console.log('Number of items retrieved: ' + folderList.length);
            console.log('Number of permissions retrieved: ' + permissionList.length);

        }
    });
}