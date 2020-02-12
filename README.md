# Google Drive Connector

## To install
Clone/download repository to a machine with Node JS installed.
Then run 
`npm install` to installl necessary node module dependencies - these are omitted from the repository on purpose with .gitignore.

## To run the connector

Then run `node index.js` *(On first run, this will prompt the user to go to a URL to grant permission to the App in Google API.  Copy the generated Auth Code, paste it into the commandline to authorize the app and hit enter. This will create a token.json and then continue with results retrieval.)*

If there are no error - this will create a `results.json` file.

These are both *(token.json and results.json)* local to the install and are thus ignored in the .gitignore file.

